"""
Coleta saúde fiscal dos municípios via SICONFI (Tesouro Nacional):
  - Receitas Realizadas Líquidas (via DCA-Anexo I-C, conta ReceitasExcetoIntraOrcamentarias)
  - Despesas Liquidadas (via DCA-Anexo I-D, conta TotalDespesas)
  - Resultado Orçamentário e classificação em deficitário ou superavitário.

Tabela afetada: municipios_financas

Uso:
  python collect_financas.py [--ano 2024] [--uf AC]
"""

import argparse
import logging
import os
import time
from datetime import datetime

import psycopg
import requests
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env.local do Next.js
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'app', '.env.local'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

SESSION = requests.Session()
SESSION.headers.update({
    'Accept': 'application/json',
    'User-Agent': 'meuspoliticos-etl/1.0',
})


def get_db():
    return psycopg.connect(
        host=os.getenv('POSTGRES_HOST') or os.getenv('SUPABASE_DB_HOST', 'localhost'),
        port=int(os.getenv('POSTGRES_PORT') or os.getenv('SUPABASE_DB_PORT', '5432')),
        user=os.getenv('POSTGRES_USER') or os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD') or os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('POSTGRES_DB') or os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='disable',
    )


def fetch_municipios(uf: str = None) -> list[dict]:
    """Busca a lista de municípios do banco de dados (filtrado por UF, se informado)."""
    db = get_db()
    cur = db.cursor()
    if uf:
        cur.execute(
            "SELECT id, codigo_ibge, nome, uf FROM public.municipios WHERE uf = %s ORDER BY nome ASC",
            (uf.upper(),)
        )
    else:
        cur.execute(
            "SELECT id, codigo_ibge, nome, uf FROM public.municipios ORDER BY uf ASC, nome ASC"
        )
    rows = cur.fetchall()
    db.close()
    return [{"id": r[0], "codigo_ibge": r[1], "nome": r[2], "uf": r[3]} for r in rows]


def coletar_financas_municipio(codigo_ibge: int, ano: int) -> dict | None:
    """Coleta e calcula a saúde fiscal de um único município via SICONFI DCA."""
    url = 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca'
    params = {
        'an_exercicio': ano,
        'id_ente': codigo_ibge,
    }
    
    try:
        r = SESSION.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json()
        items = data.get('items', [])
        if not items:
            return None
        
        # 1. Extração de Receitas (DCA-Anexo I-C)
        # Net Revenue = Receitas Brutas Realizadas - Deduções - FUNDEB - Outras Deduções da Receita
        receita_bruta = 0.0
        deducoes = 0.0
        
        for item in items:
            if item.get('anexo') == 'DCA-Anexo I-C' and item.get('cod_conta') == 'ReceitasExcetoIntraOrcamentarias':
                coluna = item.get('coluna', '')
                valor = float(item.get('valor', 0) or 0)
                if coluna == 'Receitas Brutas Realizadas':
                    receita_bruta = valor
                elif 'Deduções' in coluna or 'FUNDEB' in coluna:
                    deducoes += valor
                    
        receitas_realizadas = max(0.0, receita_bruta - deducoes)
        
        # 2. Extração de Despesas (DCA-Anexo I-D)
        # Despesas Liquidadas
        despesas_liquidadas = 0.0
        has_despesa = False
        
        for item in items:
            if item.get('anexo') == 'DCA-Anexo I-D' and item.get('cod_conta') == 'TotalDespesas':
                coluna = item.get('coluna', '')
                valor = float(item.get('valor', 0) or 0)
                if coluna == 'Despesas Liquidadas':
                    despesas_liquidadas = valor
                    has_despesa = True
                    break
        
        # Se não encontrou dados de receitas ou despesas, ignora
        if receita_bruta == 0.0 and not has_despesa:
            return None
            
        resultado_orcamentario = receitas_realizadas - despesas_liquidadas
        situacao = 'deficitario' if resultado_orcamentario < 0 else 'superavitario'
        
        return {
            'receitas_realizadas': receitas_realizadas,
            'despesas_liquidadas': despesas_liquidadas,
            'resultado_orcamentario': resultado_orcamentario,
            'situacao': situacao
        }
    except Exception as exc:
        log.error("Erro ao buscar DCA para município %s no ano %d: %s", codigo_ibge, ano, exc)
        return None


def salvar_financas(codigo_ibge: int, ano: int, dados: dict):
    """Grava as finanças calculadas no banco de dados."""
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute(
            '''
            INSERT INTO public.municipios_financas
              (municipio_ibge, ano, receitas_realizadas, despesas_liquidadas, resultado_orcamentario, situacao, source_id, coletado_em)
            VALUES (%s, %s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (municipio_ibge, ano) DO UPDATE SET
              receitas_realizadas     = EXCLUDED.receitas_realizadas,
              despesas_liquidadas     = EXCLUDED.despesas_liquidadas,
              resultado_orcamentario = EXCLUDED.resultado_orcamentario,
              situacao                = EXCLUDED.situacao,
              source_id               = EXCLUDED.source_id,
              coletado_em             = now(),
              atualizado_em           = now()
            ''',
            (
                codigo_ibge, 
                ano, 
                dados['receitas_realizadas'], 
                dados['despesas_liquidadas'], 
                dados['resultado_orcamentario'], 
                dados['situacao'], 
                f'siconfi_dca_{ano}'
            )
        )
        db.commit()
    except Exception as exc:
        log.error("Erro ao salvar finanças no banco para %s: %s", codigo_ibge, exc)
        db.rollback()
    finally:
        db.close()


def coletar(ano: int, uf: str = None):
    log.info('Iniciando coleta de Finanças Municipais (SICONFI) — Ano %d | UF: %s', ano, uf or 'Todas')
    municipios = fetch_municipios(uf)
    total = len(municipios)
    log.info('Encontrados %d municípios no banco de dados', total)
    
    atualizados = 0
    pulados = 0
    
    t0 = time.monotonic()
    
    for idx, mun in enumerate(municipios):
        nome = mun['nome']
        uf_sigla = mun['uf']
        cod = mun['codigo_ibge']
        
        # Exibe progresso
        log.info('[%d/%d] Buscando %s - %s (%s)...', idx + 1, total, nome, uf_sigla, cod)
        
        dados = coletar_financas_municipio(cod, ano)
        if dados:
            salvar_financas(cod, ano, dados)
            atualizados += 1
            log.info(
                '  -> Salvo: Receita: R$ %.2f | Despesa: R$ %.2f | Saldo: R$ %.2f (%s)',
                dados['receitas_realizadas'],
                dados['despesas_liquidadas'],
                dados['resultado_orcamentario'],
                dados['situacao']
            )
        else:
            pulados += 1
            log.warning('  -> Sem dados DCA para %s - %s', nome, uf_sigla)
            
        time.sleep(0.15)
        
    duracao = time.monotonic() - t0
    log.info('Concluído! %d atualizados, %d pulados em %.1fs', atualizados, pulados, duracao)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Coleta saúde fiscal dos municípios via SICONFI DCA')
    parser.add_argument('--ano', type=int, default=2024, help='Ano de exercício contábil (DCA)')
    parser.add_argument('--uf', type=str, default=None, help='Sigla do estado para processamento incremental (ex: AC, SP)')
    args = parser.parse_args()
    
    coletar(args.ano, args.uf)

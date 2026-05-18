"""
Coleta votações nominais do Senado Federal e persiste no banco.

Fonte:
  GET https://legis.senado.leg.br/dadosabertos/plenario/lista/votacao/{dataInicio}/{dataFim}.json

Tabelas afetadas: votacoes, politicos (total_votacoes), coletas_log

Uso:
  python collect_senado_votacoes.py [--dias 365]
"""

import argparse
import os
import time
import logging
from datetime import date, timedelta, timezone, datetime

import psycopg
import requests
from dotenv import load_dotenv

load_dotenv(
    os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
log = logging.getLogger(__name__)

BASE_URL = 'https://legis.senado.leg.br/dadosabertos'
SESSION = requests.Session()
SESSION.headers.update({
    'Accept': 'application/json',
    'User-Agent': 'meuspoliticos-etl/1.0',
})

VOTO_MAP = {
    # Valores detalhados (alguns endpoints)
    'Sim': 'sim',
    'SIM': 'sim',
    'Não': 'nao',
    'Nao': 'nao',
    'NAO': 'nao',
    'NÃO': 'nao',
    'Abstenção': 'abstencao',
    'Abstencao': 'abstencao',
    'ABSTENCAO': 'abstencao',
    'Ausente': 'ausente',
    'AUSENTE': 'ausente',
    'Obstrução': 'obstrucao',
    'Obstrucao': 'obstrucao',
    'OBSTRUCAO': 'obstrucao',
    # Valores do endpoint plenario/lista/votacao (sem detalhamento sim/não)
    'Votou': 'sim',       # presente e votou — mapeado como 'sim' (participação)
    'Presidente': 'abstencao',  # presidente da sessão não vota
    'Art. 17': 'artigo_17',
    'Artigo 17': 'artigo_17',
}


def get_db():
    return psycopg.connect(
        host=os.getenv('SUPABASE_DB_HOST'),
        port=os.getenv('SUPABASE_DB_PORT', '5432'),
        user=os.getenv('SUPABASE_DB_USER', 'postgres'),
        password=os.getenv('SUPABASE_DB_PASSWORD'),
        dbname=os.getenv('SUPABASE_DB_NAME', 'postgres'),
        sslmode='prefer',
    )


def get_json(path: str, params: dict | None = None) -> dict:
    url = f'{BASE_URL}{path}'
    for tentativa in range(3):
        try:
            r = SESSION.get(url, params=params, timeout=60)
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            log.warning('Tentativa %d falhou para %s: %s', tentativa + 1, url, exc)
            if tentativa < 2:
                time.sleep(2 ** tentativa)
    raise RuntimeError(f'Falha ao buscar {url}')


def buscar_politico_id_por_senado(cur, id_senado: int) -> str | None:
    cur.execute(
        'SELECT id FROM politicos WHERE id_senado = %s LIMIT 1',
        (id_senado,),
    )
    row = cur.fetchone()
    return str(row[0]) if row else None


def upsert_votacao(cur, voto: dict, sessao: dict, politico_id: str):
    id_votacao_senado = sessao.get('CodigoSessaoVotacao') or sessao.get('CodigoSessao', '')
    # Campo está direto no dict do voto (não aninhado em IdentificacaoParlamentar)
    id_senado_parlamentar = (
        voto.get('CodigoParlamentar')
        or voto.get('IdentificacaoParlamentar', {}).get('CodigoParlamentar', '')
    )
    source_record_id = f'{id_votacao_senado}_{id_senado_parlamentar}'

    voto_raw = voto.get('Voto', '')
    voto_normalizado = VOTO_MAP.get(voto_raw)
    if not voto_normalizado:
        return

    data_sessao = sessao.get('DataSessao', '')[:10] if sessao.get('DataSessao') else None
    hora_sessao = sessao.get('HoraInicio', '00:00')[:5] if sessao.get('HoraInicio') else '00:00'

    descricao = sessao.get('DescricaoVotacao') or ''
    proposicao = sessao.get('Materia', {}).get('DescricaoIdentificacao', '')

    cur.execute(
        '''
        INSERT INTO votacoes (
            politico_id, voto, data, hora,
            descricao, proposicao,
            legislatura, dado_estado,
            source_id, source_record_id, collected_at,
            criado_em, atualizado_em
        )
        VALUES (
            %s, %s, %s, %s,
            %s, %s,
            57, 'oficial',
            'senado_legis', %s, now(),
            now(), now()
        )
        ON CONFLICT (source_id, source_record_id) DO UPDATE SET
            voto         = EXCLUDED.voto,
            dado_estado  = 'oficial',
            collected_at = now(),
            atualizado_em = now()
        ''',
        (
            politico_id,
            voto_normalizado,
            data_sessao,
            hora_sessao,
            descricao[:500] if descricao else None,
            proposicao[:200] if proposicao else None,
            source_record_id,
        ),
    )


def atualizar_total_votacoes(cur):
    log.info('Atualizando total_votacoes para senadores...')
    cur.execute(
        '''
        UPDATE politicos p
        SET total_votacoes = (
            SELECT COUNT(*) FROM votacoes v WHERE v.politico_id = p.id
        ),
        atualizado_em = now()
        WHERE p.cargo = 'senador'
        '''
    )
    log.info('total_votacoes atualizado')


def registrar_log(cur, status: str, registros: int, duracao_ms: int, mensagem: str = ''):
    cur.execute(
        '''
        INSERT INTO coletas_log (fonte, tipo, status, registros, duracao_ms, mensagem, criado_em)
        VALUES ('senado_legis', 'votacoes', %s, %s, %s, %s, now())
        ''',
        (status, registros, duracao_ms, mensagem),
    )


def coletar_votacoes(dias: int = 365):
    t0 = time.monotonic()
    db = get_db()
    cur = db.cursor()

    data_fim = date.today()
    # Buscar em janelas de 30 dias (API Senado tem limite por período)
    janela = 30
    ok = 0
    erros = 0

    data_cursor = data_fim - timedelta(days=dias)

    while data_cursor < data_fim:
        data_inicio_janela = data_cursor
        data_fim_janela = min(data_cursor + timedelta(days=janela), data_fim)

        ini_str = data_inicio_janela.strftime('%Y%m%d')
        fim_str = data_fim_janela.strftime('%Y%m%d')

        log.info('Buscando votações %s → %s...', ini_str, fim_str)

        try:
            resp = get_json(f'/plenario/lista/votacao/{ini_str}/{fim_str}.json')
            time.sleep(0.3)

            sessoes = (
                resp
                .get('ListaVotacoes', {})
                .get('Votacoes', {})
                .get('Votacao', [])
            )

            if isinstance(sessoes, dict):
                sessoes = [sessoes]

            for sessao in sessoes:
                id_sessao = sessao.get('CodigoSessaoVotacao') or sessao.get('CodigoSessao')
                if not id_sessao:
                    continue

                # Expandir votos individuais
                votos_raw = sessao.get('Votos', {}).get('VotoParlamentar', [])
                if isinstance(votos_raw, dict):
                    votos_raw = [votos_raw]

                for voto in votos_raw:
                    # Campo direto no dict (endpoint plenario/lista/votacao)
                    id_senado_str = (
                        voto.get('CodigoParlamentar')
                        or voto.get('IdentificacaoParlamentar', {}).get('CodigoParlamentar')
                    )
                    if not id_senado_str:
                        continue

                    politico_id = buscar_politico_id_por_senado(cur, int(id_senado_str))
                    if not politico_id:
                        continue

                    try:
                        upsert_votacao(cur, voto, sessao, politico_id)
                        ok += 1
                    except Exception as exc:
                        log.warning('Erro ao inserir voto: %s', exc)
                        erros += 1

                db.commit()

        except Exception as exc:
            log.error('Erro na janela %s → %s: %s', ini_str, fim_str, exc)
            erros += 1

        data_cursor = data_fim_janela + timedelta(days=1)

    # Atualizar agregados
    try:
        atualizar_total_votacoes(cur)
        db.commit()
    except Exception as exc:
        log.error('Erro ao atualizar total_votacoes: %s', exc)

    duracao_ms = int((time.monotonic() - t0) * 1000)
    status = 'ok' if erros == 0 else ('falhou' if ok == 0 else 'atrasado')
    mensagem = f'{ok} votos inseridos/atualizados, {erros} erros, janela {dias} dias'

    try:
        registrar_log(cur, status, ok, duracao_ms, mensagem)
        db.commit()
    except Exception as exc:
        log.error('Erro ao registrar log: %s', exc)

    db.close()
    log.info('Concluído: %s em %dms', mensagem, duracao_ms)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dias', type=int, default=365, help='Quantos dias retroativos coletar')
    args = parser.parse_args()
    coletar_votacoes(dias=args.dias)

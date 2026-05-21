import Link from 'next/link'
import { BotaoSair } from '@/components/meus-politicos/BotaoSair'

type PainelHeaderProps = {
  email: string
  nomeUsuario: string
  atualizacoesCount: number
}

function saudacaoPorHorario() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function PainelHeader({ email, nomeUsuario, atualizacoesCount }: PainelHeaderProps) {
  const saudacao = saudacaoPorHorario()

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          color: 'var(--ink-2)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.08em',
          marginBottom: 10,
          textTransform: 'uppercase',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        PAINEL CÍVICO PESSOAL · {email}
      </div>

      <div
        className="painel-header-row"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h1 className="painel-header-title" style={{ margin: 0, color: 'var(--ink)', fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {saudacao}, {nomeUsuario}. {atualizacoesCount} atualizações hoje.
        </h1>

        <div className="painel-header-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Link
            href="/conta"
            style={{
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--ink)',
              textDecoration: 'none',
              padding: '9px 12px',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            ⚙ Configurações
          </Link>
          <Link
            href="/busca"
            style={{
              border: '1px solid var(--brand)',
              background: 'var(--brand)',
              color: '#fff',
              textDecoration: 'none',
              padding: '9px 12px',
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            + Acompanhar político
          </Link>
          <BotaoSair />
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .painel-header-row {
            flex-direction: column;
            align-items: stretch;
          }
          .painel-header-title {
            font-size: 22px !important;
          }
          .painel-header-actions {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  )
}

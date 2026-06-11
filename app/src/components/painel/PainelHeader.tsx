import Link from 'next/link'
import { BotaoSair } from '@/components/meus-politicos/BotaoSair'

type PainelHeaderProps = {
  email: string
  nomeUsuario: string
  atualizacoesCount: number
}

function saudacaoPorHorario() {
  // Forçar timezone BRT (UTC-3) independente do servidor
  const hora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function PainelHeader({ email, nomeUsuario, atualizacoesCount }: PainelHeaderProps) {
  const saudacao = saudacaoPorHorario()

  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          color: 'var(--brand-2)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          marginBottom: 8,
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
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 8,
        }}
      >
        <div>
          <h1 className="painel-header-title" style={{ 
            margin: 0, 
            color: 'var(--ink)', 
            fontSize: '32px', 
            lineHeight: 1.1, 
            letterSpacing: '-0.03em',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
          }}>
            <span style={{
              background: 'linear-gradient(135deg, var(--brand-2) 0%, #a855f7 50%, #f43f5e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>{saudacao}</span>, {nomeUsuario}.
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Você possui <strong style={{ color: 'var(--ink)' }}>{atualizacoesCount} atualizações</strong> recentes nas últimas 24h.
          </p>
        </div>

        <div className="painel-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Link
            href="/conta"
            className="btn-premium btn-premium-secondary"
          >
            ⚙ Configurações
          </Link>
          <Link
            href="/busca"
            className="btn-premium btn-premium-primary"
          >
            + Acompanhar político
          </Link>
          <BotaoSair />
        </div>
      </div>

      <style>{`
        .btn-premium {
          display: inline-flex;
          align-items: center;
          height: 36px;
          padding: 0 16px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-decoration: none;
          border-radius: 8px;
          white-space: nowrap;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-premium-primary {
          background: linear-gradient(135deg, var(--brand-2) 0%, #7c3aed 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff !important;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
        }
        .btn-premium-primary:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
          filter: brightness(1.1);
        }
        .btn-premium-secondary {
          background: var(--surface);
          border: 1px solid var(--line);
          color: var(--ink-2) !important;
        }
        .btn-premium-secondary:hover {
          background: var(--panel);
          border-color: var(--line-strong);
          color: var(--ink) !important;
          transform: translateY(-1.5px);
        }
        @media (max-width: 640px) {
          .painel-header-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .painel-header-title {
            font-size: 26px !important;
          }
          .painel-header-actions {
            flex-wrap: wrap;
            width: 100%;
          }
          .btn-premium, .painel-header-actions button {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

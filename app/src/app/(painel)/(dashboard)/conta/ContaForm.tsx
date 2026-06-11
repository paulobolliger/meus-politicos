'use client'

import { useState, useEffect } from 'react'
import { salvarConfiguracoes } from './actions'
import { Shield, Key, AlertTriangle, Check, RefreshCw, Lock } from 'lucide-react'
import { Panel } from '@/components/civic'

type ProfileData = {
  nome: string
  uf: string
  municipio: string
  notifVotacao: boolean
  notifFalta: boolean
  notifGasto: boolean
  notifPartido: boolean
  notifCandidato: boolean
  email: string
}

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export function ContaForm({ initialProfile }: { initialProfile: ProfileData }) {
  const [nome, setNome] = useState(initialProfile.nome || '')
  const [uf, setUf] = useState(initialProfile.uf || '')
  const [municipio, setMunicipio] = useState(initialProfile.municipio || '')
  const [notifVotacao, setNotifVotacao] = useState(initialProfile.notifVotacao)
  const [notifFalta, setNotifFalta] = useState(initialProfile.notifFalta)
  const [notifGasto, setNotifGasto] = useState(initialProfile.notifGasto)
  const [notifPartido, setNotifPartido] = useState(initialProfile.notifPartido)
  const [notifCandidato, setNotifCandidato] = useState(initialProfile.notifCandidato)

  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

  useEffect(() => {
    fetch('/api/flags')
      .then((res) => res.json())
      .then((data) => setFlags(data))
      .catch(() => {})

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPushSubscribed(true)
      }
    }
  }, [])

  const isPushActive = flags['push_notifications'] === true

  const handleTogglePush = async () => {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações Push.')
      return
    }

    if (pushSubscribed) {
      setPushSubscribed(false)
      alert('Inscrição Web Push removida (simulação).')
      return
    }

    setPushLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setPushSubscribed(true)
        alert('Notificações Web Push ativadas com sucesso neste navegador!')
      } else {
        alert('Permissão de notificações recusada pelo usuário.')
      }
    } catch (err) {
      console.error('Erro ao assinar Web Push:', err)
      alert('Falha ao ativar notificações Push.')
    } finally {
      setPushLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    try {
      await salvarConfiguracoes({
        nome,
        uf,
        municipio,
        notifVotacao,
        notifFalta,
        notifGasto,
        notifPartido,
        notifCandidato,
      })
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      console.error(err)
      setStatus('error')
      setErrorMessage('Erro ao salvar configurações. Tente novamente.')
    }
  }

  function handleResetPassword() {
    window.location.href = '/api/auth/logto/reset-password'
  }

  function handleDeleteAccount() {
    if (window.confirm('Tem certeza de que deseja excluir sua conta? Esta ação é irreversível e removerá todos os seus políticos acompanhados.')) {
      window.alert('Funcionalidade de exclusão em homologação. Entre em contato com o suporte para concluir a remoção.')
    }
  }

  return (
    <div className="conta-layout" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Coluna principal do formulário */}
      <form onSubmit={handleSubmit} style={{ flex: 1.6, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Bloco 1: Dados Cadastrais */}
        <Panel style={{ padding: '24px 28px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: 'var(--brand-2)' }} />
            Dados Cadastrais
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="input-nome" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>NOME DE EXIBIÇÃO</label>
              <input
                id="input-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                style={{
                  height: 38,
                  padding: '0 12px',
                  background: 'rgba(30, 41, 59, 0.2)',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  color: 'var(--ink)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="input-email" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                ENDEREÇO DE E-MAIL
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="input-email"
                  type="text"
                  value={initialProfile.email}
                  disabled
                  style={{
                    height: 38,
                    width: '100%',
                    padding: '0 36px 0 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    color: 'var(--ink-3)',
                    fontSize: 13,
                    cursor: 'not-allowed',
                  }}
                />
                <span title="Provedor gerenciado" style={{ position: 'absolute', right: 12, display: 'flex', alignItems: 'center' }}>
                  <Lock size={14} style={{ color: 'var(--ink-3)' }} />
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="select-uf" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>ESTADO (UF)</label>
              <select
                id="select-uf"
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                style={{
                  height: 38,
                  padding: '0 12px',
                  background: 'rgba(30, 41, 59, 0.2)',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  color: 'var(--ink)',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="">Selecione...</option>
                {UFS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="input-municipio" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>MUNICÍPIO / CIDADE</label>
              <input
                id="input-municipio"
                type="text"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                placeholder="Sua cidade"
                style={{
                  height: 38,
                  padding: '0 12px',
                  background: 'rgba(30, 41, 59, 0.2)',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  color: 'var(--ink)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </Panel>

        {/* Bloco 2: Preferências de Alertas */}
        <Panel style={{ padding: '24px 28px' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
            Preferências de Alertas Cívicos
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'var(--ink-3)' }}>
            Selecione quais eventos dos políticos que você monitora devem disparar notificações.
          </p>

          <div style={{ display: 'grid', gap: 14 }}>
            {/* Web Push Item (condicional sob a flag push_notifications) */}
            {isPushActive && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Notificações Web Push (Navegador)</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Receba alertas instantâneos na tela do seu computador ou celular.</span>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={pushLoading}
                  className={`switch-control ${pushSubscribed ? 'switch-control-active' : ''}`}
                  style={{ cursor: pushLoading ? 'wait' : 'pointer' }}
                  aria-label="Toggle Web Push"
                >
                  <span className={`switch-thumb ${pushSubscribed ? 'switch-thumb-active' : ''}`} />
                </button>
              </div>
            )}

            {/* Switch item 1 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Votações Importantes</span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Alertas de votos em PECs, MPVs e Projetos de Lei de alto impacto.</span>
              </div>
              <button
                type="button"
                onClick={() => setNotifVotacao(!notifVotacao)}
                className={`switch-control ${notifVotacao ? 'switch-control-active' : ''}`}
                aria-label="Toggle Votações Importantes"
              >
                <span className={`switch-thumb ${notifVotacao ? 'switch-thumb-active' : ''}`} />
              </button>
            </div>

            {/* Switch item 2 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Faltas e Presenças</span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Notificações de faltas consecutivas ou injustificadas em plenário.</span>
              </div>
              <button
                type="button"
                onClick={() => setNotifFalta(!notifFalta)}
                className={`switch-control ${notifFalta ? 'switch-control-active' : ''}`}
                aria-label="Toggle Faltas e Presenças"
              >
                <span className={`switch-thumb ${notifFalta ? 'switch-thumb-active' : ''}`} />
              </button>
            </div>

            {/* Switch item 3 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Alertas de Gastos</span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Notificar gastos mensais atípicos ou acima da mediana do parlamentar.</span>
              </div>
              <button
                type="button"
                onClick={() => setNotifGasto(!notifGasto)}
                className={`switch-control ${notifGasto ? 'switch-control-active' : ''}`}
                aria-label="Toggle Alertas de Gastos"
              >
                <span className={`switch-thumb ${notifGasto ? 'switch-thumb-active' : ''}`} />
              </button>
            </div>

            {/* Switch item 4 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Movimentações de Partido</span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Avisos quando os políticos acompanhados mudarem de partido ou federação.</span>
              </div>
              <button
                type="button"
                onClick={() => setNotifPartido(!notifPartido)}
                className={`switch-control ${notifPartido ? 'switch-control-active' : ''}`}
                aria-label="Toggle Movimentações de Partido"
              >
                <span className={`switch-thumb ${notifPartido ? 'switch-thumb-active' : ''}`} />
              </button>
            </div>

            {/* Switch item 5 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Candidaturas Eleitorais</span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Atualizações sobre novos registros ou deferimentos nas eleições de 2026.</span>
              </div>
              <button
                type="button"
                onClick={() => setNotifCandidato(!notifCandidato)}
                className={`switch-control ${notifCandidato ? 'switch-control-active' : ''}`}
                aria-label="Toggle Candidaturas Eleitorais"
              >
                <span className={`switch-thumb ${notifCandidato ? 'switch-thumb-active' : ''}`} />
              </button>
            </div>
          </div>
        </Panel>

        {/* Submit Actions */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="submit"
            disabled={status === 'saving'}
            style={{
              height: 40,
              padding: '0 24px',
              background: 'var(--brand-2)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: status === 'saving' ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            {status === 'saving' ? (
              <>
                <RefreshCw size={14} className="spin" /> Salvar...
              </>
            ) : 'Salvar Configurações'}
          </button>

          {status === 'success' && (
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--pos)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} /> Configurações salvas com sucesso!
            </span>
          )}
          {status === 'error' && (
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--neg)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} /> {errorMessage}
            </span>
          )}
        </div>
      </form>

      {/* Coluna secundária de ações */}
      <div className="conta-sidebar" style={{ width: 320, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Bloco de Segurança */}
        <Panel style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={16} style={{ color: 'var(--brand-2)' }} />
            Segurança da Conta
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            A autenticação do portal é protegida e mantida de forma independente pelo provedor de identidade **Logto**.
          </p>
          <button
            type="button"
            onClick={handleResetPassword}
            style={{
              width: '100%',
              height: 36,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              color: 'var(--ink)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Redefinir Senha
          </button>
        </Panel>

        {/* Zona de Perigo */}
        <Panel style={{ padding: 20, border: '1px solid rgba(239, 68, 68, 0.2) !important' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            Zona de Perigo
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Ao excluir a sua conta, todos os seus políticos acompanhados e preferências cívicas serão excluídos permanentemente.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            style={{
              width: '100%',
              height: 36,
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Excluir Conta Permanentemente
          </button>
        </Panel>
      </div>

      <style>{`
        .spin {
          animation: spin-animation 1s linear infinite;
        }
        @keyframes spin-animation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .switch-control {
          width: 36px;
          height: 18px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.02);
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .switch-control-active {
          border-color: var(--brand-2);
          background: var(--brand-2);
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
        }
        .switch-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--ink-3);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .switch-control-active .switch-thumb {
          left: 20px;
          background: #fff;
        }
        
        @media (max-width: 1024px) {
          .conta-layout {
            flex-direction: column !important;
          }
          .conta-sidebar {
            width: 100% !important;
            min-width: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

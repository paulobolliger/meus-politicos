import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPgPool } from '@/lib/db/pool'
import { getCurrentUser } from '@/lib/auth/current-user'
import { ContaForm } from './ContaForm'

type PerfilRow = {
  nome: string | null
  uf: string | null
  municipio: string | null
  notif_votacao: boolean
  notif_falta: boolean
  notif_gasto: boolean
  notif_partido: boolean
  notif_candidato: boolean
}

export default async function ContaPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect('/login')
  }

  const db = getPgPool()
  const { rows } = await db.query<PerfilRow>(
    `SELECT
       nome,
       uf,
       municipio,
       notif_votacao,
       notif_falta,
       notif_gasto,
       notif_partido,
       notif_candidato
     FROM perfis
     WHERE id = $1
     LIMIT 1`,
    [currentUser.perfilId]
  )

  const perfil = rows[0]

  if (!perfil) {
    // Caso de redundância para criar o perfil se não existir por qualquer falha de trigger
    redirect('/painel')
  }

  const initialProfile = {
    nome: perfil.nome ?? '',
    uf: perfil.uf ?? '',
    municipio: perfil.municipio ?? '',
    notifVotacao: perfil.notif_votacao,
    notifFalta: perfil.notif_falta,
    notifGasto: perfil.notif_gasto,
    notifPartido: perfil.notif_partido,
    notifCandidato: perfil.notif_candidato,
    email: currentUser.email ?? '',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', position: 'relative', overflow: 'hidden', padding: 24 }}>
      {/* Glow background circles */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0) 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header da página */}
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '24px 28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Link href="/painel" style={{ fontSize: 13, color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 500 }}>
              ← Painel
            </Link>
            <span style={{ color: 'var(--line-strong)', fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Configurações</span>
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
          }}>
            Configurações da Conta
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Gerencie suas preferências de segurança, localização e canais de recebimento de notificações cívicas.
          </p>
        </div>

        {/* Formulário cliente */}
        <ContaForm initialProfile={initialProfile} />
      </div>
    </div>
  )
}

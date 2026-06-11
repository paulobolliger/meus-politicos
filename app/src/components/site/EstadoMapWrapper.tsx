'use client'

import { useRouter } from 'next/navigation'
import { BrazilDots } from '@/components/civic'

export function EstadoMapWrapper() {
  const router = useRouter()

  const handlePick = (uf: string) => {
    router.push(`/estado/${uf.toLowerCase()}`)
  }

  return (
    <div style={{
      position: 'relative',
      background: 'var(--panel)',
      border: '1px solid rgba(139, 92, 246, 0.25)',
      borderRadius: 20,
      overflow: 'hidden',
      aspectRatio: '1 / 1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      width: '100%',
      boxSizing: 'border-box',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 32px rgba(139, 92, 246, 0.12)',
    }}>
      <div style={{
        position: 'absolute', top: 16, left: 20,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        color: 'var(--ink-3)', textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
      }}>
        Selecione uma UF no mapa
      </div>
      
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <BrazilDots active="" onPick={handlePick} dark={true} height={400} />
      </div>

      <div style={{
        position: 'absolute', bottom: 14, left: 0, right: 0,
        textAlign: 'center',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
        color: 'var(--ink-3)', textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
      }}>
        Clique em um estado para explorar
      </div>
    </div>
  )
}

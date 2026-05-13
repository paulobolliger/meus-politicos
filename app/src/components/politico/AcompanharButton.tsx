'use client'

import { useState } from 'react'
import { Bell, BellOff, Share2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

type AcompanharButtonProps = {
  nome: string
}

export function AcompanharButton({ nome }: AcompanharButtonProps) {
  const [acompanhando, setAcompanhando] = useState(false)

  async function compartilharPerfil() {
    const shareData = {
      title: `${nome} - Meus Politicos`,
      text: `Acompanhe o perfil de ${nome} no Meus Politicos`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // Fallback para clipboard quando o share nativo e cancelado
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      window.alert('Link copiado para a area de transferencia')
    } catch {
      window.alert('Nao foi possivel compartilhar agora')
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
        onClick={() => setAcompanhando((current) => !current)}
      >
        {acompanhando ? <BellOff size={14} /> : <Bell size={14} />}
        {acompanhando ? 'Acompanhando' : 'Acompanhar'}
      </Button>

      <Button
        variant="outline"
        className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
        onClick={compartilharPerfil}
      >
        <Share2 size={14} />
        Compartilhar
      </Button>
    </div>
  )
}

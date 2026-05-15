import Image from 'next/image'
import Link from 'next/link'

import { classeFotoEnquadramento } from '@/lib/foto-enquadramento'

type Partido = {
  sigla: string | null
} | null

export type PoliticoAcompanhado = {
  id: string
  slug: string
  nome_eleitoral: string | null
  foto_url: string | null
  cargo: string | null
  uf: string | null
  partidos: Partido
}

const CARGO_LABEL: Record<string, string> = {
  presidente: 'Presidente',
  vice_presidente: 'Vice-presidente',
  governador: 'Governador',
  vice_governador: 'Vice-governador',
  senador: 'Senador',
  deputado_federal: 'Deputado Federal',
  deputado_estadual: 'Deputado Estadual',
  prefeito: 'Prefeito',
  vice_prefeito: 'Vice-prefeito',
  vereador: 'Vereador',
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function cargoLabel(cargo: string | null) {
  if (!cargo) return 'Cargo nao informado'
  return CARGO_LABEL[cargo] ?? cargo.replace(/_/g, ' ')
}

export function CardAcompanhamento({ politico }: { politico: PoliticoAcompanhado }) {
  const nome = politico.nome_eleitoral ?? 'Político acompanhado'

  return (
    <Link
      href={`/politicos/${politico.slug}`}
      style={{
        display: 'block',
        border: '1px solid var(--line)',
        background: 'var(--panel)',
        padding: 12,
        textDecoration: 'none',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1',
          background: 'var(--brand)',
          color: 'white',
          marginBottom: 10,
          overflow: 'hidden',
        }}
      >
        {politico.foto_url ? (
          <Image
            src={politico.foto_url}
            alt={`Foto de ${nome}`}
            fill
            className={`object-cover ${classeFotoEnquadramento({ cargo: politico.cargo, slug: politico.slug })}`}
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 20,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {iniciais(nome)}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--ink)',
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {nome}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: 'var(--mute)',
            marginBottom: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {cargoLabel(politico.cargo)}
        </div>
        <div
          className="mono"
          style={{ fontSize: 11, color: 'var(--ink-3)' }}
        >
          {politico.partidos?.sigla ?? '—'} · {politico.uf ?? '—'}
        </div>
      </div>

      <div
        className="mono"
        style={{ fontSize: 11, color: 'var(--brand-2)', marginTop: 10 }}
      >
        Ver perfil →
      </div>
    </Link>
  )
}


'use client'

type Props = {
  carouselId: string
  dir: -1 | 1
}

export function CarouselBtn({ carouselId, dir }: Props) {
  function scroll() {
    const el = document.getElementById(carouselId)
    if (el) el.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scroll}
      aria-label={dir === -1 ? 'Anterior' : 'Próximo'}
      style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '1px solid var(--line)',
        background: 'var(--panel)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'background 0.15s, border-color 0.15s',
        color: 'var(--ink-2)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--line)'
        e.currentTarget.style.borderColor = 'var(--brand)'
        e.currentTarget.style.color = 'var(--ink)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--panel)'
        e.currentTarget.style.borderColor = 'var(--line)'
        e.currentTarget.style.color = 'var(--ink-2)'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {dir === -1
          ? <path d="m15 18-6-6 6-6"/>
          : <path d="m9 18 6-6-6-6"/>
        }
      </svg>
    </button>
  )
}

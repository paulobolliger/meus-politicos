import { BRAND_LOGO_URL } from '@/lib/brand'

type BrandLogoProps = {
  height?: number
  className?: string
  priority?: boolean
}

export function BrandLogo({ height = 36, className, priority = false }: BrandLogoProps) {
  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        flexShrink: 0,
        width: height * (575 / 175),
        height,
      }}
    >
      {/* The official asset remains the base; only its text area is overlaid in white. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_LOGO_URL}
        alt="Meus Políticos"
        width={575}
        height={175}
        fetchPriority={priority ? 'high' : undefined}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_LOGO_URL}
        alt=""
        aria-hidden="true"
        width={575}
        height={175}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'grayscale(1) brightness(0) invert(1)',
          clipPath: 'inset(0 0 0 34%)',
          pointerEvents: 'none',
        }}
      />
    </span>
  )
}

import Link from 'next/link'

type CardRepresentanteProps = {
  nome: string
  legenda?: string
  href?: string
}

export function CardRepresentante({ nome, legenda, href }: CardRepresentanteProps) {
  const content = (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300">
      <p className="text-sm font-semibold text-slate-900">{nome}</p>
      {legenda ? <p className="mt-1 text-sm text-slate-600">{legenda}</p> : null}
    </article>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

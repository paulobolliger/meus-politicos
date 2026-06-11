'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, Loader2, Sparkles, X } from 'lucide-react'

import {
  obterOuGerarResumo,
  type ResumoInterpretativoErro,
  type ResumoInterpretativoMetricas,
  type ResumoInterpretativoResult,
} from '@/actions/resumo-interpretativo'
import { Button } from '@/components/ui/button'

type Props = {
  politicoId: string
  metricas: ResumoInterpretativoMetricas
}

export function ResumoInterpretativoCard({ politicoId, metricas }: Props) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado] = useState<ResumoInterpretativoResult | null>(null)
  const [erroDominio, setErroDominio] = useState<ResumoInterpretativoErro | null>(null)
  const [falhou, setFalhou] = useState(false)

  const layoutId = `resumo-ia-${politicoId}`

  const teaser = useMemo(() => {
    if (resultado?.resumo?.bullets?.[0]) return resultado.resumo.bullets[0]
    return 'Gere um resumo interpretativo sob demanda com base em dados oficiais.'
  }, [resultado])

  useEffect(() => {
    if (!aberto) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAberto(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [aberto])

  async function carregarResumoSeNecessario() {
    if (carregando || resultado) return

    setCarregando(true)
    setFalhou(false)
    setErroDominio(null)

    try {
      const payload = await obterOuGerarResumo(politicoId, metricas)
      if (!payload) {
        setFalhou(true)
        return
      }

      if ('erro' in payload) {
        setErroDominio(payload)
        return
      }

      setResultado(payload)
    } catch {
      setFalhou(true)
    } finally {
      setCarregando(false)
    }
  }

  async function abrirModal() {
    setAberto(true)
    await carregarResumoSeNecessario()
  }

  return (
    <>
      <motion.article
        layoutId={layoutId}
        className="rounded-2xl border border-[var(--line)] bg-[rgba(30,41,59,0.45)] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-md transition-colors hover:border-[var(--brand)] sm:p-5"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[var(--ink)]">
            <Brain className="size-4 text-[var(--brand-2)]" aria-hidden="true" />
            Resumo da atuação
          </h2>
          <span className="rounded-full border border-[var(--line)] bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-2)]">
            IA beta
          </span>
        </div>

        <p className="mt-3 rounded-xl border border-dashed border-[var(--line)] bg-[rgba(15,23,42,0.35)] p-3 text-sm text-[var(--ink-2)]">
          {teaser}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--ink-3)]">Leitura automatizada e institucional, sem juizo moral.</p>
          <Button onClick={abrirModal} className="h-8 bg-[var(--brand)] px-3 text-xs text-white hover:bg-[var(--brand-2)]">
            Ler resumo completo
          </Button>
        </div>
      </motion.article>

      <AnimatePresence>
        {aberto ? (
          <motion.div
            key="resumo-interpretativo-backdrop"
            className="fixed inset-0 z-50 bg-black/55 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAberto(false)}
          >
            <div className="flex min-h-full items-center justify-center">
              <motion.article
                layoutId={layoutId}
                role="dialog"
                aria-modal="true"
                aria-label="Resumo interpretativo por IA"
                className="w-full max-w-xl rounded-2xl border border-[var(--line)] bg-[rgba(30,41,59,0.96)] p-4 shadow-2xl sm:p-6"
                onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--brand-soft)] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-2)]">
                      <Sparkles className="size-3" aria-hidden="true" />
                      Resumo interpretativo
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-[var(--ink)]">Leitura sintetica da atuacao</h3>
                    <p className="mt-1 text-sm text-[var(--ink-3)]">Baseado em dados publicos oficiais e rastreaveis.</p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAberto(false)}
                    className="h-8 w-8 p-0 text-[var(--ink-3)] hover:bg-white/10 hover:text-[var(--ink)]"
                    aria-label="Fechar resumo"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>

                {carregando ? (
                  <div className="mt-5 rounded-xl border border-[var(--line)] bg-[rgba(15,23,42,0.45)] p-4 text-sm text-[var(--ink-2)]">
                    <p className="inline-flex items-center gap-2 font-medium">
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Gerando interpretacao...
                    </p>
                  </div>
                ) : erroDominio?.erro === 'limite_diario' ? (
                  <div className="mt-5 rounded-xl border border-[var(--warn)] bg-[var(--warn-soft)] p-4 text-sm text-[var(--ink)]">
                    Limite diario de {erroDominio.limite_diario} geracoes atingido para hoje.
                  </div>
                ) : falhou ? (
                  <div className="mt-5 rounded-xl border border-[var(--warn)] bg-[var(--warn-soft)] p-4 text-sm text-[var(--ink)]">
                    Nao foi possivel gerar o resumo agora. Tente novamente em instantes.
                  </div>
                ) : resultado ? (
                  <div className="mt-5 space-y-4">
                    <ul className="space-y-2">
                      {resultado.resumo.bullets.map((bullet, index) => (
                        <li key={`${bullet}-${index}`} className="rounded-xl border border-[var(--line)] bg-[rgba(15,23,42,0.45)] p-3 text-sm text-[var(--ink-2)]">
                          {bullet}
                        </li>
                      ))}
                    </ul>

                    {resultado.resumo.alerta ? (
                      <p className="rounded-xl border border-[var(--warn)] bg-[var(--warn-soft)] p-3 text-sm text-[var(--ink)]">
                        Alerta: {resultado.resumo.alerta}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-3)]">
                      <span className="rounded-full border border-[var(--line)] bg-[rgba(15,23,42,0.45)] px-2 py-1">
                        Origem: {resultado.origem === 'cache' ? 'cache' : 'OpenAI'}
                      </span>
                      {resultado.atualizado_em ? (
                        <span className="rounded-full border border-[var(--line)] bg-[rgba(15,23,42,0.45)] px-2 py-1">Atualizado em: {new Date(resultado.atualizado_em).toLocaleString('pt-BR')}</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </motion.article>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

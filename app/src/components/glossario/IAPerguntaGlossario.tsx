'use client'

import React, { useState, useRef, useEffect } from 'react'
import { perguntarGlossarioIA, Message } from '@/actions/ia-pergunta'
import { createChatMessage } from '@/lib/chat-message'

type IAPerguntaGlossarioProps = {
  termoSlug: string
  termoNome: string
}

const SUGESTOES = [
  'Como funciona na prática?',
  'Por que isso é importante?',
]

export function IAPerguntaGlossario({ termoSlug, termoNome }: IAPerguntaGlossarioProps) {
  const [pergunta, setPergunta] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (messages.length > 0 || loading) {
      scrollToBottom()
    }
  }, [messages, loading])

  const handleEnviar = async (texto: string) => {
    if (!texto || texto.trim().length === 0 || loading) return

    setError(null)
    const userMessage = createChatMessage('user', texto)

    setMessages((prev) => [...prev, userMessage])
    setPergunta('')
    setLoading(true)

    try {
      const response = await perguntarGlossarioIA(termoSlug, messages, texto)
      
      if ('erro' in response) {
        setError(response.erro)
      } else {
        const assistantMessage = createChatMessage('assistant', response.resposta)
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch {
      setError('Erro ao enviar pergunta. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#121026] border border-[#7C3AED]/35 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(124,58,237,0.1)] flex flex-col font-sans">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2D1B69] via-[#1A113E] to-[#120A2B] border-b border-[#4C1D95]/40 p-3.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#A78BFA] text-lg leading-none animate-pulse">🤖</span>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-xs tracking-wide">Inteligência Cívica</h3>
            <span className="text-[9px] text-[#A78BFA] uppercase tracking-wider font-mono block truncate" title={`Dúvidas sobre ${termoNome}`}>
              Dúvidas: {termoNome}
            </span>
          </div>
        </div>
        <span className="bg-[#7C3AED]/30 text-[#C7D2FE] border border-[#7C3AED]/60 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-widest flex-shrink-0">
          IA
        </span>
      </div>

      {/* Messages Feed */}
      <div className="p-3.5 space-y-3.5 max-h-[190px] overflow-y-auto custom-scrollbar flex-1 bg-[#090816]/70 min-h-[110px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-2 space-y-2">
            <span className="text-2xl animate-pulse">💡</span>
            <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
              Tem alguma dúvida sobre **{termoNome}**? Pergunte à nossa IA ou clique em um atalho abaixo!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`p-2.5 rounded-2xl text-[11px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#7C3AED] text-white rounded-br-none shadow-[0_2px_8px_rgba(124,58,237,0.3)]'
                    : 'bg-[#1D173F] border border-[#4C1D95]/40 text-[#E2E8F0] rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line space-y-1">
                  {msg.content.split('\n').map((para, i) => (
                    <p key={i}>
                      {para.split('**').map((chunk, j) => j % 2 === 1 ? <strong key={j} className="text-[#C7D2FE] font-bold">{chunk}</strong> : chunk)}
                    </p>
                  ))}
                </div>
              </div>
              <span className="text-[8px] text-slate-500 font-mono mt-1.5 px-1.5">
                {msg.timestamp}
              </span>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex flex-col items-start max-w-[85%] mr-auto animate-pulse">
            <div className="bg-[#1D173F] border border-[#4C1D95]/40 p-2 flex items-center gap-2 rounded-2xl rounded-bl-none">
              <div className="flex space-x-1">
                <span className="w-1 h-1 bg-[#A78BFA] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-[#A78BFA] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-[#A78BFA] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[9px] text-[#A78BFA] font-mono">Pesquisando...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-950/50 p-2.5 rounded-xl text-[10px] text-red-300 text-center">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="px-3.5 py-2.5 border-t border-[#4C1D95]/30 bg-[#090816]/40 flex flex-col gap-1.5">
          {SUGESTOES.map((sug) => (
            <button
              key={sug}
              onClick={() => handleEnviar(sug)}
              className="text-[10px] bg-[#4C1D95]/15 border border-[#6366F1]/30 hover:bg-[#4C1D95]/30 hover:border-[#A78BFA] hover:text-white px-2.5 py-1.5 rounded-lg text-[#C7D2FE] transition-all text-left flex items-center gap-1.5 w-full cursor-pointer shadow-sm"
            >
              <span className="text-[#A78BFA] text-[8px]">✦</span>
              <span className="truncate">{sug}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="p-2 border-t border-[#4C1D95]/30 bg-[#171336]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleEnviar(pergunta)
          }}
          className="flex gap-1.5"
        >
          <input
            type="text"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            disabled={loading}
            placeholder="Tire suas dúvidas..."
            className="flex-1 bg-[#090816] border border-[#4C1D95]/60 focus:border-[#A78BFA] focus:ring-1 focus:ring-[#A78BFA]/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-[#52527A] outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !pergunta.trim()}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 active:scale-95 duration-150 cursor-pointer shadow-md"
          >
            <span className="text-xs">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, MessageCircle, Send } from 'lucide-react'
import { perguntarPoliticoIA, Message } from '@/actions/ia-pergunta'

type IAPerguntaPoliticoProps = {
  politicoId: string
  nomePolitico: string
}

const SUGESTOES = [
  'Qual é o total de gastos acumulado?',
  'Como está a taxa de presença nas sessões?',
  'Quais são os principais projetos que ele(a) votou?',
]

export function IAPerguntaPolitico({ politicoId, nomePolitico }: IAPerguntaPoliticoProps) {
  const [pergunta, setPergunta] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleEnviar = async (texto: string) => {
    if (!texto || texto.trim().length === 0 || loading) return

    setError(null)
    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: texto,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setPergunta('')
    setLoading(true)

    try {
      const response = await perguntarPoliticoIA(politicoId, messages, texto)
      
      if ('erro' in response) {
        setError(response.erro)
      } else {
        const assistantMessage: Message = {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: response.resposta,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch {
      setError('Erro ao enviar pergunta. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="bg-[#0F172A]/40 border-b border-[#334155] p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-[#A78BFA]" aria-hidden="true" />
          <div>
            <h4 className="text-white font-bold text-xs tracking-wide">Dúvidas sobre o mandato</h4>
            <span className="text-[9px] text-[#A78BFA] uppercase tracking-wider font-semibold">Respostas da Inteligência Cívica</span>
          </div>
        </div>
        <span className="bg-[#4C1D95]/40 text-[#A78BFA] border border-[#4C1D95] text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
          AI Agent
        </span>
      </div>

      {/* Messages Feed */}
      <div className="p-3 space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar flex-1 bg-[#0F172A]/20 min-h-[100px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-3 space-y-2">
            <MessageCircle className="size-7 text-[#475569]" aria-hidden="true" />
            <p className="text-[11px] text-[#94A3B8] max-w-sm leading-relaxed">
              Pergunte sobre os gastos de gabinete, presença plenária ou histórico de votações de {nomePolitico}!
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
                className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#6366F1] text-white rounded-br-none'
                    : 'bg-[#1E293B] border border-[#334155] text-[#CBD5E1] rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line space-y-1">
                  {msg.content.split('\n').map((para, i) => (
                    <p key={i}>
                      {para.split('**').map((chunk, j) => j % 2 === 1 ? <strong key={j} className="text-white font-bold">{chunk}</strong> : chunk)}
                    </p>
                  ))}
                </div>
              </div>
              <span className="text-[8px] text-[#64748B] font-mono mt-0.5 px-0.5">
                {msg.timestamp}
              </span>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex flex-col items-start max-w-[85%] mr-auto">
            <div className="bg-[#1E293B] border border-[#334155] p-2.5 rounded-lg rounded-bl-none flex items-center gap-1.5">
              <div className="flex space-x-1">
                <span className="w-1 h-1 bg-[#A78BFA] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-[#A78BFA] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-[#A78BFA] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-900/50 p-2 rounded-[6px] text-[10px] text-red-300 text-center">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="px-3 py-1.5 border-t border-[#334155]/60 bg-[#0F172A]/10 flex flex-wrap gap-1.5">
          {SUGESTOES.map((sug) => (
            <button
              key={sug}
              onClick={() => handleEnviar(sug)}
              className="text-[9px] bg-[#334155]/50 border border-slate-700/50 hover:border-[#6366F1]/40 hover:text-white px-2 py-1 rounded-[6px] text-[#94A3B8] transition-all text-left"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-2 border-t border-[#334155] bg-[#1E293B]">
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
            placeholder={`Pergunte à IA sobre ${nomePolitico}...`}
            className="flex-1 bg-[#0F172A] border border-[#334155] focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30 rounded-md px-2.5 py-1.5 text-xs text-white placeholder:text-[#64748B] outline-none transition-all disabled:opacity-50"
          />
          <button
            type="submit"
          disabled={loading || !pergunta.trim()}
          className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-3 rounded-md flex items-center justify-center transition-colors disabled:opacity-50 active:scale-95 duration-150"
          aria-label="Enviar pergunta"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
        </form>
      </div>
    </div>
  )
}

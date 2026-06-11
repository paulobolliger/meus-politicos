'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

export function CadastroForm() {
  const searchParams = useSearchParams()

  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingOAuth, setLoadingOAuth] = useState<'google' | 'x' | 'linkedin' | null>(null)
  const [aceite, setAceite] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const redirectTo = searchParams.get('redirectTo') || '/meus-politicos'

  function signUpUrl(connector?: string) {
    const base = `/api/auth/logto/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`
    return connector ? `${base}&connector=${connector}` : base
  }

  function cadastrarComOAuth(key: 'google' | 'x' | 'linkedin') {
    if (!aceite) {
      setErrorMessage('Você precisa concordar com os Termos de uso e Política de privacidade.')
      return
    }
    setErrorMessage('')
    setLoadingOAuth(key)
    const target = key === 'x' ? 'twitter' : key
    window.location.href = signUpUrl(target)
  }

  function cadastrarComEmail() {
    if (!aceite) {
      setErrorMessage('Você precisa concordar com os Termos de uso e Política de privacidade.')
      return
    }
    setErrorMessage('')
    setLoadingEmail(true)
    window.location.href = signUpUrl()
  }

  // Animações
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full flex flex-col gap-5"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight mb-1">Criar conta</h2>
        <p className="text-xs text-slate-400">Crie seu perfil cidadão gratuito para salvar e monitorar seus representantes.</p>
      </motion.div>

      {/* Aceite de termos obrigatório */}
      <motion.div variants={itemVariants}>
        <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={aceite}
            onChange={(e) => {
              setAceite(e.target.checked)
              if (e.target.checked) setErrorMessage('')
            }}
            className="mt-0.5 rounded border-slate-700 bg-slate-900/60 text-violet-600 focus:ring-violet-500/30 focus:ring-offset-0 focus:ring-1 cursor-pointer shrink-0"
          />
          <span>
            Concordo com os{' '}
            <Link href="/termos" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors duration-150">
              Termos de uso
            </Link>{' '}
            e a{' '}
            <Link href="/privacidade" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors duration-150">
              Política de privacidade
            </Link>{' '}
            do portal Meus Políticos.
          </span>
        </label>
      </motion.div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-rose-500 font-medium bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg"
        >
          ⚠️ {errorMessage}
        </motion.div>
      )}

      {/* Botão de E-mail */}
      <motion.div variants={itemVariants}>
        <button
          type="button"
          onClick={cadastrarComEmail}
          disabled={loadingEmail || loadingOAuth !== null}
          className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99] text-white font-semibold text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/15 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loadingEmail ? 'Redirecionando...' : 'Cadastrar com E-mail →'}
        </button>
      </motion.div>

      {/* Divisor */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 my-1">
        <div className="flex-1 h-[1px] bg-slate-800" />
        <span className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">Ou redes sociais</span>
        <div className="flex-1 h-[1px] bg-slate-800" />
      </motion.div>

      {/* Redes Sociais */}
      <motion.div variants={itemVariants} className="flex gap-2.5">
        {/* Google */}
        <button
          type="button"
          onClick={() => cadastrarComOAuth('google')}
          disabled={loadingEmail || loadingOAuth !== null}
          className="flex-1 py-2.5 px-2 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-[0.98] rounded-lg text-slate-200 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loadingOAuth === 'google' ? (
            <span className="text-[10px]">...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12z" />
              </svg>
              <span>Google</span>
            </>
          )}
        </button>

        {/* X / Twitter */}
        <button
          type="button"
          onClick={() => cadastrarComOAuth('x')}
          disabled={loadingEmail || loadingOAuth !== null}
          className="flex-1 py-2.5 px-2 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-[0.98] rounded-lg text-slate-200 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loadingOAuth === 'x' ? (
            <span className="text-[10px]">...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current shrink-0">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.1-6.72-5.85 6.72h-3.31l7.73-8.835L2.42 2.25h6.76l4.6 6.088 5.313-6.088zM17.15 18.738h1.828L6.8 3.897H4.881l12.269 14.841z" />
              </svg>
              <span>X</span>
            </>
          )}
        </button>

        {/* LinkedIn */}
        <button
          type="button"
          onClick={() => cadastrarComOAuth('linkedin')}
          disabled={loadingEmail || loadingOAuth !== null}
          className="flex-1 py-2.5 px-2 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-[0.98] rounded-lg text-slate-200 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loadingOAuth === 'linkedin' ? (
            <span className="text-[10px]">...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span>LinkedIn</span>
            </>
          )}
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="text-xs text-slate-400 mt-2 select-none">
        Já tem conta?{' '}
        <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors duration-150">
          Entre
        </Link>
      </motion.div>

      <motion.p variants={itemVariants} className="text-[10px] text-slate-500 font-mono tracking-widest text-center mt-6 uppercase leading-relaxed">
        🔒 Conexão de identidade criptografada e segura via Logto
      </motion.p>
    </motion.div>
  )
}

import Link from 'next/link'

const dataAtualizacao = '13 de maio de 2026'

const secoes = [
  {
    titulo: '1. Objeto e Aceitação',
    conteudo: [
      'Estes Termos de Uso regulam o acesso e a utilização da plataforma Meus Políticos, dedicada à transparência cívica, ao monitoramento de dados públicos e à ampliação do acesso democrático à informação.',
      'Ao criar conta, autenticar-se ou utilizar funcionalidades da plataforma, o usuário declara ciência e concordância com estes termos e com a Política de Privacidade aplicável.',
    ],
  },
  {
    titulo: '2. Natureza Informativa da Plataforma',
    conteudo: [
      'O conteúdo disponibilizado possui caráter estritamente informativo e educacional, voltado ao interesse público.',
      'A plataforma não substitui aconselhamento jurídico, eleitoral, administrativo ou qualquer decisão oficial de órgãos competentes.',
    ],
  },
  {
    titulo: '3. Neutralidade e Ausência de Filiação Político-Partidária',
    conteudo: [
      'O Meus Políticos adota postura de neutralidade institucional e não representa, apoia ou integra partido político, candidatura, coligação ou movimento eleitoral.',
      'A disponibilização de dados visa transparência, fiscalização cidadã e acesso qualificado à informação pública.',
    ],
  },
  {
    titulo: '4. Fontes Públicas e Dados Abertos',
    conteudo: [
      'Dados políticos e institucionais exibidos podem ser coletados de APIs governamentais oficiais, portais de dados abertos e outras fontes públicas legítimas.',
      'Apesar de esforços de consistência e atualização, podem ocorrer diferenças temporais, indisponibilidades de fonte e inconsistências de origem.',
      'Sempre que possível, a plataforma preserva referência de origem para favorecer auditabilidade e contexto.',
    ],
  },
  {
    titulo: '5. Conta de Usuário e Responsabilidades',
    conteudo: [
      'O usuário pode criar conta via Google OAuth ou e-mail/senha, por intermédio de Supabase Authentication.',
      'É responsabilidade do usuário manter suas credenciais seguras, fornecer informações verídicas e não compartilhar acesso indevidamente.',
      'O uso da conta deve observar a legislação brasileira, estes termos e práticas de boa-fé digital.',
    ],
  },
  {
    titulo: '6. Uso Aceitável',
    conteudo: [
      'É proibido utilizar a plataforma para fraude, ataque, coleta abusiva de dados, engenharia reversa maliciosa, automação predatória, desinformação ou violação de direitos de terceiros.',
      'Também é vedada qualquer tentativa de comprometimento de segurança, disponibilidade e integridade da plataforma ou de seus usuários.',
      'Em caso de uso indevido, medidas técnicas e jurídicas cabíveis poderão ser adotadas.',
    ],
  },
  {
    titulo: '7. Cookies, Analytics e Privacidade',
    conteudo: [
      'A plataforma pode utilizar cookies e ferramentas de analytics para autenticação, segurança, métricas de uso e aprimoramento de experiência.',
      'O tratamento de dados pessoais segue a LGPD e a Política de Privacidade, incluindo direitos do titular e canais de contato.',
      'O Meus Políticos não vende dados pessoais de usuários.',
    ],
  },
  {
    titulo: '8. Propriedade Intelectual',
    conteudo: [
      'Estrutura da plataforma, identidade visual, textos institucionais, interfaces e elementos próprios são protegidos pela legislação aplicável de propriedade intelectual.',
      'Dados públicos de origem governamental permanecem vinculados às condições de uso e licenças das respectivas fontes oficiais.',
      'É permitido uso legítimo para fins cívicos e informativos, respeitando atribuição, integridade de contexto e legislação.',
    ],
  },
  {
    titulo: '9. Limitação de Responsabilidade',
    conteudo: [
      'O Meus Políticos envida esforços razoáveis para manter a plataforma disponível, segura e atualizada, mas não garante continuidade ininterrupta nem ausência total de erros.',
      'Não nos responsabilizamos por decisões tomadas por usuários exclusivamente com base em informações exibidas na plataforma, sem validação adicional quando necessária.',
      'Falhas de terceiros, indisponibilidade de APIs públicas e eventos fora de controle razoável podem impactar dados e funcionalidades.',
    ],
  },
  {
    titulo: '10. Alterações dos Termos',
    conteudo: [
      'Estes termos podem ser atualizados periodicamente para refletir mudanças legais, regulatórias, técnicas ou operacionais.',
      'A versão vigente será publicada nesta página com a data de atualização correspondente.',
    ],
  },
  {
    titulo: '11. Contato',
    conteudo: [
      'Para dúvidas institucionais, jurídicas ou solicitações relacionadas aos termos, entre em contato por contato@meuspoliticos.com.br.',
    ],
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <section className="border-b border-slate-200 bg-linear-to-b from-[#e8f4ff] to-white">
        <div className="container-shell py-12 sm:py-16">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex rounded-full border border-[#cbe5ff] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1f5fa8]">
              Uso da Plataforma
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Termos de Uso</h1>
            <p className="text-base text-slate-600 sm:text-lg">
              Regras de utilização com foco em transparência pública, neutralidade e responsabilidade cívica.
            </p>
            <p className="text-sm text-slate-500">Última atualização: {dataAtualizacao}</p>
          </div>
        </div>
      </section>

      <section className="container-shell py-8 sm:py-10">
        <div className="grid gap-4 sm:gap-5">
          {secoes.map((secao) => (
            <article
              key={secao.titulo}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-slate-900">{secao.titulo}</h2>
              <div className="mt-3 space-y-3">
                {secao.conteudo.map((paragrafo) => (
                  <p key={paragrafo} className="text-sm leading-relaxed text-slate-700 sm:text-base">
                    {paragrafo.includes('contato@meuspoliticos.com.br') ? (
                      <>
                        Para dúvidas institucionais, jurídicas ou solicitações relacionadas aos termos, entre em contato por{' '}
                        <a
                          href="mailto:contato@meuspoliticos.com.br"
                          className="font-medium text-[#2952cc] hover:underline"
                        >
                          contato@meuspoliticos.com.br
                        </a>
                        .
                      </>
                    ) : (
                      paragrafo
                    )}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Voltar para a página inicial
            </Link>
            <Link
              href="/privacidade"
              className="rounded-lg border border-[#dbe4ff] bg-[#eef3ff] px-3 py-2 font-medium text-[#2952cc] transition hover:bg-[#e3ebff]"
            >
              Ver Política de Privacidade
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

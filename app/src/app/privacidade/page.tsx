import Link from 'next/link'

const dataAtualizacao = '13 de maio de 2026'

const secoes = [
  {
    titulo: '1. Quem Somos e Escopo Desta Política',
    conteudo: [
      'O Meus Políticos é uma plataforma brasileira de transparência pública e monitoramento cívico, voltada a facilitar o acesso da população a informações políticas de interesse público.',
      'Esta Política de Privacidade explica como tratamos dados pessoais de usuários, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), considerando atividades de autenticação, navegação e uso dos recursos da plataforma.',
    ],
  },
  {
    titulo: '2. Dados Coletados',
    conteudo: [
      'Coletamos dados básicos de conta quando o usuário se cadastra via Google OAuth ou e-mail e senha (por exemplo: nome, e-mail e identificadores técnicos de autenticação).',
      'Também podemos coletar dados de uso e navegação, como logs técnicos, preferências de sessão e informações de interação com a plataforma, para segurança, funcionamento e melhoria contínua.',
      'Não coletamos nem comercializamos dados sensíveis para fins de publicidade política direcionada.',
    ],
  },
  {
    titulo: '3. Login e Autenticação (Supabase Auth)',
    conteudo: [
      'O acesso à conta é processado com Supabase Authentication, com suporte a login por Google OAuth e e-mail/senha.',
      'Credenciais e sessões são tratadas por mecanismos de segurança da infraestrutura de autenticação, incluindo controles de sessão, tokens e validações de acesso.',
      'O usuário é responsável por manter a confidencialidade de suas credenciais e por informar qualquer uso não autorizado de sua conta.',
    ],
  },
  {
    titulo: '4. Cookies e Tecnologias Semelhantes',
    conteudo: [
      'Utilizamos cookies e tecnologias semelhantes para manter sessões autenticadas, melhorar desempenho e garantir o funcionamento adequado das funcionalidades da plataforma.',
      'Podem existir cookies estritamente necessários (segurança e autenticação) e cookies de medição/analytics, conforme configuração ativa no ambiente.',
      'O usuário pode gerenciar cookies no navegador, ciente de que a desativação de determinados cookies pode impactar funcionalidades essenciais.',
    ],
  },
  {
    titulo: '5. Analytics e Métricas de Uso',
    conteudo: [
      'Podemos coletar métricas agregadas de acesso e comportamento para entender performance, estabilidade, usabilidade e evolução do produto.',
      'Sempre que possível, adotamos minimização de dados e análise agregada, evitando identificação desnecessária de usuários.',
      'Essas métricas são utilizadas para melhoria de serviço, não para venda de dados pessoais.',
    ],
  },
  {
    titulo: '6. Uso de Dados Públicos e Fontes Oficiais',
    conteudo: [
      'A plataforma pode exibir dados políticos e institucionais obtidos de APIs governamentais oficiais, portais de dados abertos e outras fontes públicas legítimas.',
      'Esses dados têm natureza informativa e cívica, com foco em transparência democrática, sem endosso político-partidário.',
      'Empregamos processos de tratamento para organização e legibilidade, preservando o caráter público e a referência às fontes de origem.',
    ],
  },
  {
    titulo: '7. Finalidades e Bases Legais (LGPD)',
    conteudo: [
      'Tratamos dados pessoais para finalidades como autenticação, segurança da conta, operação da plataforma, comunicação com o usuário, cumprimento de obrigações legais e melhoria de serviço.',
      'As bases legais podem incluir execução de contrato, cumprimento de obrigação legal/regulatória, legítimo interesse e, quando aplicável, consentimento.',
      'Aplicamos princípios da LGPD, incluindo necessidade, adequação, transparência, segurança e prevenção.',
    ],
  },
  {
    titulo: '8. Compartilhamento, Retenção e Proteção de Dados',
    conteudo: [
      'Não vendemos dados pessoais de usuários.',
      'Dados podem ser compartilhados apenas com operadores e serviços necessários à operação (por exemplo, autenticação, infraestrutura e segurança), mediante controles contratuais e técnicos.',
      'Mantemos medidas razoáveis de segurança, incluindo controles de acesso e boas práticas de proteção, pelo período necessário ao cumprimento das finalidades e obrigações legais.',
    ],
  },
  {
    titulo: '9. Direitos do Titular (LGPD)',
    conteudo: [
      'Nos termos da LGPD, o titular pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação quando cabível e informações sobre compartilhamento.',
      'Também é possível solicitar revisão de decisões automatizadas quando aplicável e obter informações sobre critérios utilizados.',
      'Para exercer direitos, entre em contato pelo e-mail indicado nesta política.',
    ],
  },
  {
    titulo: '10. Alterações desta Política',
    conteudo: [
      'Esta Política de Privacidade pode ser atualizada para refletir melhorias de produto, mudanças regulatórias ou ajustes operacionais.',
      'Quando houver alterações relevantes, a nova versão será publicada nesta página com a data de atualização correspondente.',
    ],
  },
  {
    titulo: '11. Contato',
    conteudo: [
      'Dúvidas, solicitações e exercício de direitos relacionados à privacidade e proteção de dados podem ser encaminhados para contato@meuspoliticos.com.br.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <section className="border-b border-slate-200 bg-linear-to-b from-[#eaf0ff] to-white">
        <div className="container-shell py-12 sm:py-16">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex rounded-full border border-[#cfdcff] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2952cc]">
              Privacidade e Protecao de Dados
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Política de Privacidade
            </h1>
            <p className="text-base text-slate-600 sm:text-lg">
              Transparência, neutralidade e respeito à LGPD no tratamento de dados pessoais.
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
                        Dúvidas, solicitações e exercício de direitos relacionados à privacidade e proteção de dados podem ser encaminhados para{' '}
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
              href="/termos"
              className="rounded-lg border border-[#dbe4ff] bg-[#eef3ff] px-3 py-2 font-medium text-[#2952cc] transition hover:bg-[#e3ebff]"
            >
              Ver Termos de Uso
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

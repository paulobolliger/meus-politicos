// Rotas de auth dentro do domínio painel.* — sem sidebar, sem SystemBar
export default function PainelAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

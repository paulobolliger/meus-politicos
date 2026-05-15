import type { Metadata } from "next"
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google"

import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

import "./globals.css"

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://meuspoliticos.com.br"),
  title: {
    default: "Meus Politicos",
    template: "%s | Meus Politicos",
  },
  description:
    "Portal brasileiro de transparencia politica com dados publicos, fontes oficiais e contexto para decidir melhor.",
  openGraph: {
    title: "Meus Politicos",
    description:
      "Portal brasileiro de transparencia politica com dados publicos, fontes oficiais e contexto para decidir melhor.",
    url: "https://meuspoliticos.com.br",
    siteName: "Meus Politicos",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meus Politicos",
    description:
      "Dados publicos. Fontes oficiais. Sem opiniao.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} antialiased`}>
      <body className="min-h-screen">
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex-1 pt-16 lg:pt-20">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  )
}

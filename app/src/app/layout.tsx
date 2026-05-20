import type { Metadata } from "next"
import { Fraunces, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"

import "./globals.css"

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
})

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-display",
  display: "swap",
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
  icons: {
    icon: [
      { url: "/logos_meus-politicos_iconecolorido_fundobranco.png", type: "image/png" },
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/logos_meus-politicos_iconecolorido_fundobranco.png", "/favicon.ico"],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} ${display.variable} antialiased`}>
<body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}

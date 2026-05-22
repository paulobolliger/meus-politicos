import type { Metadata } from "next"
import { Public_Sans, JetBrains_Mono } from "next/font/google"

import "./globals.css"

const sans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://meuspoliticos.com.br"),
  title: {
    default: "Meus Políticos",
    template: "%s | Meus Políticos",
  },
  description:
    "Portal brasileiro de transparência política com dados públicos, fontes oficiais e contexto para decidir melhor.",
  openGraph: {
    title: "Meus Políticos",
    description:
      "Portal brasileiro de transparência política com dados públicos, fontes oficiais e contexto para decidir melhor.",
    url: "https://meuspoliticos.com.br",
    siteName: "Meus Políticos",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meus Políticos",
    description:
      "Dados públicos. Fontes oficiais. Sem opinião.",
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
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} antialiased`}>
<body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}

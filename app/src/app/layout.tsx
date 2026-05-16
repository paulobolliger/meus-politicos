import type { Metadata } from "next"
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google"

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
      <head>
        {/* Script síncrono: aplica tema antes de qualquer render para evitar flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('mp-theme');var d=document.documentElement;if(t==='light'){d.setAttribute('data-theme','light')}else{d.classList.add('theme-dark');d.setAttribute('data-theme','dark')}})()`,
          }}
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}

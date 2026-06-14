import type { Metadata } from "next"
import { Public_Sans } from "next/font/google"
import { GoogleAnalytics } from "@next/third-parties/google"
import Script from "next/script"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/system/theme-provider"

import "./globals.css"

const sans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
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
    images: [
      {
        url: "/logos_meus-politicos_colorido_fundobranco.png",
        width: 1200,
        height: 630,
        alt: "Meus Políticos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meus Políticos",
    description:
      "Dados públicos. Fontes oficiais. Sem opinião.",
    images: ["/logos_meus-politicos_colorido_fundobranco.png"],
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
    <html lang="pt-BR" className={`${sans.variable} antialiased`}>
      <head>
        {/* App Router root layout is the global document for this stylesheet. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      </head>
      <body className="min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <SpeedInsights />
      </body>
      <GoogleAnalytics gaId="G-GD1H9ENSR8" />
      <Script id="clarity" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "x5m5w47hl7");`}
      </Script>
      <script
        async
        src="https://cloud.umami.is/script.js"
        data-website-id="562a0b38-79da-40df-a557-4339f55fe181"
      />
    </html>
  )
}

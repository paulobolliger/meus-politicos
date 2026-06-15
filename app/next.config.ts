import path from "path"

import { loadEnvConfig } from "@next/env"
import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"
import packageJson from "./package.json"

loadEnvConfig(path.resolve(__dirname, ".."))

const version = `v${packageJson.version}`

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dhqvjxgue/image/upload/**",
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/painel",
        permanent: true,
      },
      {
        source: "/proposicoes",
        destination: "/projetos",
        permanent: true,
      },
      {
        source: "/proposicoes/:slug",
        destination: "/projetos/:slug",
        permanent: true,
      },
      {
        source: "/app-busca",
        destination: "/busca",
        permanent: true,
      },
      {
        source: "/candidatos-2026",
        destination: "/eleicao/2026",
        permanent: true,
      },
      {
        source: "/candidatos-2026/:path*",
        destination: "/eleicao/2026/:path*",
        permanent: true,
      },
      {
        source: "/meu-estado",
        destination: "/estado",
        permanent: true,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: "noro-tecnologia-ltda",
  project: "meus-politicos",
  silent: !process.env.CI,
  widenClientFileUpload: true,
})

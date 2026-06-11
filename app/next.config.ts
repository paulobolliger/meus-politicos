import { execSync } from "child_process"
import path from "path"

import { loadEnvConfig } from "@next/env"
import type { NextConfig } from "next"

loadEnvConfig(path.resolve(__dirname, ".."))

let version = "0.1.0"
try {
  const gitHash = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
  const gitBranch = execSync("git rev-parse --abbrev-ref HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
  version = `v0.1.0-${gitBranch}+${gitHash}`
} catch (e) {
  // fallback
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
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
    ]
  },
}

export default nextConfig

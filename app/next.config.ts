import path from "path"

import { loadEnvConfig } from "@next/env"
import type { NextConfig } from "next"

loadEnvConfig(path.resolve(__dirname, ".."))

const nextConfig: NextConfig = {
  env: {},
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
}

export default nextConfig

import { Context } from "@deepseek-ai/cordis"
import { z } from "@deepseek-ai/schemastery"
import type { Server } from "node:http"

export const name = "dsh-security-web"
export const inject = ["webServer"]
export const Config = z.object({
  trustedHosts: z.array(z.string()).default([]),
})

export function apply(ctx: Context, config: { trustedHosts: string[] }): void {
  const server: Server | undefined = (ctx.webServer as any)["server"]
  if (!server) {
    ctx.logger.warn("dsh-security-web: webServer.server not available, skipping HTTP guard")
    return
  }

  const trustedHosts = new Set(config.trustedHosts ?? [])

  server.prependListener("request", (req, res) => {
    const host = req.headers.host
    if (!host) return

    const hostStr = Array.isArray(host) ? host[0] : host
    let hostname: string
    try {
      hostname = new URL("http://" + hostStr).hostname
    } catch {
      return
    }

    const isLoopback =
      hostname === "localhost" ||
      hostname === "[::1]" ||
      /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)

    if (isLoopback) {
      const remoteAddress = (req.socket?.remoteAddress ?? "").replace(/^::ffff:/i, "").replace(/^\[|\]$/g, "")
      const isLoopbackPeer =
        remoteAddress === "::1" ||
        remoteAddress === "localhost" ||
        /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(remoteAddress)

      if (!isLoopbackPeer) {
        res.writeHead(403, { "content-type": "text/plain" })
        res.end("forbidden")
      }
    } else if (!trustedHosts.has(hostname) && !trustedHosts.has(hostStr)) {
      res.writeHead(403, { "content-type": "text/plain" })
      res.end("forbidden")
    }
  })

  ctx.logger.info("dsh-security-web: HTTP Host guard active (QVD-2026-57410)")
}

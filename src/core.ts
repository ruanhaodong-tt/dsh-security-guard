import { Context } from "@deepseek-ai/cordis"
import z from "@deepseek-ai/schemastery"

export const name = "dsh-security-core"
export const inject = ["loader"]
export const Config = z.object({})

export function apply(ctx: Context): void {
  const origImport = ctx.loader.import.bind(ctx.loader)

  ctx.loader.import = function (this: any, name: string, getOuterStack?: () => string[]) {
    if (name.startsWith("cordis:")) {
      const builtin = this.builtins?.[name.slice(7)]
      if (builtin === undefined) {
        throw new Error("loader: unknown cordis builtin \"" + name.slice(7) + "\"")
      }
      return builtin
    }

    if (name.startsWith(".")) {
      const basePath = new URL(this.ctx?.baseUrl ?? "file:///").href
      const resolved = new URL(name, basePath).href
      const root = new URL(".", basePath).href
      if (!resolved.startsWith(root)) {
        throw new Error("loader: refusing to import \"" + name + "\" \u2014 it resolves outside the project root")
      }
      return origImport(name, getOuterStack)
    }

    if (name.startsWith("/") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(name)) {
      throw new Error("loader: refusing bare import \"" + name + "\" \u2014 only package specifiers and relative paths are allowed")
    }

    return origImport(name, getOuterStack)
  }

  ctx.logger.info("dsh-security-core: ctx.loader.import shadowed (QVD-2026-52631)")
}

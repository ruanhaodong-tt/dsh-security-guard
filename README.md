# DSH Security Guard / DSH 安全守卫

> **AI-assisted production.** Vulnerability triage, patch implementation, and plugin code were produced by an AI coding assistant (TraeWork / Trae) under human supervision. / 漏洞定位、补丁代码与插件实现均由 AI 编程助手（TraeWork / Trae）在人工监督下完成。

A runtime security guard plugin for [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) that applies defense-in-depth measures at the Cordis plugin layer. It does **not** modify the original source code — instead, it shadows runtime methods and intercepts HTTP requests to replicate the fixes from the [DSH Security Patch](https://github.com/ruanhaodong-tt/DSH-Security-Patch).

DSH 运行时安全守卫插件，在 Cordis 插件层施加纵深防御。**不修改原始源码**——通过运行时方法遮蔽与 HTTP 请求拦截来复制安全补丁的修复语义。

## Security Coverage / 安全覆盖

| CVE | Vulnerability / 漏洞类型 | Plugin Coverage / 插件覆盖 | Status / 状态 |
|-----|------------------------|--------------------------|--------------|
| **QVD-2026-52631** | Config loader arbitrary code execution / 配置加载任意代码执行 | Shadows `ctx.loader.import` to validate builtins, confine relative imports, and reject path-like bare specifiers | **Full / 完整** |
| **QVD-2026-57410** | HTTP Host header forgery RCE / Host 头伪造远程代码执行 | `prependListener` on `http.Server` rejects forged loopback Host claims from non-loopback peers | **Full / 完整** |
| **QVD-2026-52644** | VM sandbox exec escape / VM 沙箱 exec 逃逸 | **Cannot be covered by a plugin.** The `execView` sanitizer lives in a VM-internal closure. Apply the source patch. | **Not covered / 无法覆盖** |
| **QVD-2026-52646** | Prompt injection chain sandbox escape / 提示注入链式沙箱逃逸 | **Cannot be covered by a plugin.** The service deny-list is in the sandbox context factory. Apply the source patch. | **Not covered / 无法覆盖** |

### Important Caveat / 重要说明

The plugin cannot fix QVD-2026-52644 and QVD-2026-52646 because those mitigations are in VM-internal closures and the sandbox context factory — code paths that no Cordis plugin can intercept. **You must apply the [source patch](patches/dsh-security-0.1.1-rc.2.patch) for full protection.**

插件无法修复 QVD-2026-52644 和 QVD-2026-52646，因为这两处修复在 VM 内部闭包和沙箱上下文工厂中——Cordis 插件无法触及这些路径。**必须应用源码补丁以获得完整防护。**

## Installation / 安装

```bash
dsh plugin add ruanhaodong-tt/DSH-Security-Patch
```

Or add to your profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: dsh-security-core
      name: dsh-security-guard/core
      inject: [loader]

    - id: dsh-security-web
      name: dsh-security-guard/web
      inject: [webServer]
```

## Configuration / 配置

The web guard accepts an optional `trustedHosts` array for non-loopback authorities that should be allowed:

```yaml
- insert:
    - id: dsh-security-web
      name: dsh-security-guard/web
      inject: [webServer]
      config:
        trustedHosts: ["harness.internal:3080"]
```

## Verification / 验证

The plugin logs its activation on startup:

```
[INFO] dsh-security-core: ctx.loader.import shadowed (QVD-2026-52631)
[INFO] dsh-security-web: HTTP Host guard active (QVD-2026-57410)
```

You can also verify by sending a forged Host header:

```bash
curl -H "Host: localhost:3080" http://<public-ip>:3080/api/  # should return 403
```

## License / 许可证

MIT © 2026 一条大咸鱼

## Disclosure / 声明

This plugin was produced with AI assistance. It is not an official patch from DeepSeek, and has not been audited by the upstream. Use at your own risk.

本插件由 AI 辅助制作，并非 DeepSeek 官方补丁，未经上游审计。请自行评估风险后使用。
# doclog-ai

A persistent AI assistant. It retains your conversation and document history across sessions, so you spend less time re-explaining context. Your data is stored in your own Cloudflare account.

**Live example:** [doclog-ai.casey-digennaro.workers.dev](https://doclog-ai.casey-digennaro.workers.dev)

---
## Quick Start

This is a fork-first project. You run your own independent copy.

1.  Fork this repository.
2.  Deploy to Cloudflare Workers:
    ```bash
    npx wrangler deploy
    ```
3.  Set your API keys as secrets (only you hold these):
    ```bash
    npx wrangler secret put DEEPSEEK_API_KEY
    npx wrangler secret put GITHUB_TOKEN
    ```

Your instance will be live in about 10 seconds. You own all data it creates.

---
## Why This Exists

Most chat interfaces reset when you close the tab. This is built for work that continues over days or weeks, keeping your project's context accessible.

---
## What It Does

*   **Persistent Memory:** Conversations and notes are saved to Cloudflare KV.
*   **Document Tools:** Handles summaries, format conversion, and template generation.
*   **Multi-Model:** Defaults to DeepSeek, but works with any OpenAI-compatible API.
*   **Your Data:** You can export all your data as plain JSON at any time.
*   **Built-in Safeguards:** Includes per-IP rate limiting.
*   **Fleet-Compatible:** Supports the Cocapn Fleet protocol for coordination with other agents.

---
## Architecture

A single Cloudflare Worker file with zero runtime dependencies. All state is stored in your Cloudflare KV namespace.

---
## Limitations

Cloudflare KV has a 25MB limit per key. In practice, a single conversation thread can hold roughly 50,000 words before you may need to archive or prune older messages.

---
## License

MIT License.

Attribution: Superinstance and Lucineer (DiGennaro et al.).

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>
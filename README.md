<p align="center">
  <img src="https://raw.githubusercontent.com/Lucineer/capitaine/master/docs/capitaine-logo.jpg" alt="Capitaine" width="120">
</p>

<h1 align="center">doclog-ai</h1>

<p align="center">A document assistant that retains conversation context across sessions.</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#the-fleet">The Fleet</a> ·
  <a href="https://github.com/Lucineer/doclog-ai/issues">Issues</a>
</p>

---

**Live Instance:** [doclog-ai.casey-digennaro.workers.dev](https://doclog-ai.casey-digennaro.workers.dev)  
Powered by Capitaine · Cocapn Fleet Protocol

---

## Purpose

doclog-ai is a self-hosted document assistant that maintains persistent context. Unlike transient chat interfaces, it accumulates conversation history and document interactions in your own storage.

This approach allows the assistant to reference prior work and build understanding over time, rather than treating each interaction as isolated.

## How it works

This is a standalone Cloudflare Worker that you deploy yourself.
- The complete source is in this repository
- State is stored in Cloudflare KV
- No external databases or hidden dependencies
- Operates within the Cocapn fleet for cross-agent coordination

## Quick Start

1. Fork this repository
2. Set Cloudflare secrets for your LLM and GitHub tokens:
   ```bash
   echo "your-llm-key" | npx wrangler secret put DEEPSEEK_API_KEY
   echo "your-github-token" | npx wrangler secret put GITHUB_TOKEN
   ```
3. Deploy:
   ```bash
   npx wrangler deploy
   ```

Your instance will be available at your Worker URL.

## Features

- **Persistent context**: Conversations and document interactions are stored in KV
- **Multi-model support**: Configured for DeepSeek by default, compatible with other providers
- **Local operation**: Runs entirely on Cloudflare Workers
- **Built-in rate limiting**: Per-IP request limits
- **Health monitoring**: Standard `/health` endpoint
- **Fleet protocol**: CRP-39 compliant for secure agent coordination

## Limitations

Context storage uses Cloudflare KV, which has a 25MB per-key limit. Very long conversations may require manual pruning or alternative storage.

## Architecture

Single-file Worker with modular libraries:
- `worker.ts`: Main request handler and UI server
- `context.ts`: KV-based conversation management
- `byok.ts`: Model provider abstraction
- `transforms.ts`: Document processing utilities

## The Fleet

doclog-ai is part of the Cocapn Fleet—a collection of specialized agents that can securely coordinate. Each vessel handles one domain and operates independently.

<details>
<summary>Fleet Index</summary>

**Core Vessels**
- [cocapn.ai](https://github.com/Lucineer/capitaine) - Fleet coordination
- [personallog.ai](https://github.com/Lucineer/personallog-ai) - Personal journaling
</details>

---

<div align="center">
  <a href="https://the-fleet.casey-digennaro.workers.dev">Fleet Status</a> · 
  <a href="https://cocapn.ai">Cocapn Protocol</a>
</div>

<p align="center">
  <sub>Attribution: Superinstance & Lucineer (DiGennaro et al.) · MIT Licensed</sub>
</p>
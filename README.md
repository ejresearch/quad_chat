# QuadChat

QuadChat is a lightweight, local-first framework for querying four large language models in parallel to compare outputs side by side.

---

## Why QuadChat Exists

Many platforms allow users to query multiple LLMs simultaneously, but most are hosted services with limited transparency, constrained customization, or locked-in pricing models.

QuadChat is designed as an open-source, local framework that gives users full control over:

- API keys
- Rate limits
- Prompt structure
- Model comparison workflows

The goal is not abstraction, but clarity—making it easy to see how different models respond to the same prompt under the same conditions.

---

## How It Compares

| Feature | QuadChat | ChatHub | LibreChat | Nat.dev |
|---------|----------|---------|-----------|---------|
| Architecture | Local Python Server | Browser Extension | Local Node.js Server | Hosted Website |
| Data Storage | SQLite (Robust) | Browser Storage (Fragile) | MongoDB (Complex) | Cloud (Not yours) |
| Multi-Model View | Native 4-Pane Grid | 2-4 Pane Grid | 1-2 Panes (mostly) | Multi-row list |
| Setup Difficulty | Low (Script) | Very Low (Install) | High (Docker/Env) | None (Login) |
| Ideal User | Technical Creatives | Casual Users | Enterprise / Teams | Benchmarkers |

---

## Features

- Parallel querying of four LLMs for direct output comparison
- Support for the latest released APIs from major model providers
- System prompt configuration for consistent prompt engineering
- Optional document upload to provide shared context
- Familiar chat-style interface inspired by common LLM platforms
- Bring-your-own API keys with full local control

---

## Tech Stack

- **Backend:** Python 3.11+ / FastAPI / Uvicorn
- **Frontend:** Vanilla JavaScript (no frameworks)
- **Database:** SQLite (zero-config local storage)
- **Provider SDKs:** OpenAI, Anthropic, Google Generative AI, xAI

---

## Quick Start

```bash
git clone https://github.com/yourusername/quadchat.git
cd quadchat
./install.sh
```

This installs the `quadchat` command globally. First run will set up the Python environment automatically.

---

## API Keys

QuadChat requires an API key for each provider you want to query. Create accounts and generate keys directly from each provider:

| Provider | Get API Key |
|----------|-------------|
| OpenAI | https://platform.openai.com/api-keys |
| Anthropic (Claude) | https://console.anthropic.com/settings/keys |
| Google (Gemini) | https://ai.google.dev/gemini-api/docs/api-key |
| xAI (Grok) | https://x.ai/api |

Add your keys to `quadchat_app/backend/.env`:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
XAI_API_KEY=xai-...
```

Keys are stored locally and never shared.

---

## Running QuadChat

**From terminal:**

```bash
quadchat
```

**From Desktop app:**

Double-click `QuadChat.app` on your Desktop.

QuadChat runs locally at `http://localhost:8001`.

---

## Usage

1. Enter a system prompt (optional)
2. Upload reference documents (optional)
3. Submit a user prompt
4. Review model outputs side by side

**Use cases:**

- Prompt engineering
- Model evaluation
- Qualitative comparison
- Learning and experimentation

---

## Model Configuration

Click any provider logo in the chat header to:

- **Toggle On/Off:** Enable or disable individual providers
- **Select Model:** Choose which model version to use (GPT-5, Claude Opus, Gemini Pro, etc.)

Only enabled providers appear in the response grid.

---

## First-Time Setup

On first launch, an interactive setup guide walks you through:

1. Adding API keys
2. Configuring system prompts and documents
3. Selecting models
4. Installing the desktop app

Reopen the guide anytime by clicking the **?** button in the sidebar.

---

## Desktop App

To install QuadChat as a desktop application:

1. Run `quadchat` to start the server
2. Open Settings (gear icon in sidebar)
3. Click **Install to Desktop**

This creates `QuadChat.app` on your Desktop. Double-click to launch QuadChat as a standalone app window.

---

## License

MIT

---

## Acknowledgements

This project uses APIs provided by:

- OpenAI
- Anthropic
- Google DeepMind
- xAI

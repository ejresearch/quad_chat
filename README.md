# ASHER Project

AI Provider Testing & Comparison Tools

## Overview

This repository contains two related tools for testing and comparing AI providers:

| Tool | Description | Status |
|------|-------------|--------|
| **AsherGO** | Production app with authentication, saved conversations, and multi-provider testing | Active (Render) |
| **ASHER** | Original standalone A/B/C/D testing tool (no auth required) | Legacy |

## Structure

```
ASHER/
├── ashergo/                 # Production tool (Render-facing)
│   ├── backend/             # FastAPI server
│   │   ├── server.py        # Main server
│   │   ├── ai_providers.py  # AI integrations
│   │   ├── database.py      # PostgreSQL
│   │   ├── routes_*.py      # API routes
│   │   └── requirements.txt
│   └── frontend/            # Web UI
│       ├── index.html       # Main app (AsherGO)
│       ├── landing.html     # Landing page
│       ├── auth.html        # Authentication
│       ├── js/ashergo.js    # Frontend logic
│       ├── css/
│       └── images/
│
├── legacy/                  # Original ASHER (standalone)
│   ├── index.html           # Original testing UI
│   ├── js/app_new.js        # Frontend logic
│   ├── css/
│   ├── images/
│   ├── docs/                # Documentation
│   └── start.sh             # Local startup script
│
├── render.yaml              # Render deployment config
└── README.md                # This file
```

## AsherGO (Production)

Full-featured AI testing platform with:
- User authentication (signup/login)
- Persistent conversation history
- Multi-provider comparison (OpenAI, Anthropic, Google, xAI)
- Document upload & reference
- PostgreSQL database

### Deploy to Render

1. Push to GitHub
2. Connect repo to Render
3. Render auto-detects `render.yaml`
4. Add API keys in Render dashboard

### Run Locally

```bash
cd ashergo/backend
pip install -r requirements.txt
python server.py
```

Open: http://localhost:8001

## ASHER Legacy (Standalone)

Original tool for quick A/B/C/D testing without authentication.

### Run Locally

```bash
cd legacy
./start.sh
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (AsherGO) | PostgreSQL connection string |
| `JWT_SECRET` | Yes (AsherGO) | Secret for JWT tokens |
| `OPENAI_API_KEY` | Optional | OpenAI API key |
| `ANTHROPIC_API_KEY` | Optional | Anthropic API key |
| `GOOGLE_API_KEY` | Optional | Google Gemini API key |
| `XAI_API_KEY` | Optional | xAI Grok API key |

## Supported AI Providers

- OpenAI (GPT-4, GPT-5, o3)
- Anthropic (Claude Sonnet, Claude Opus)
- Google (Gemini Pro, Gemini Flash)
- xAI (Grok)

## License

MIT

# MemoDrop

**Your memory, finally organized.**

MemoDrop is an AI-powered memory assistant. You dump anything — shopping links, documents, supplier quotes, customer complaints, random thoughts, reminders, voice notes — with zero structure required, and later ask for it back in plain language. MemoDrop classifies, tags, and stores everything automatically, so nothing you save is ever truly lost.

Built for **TakeOver'26 Hackathon**.

🔗 **Live Demo:** [MemoDrop - AI Memory Assistant](https://memodrop.onrender.com/)

---

## The Problem

People constantly generate scattered fragments of information they mean to revisit — but default to dumping them wherever is fastest: a notes app, a random chat, a photo gallery. None of these were built to be memory systems, so none of them give anything back.

- **Individuals** lose track of shopping links, ideas, and personal information.
- **Small business owners** lose supplier quotes, customer orders, and complaints scattered across chats and notes, leading to missed follow-ups and lost business.

In both cases, capturing something takes a second — but organizing and retrieving it later takes effort nobody has. MemoDrop closes that gap.

## The Solution

A dedicated chat-style interface where you dump anything — text, links, images, documents, voice notes — and MemoDrop automatically:

- **Classifies** each entry (shopping link, document, task, complaint, quote, note, contact, reminder)
- **Extracts** key entities (dates, prices, links, names, phone numbers)
- **Summarizes and tags** content for fast, meaning-based retrieval
- **Stores** it in a structured + semantic memory layer

Ask a natural question later — *"what was that saree link from last week"* — and MemoDrop retrieves the exact original content, with context, instantly.

One engine serves two audiences: **individuals** who want a frictionless personal memory system, and **small business owners** who need an always-available record of suppliers, orders, and customers — without the cost of a full CRM.

## Hackathon Theme Alignment

- **Theme 2 — AI Automation & Intelligent Agents** (primary): AI Knowledge Assistant for fragmented information
- **Theme 1 — Business Digitization** (secondary): Digital record-keeping for SMEs currently relying on scattered manual tracking
- **Theme 7 — Analytics & Decision Intelligence** (tertiary): Monthly insights surfaced from saved memories, with no manual reporting required

## Key Features

- 🗑️ **Zero-friction capture** — text, links, images, documents, and voice notes, no folders or naming required
- 🧠 **Automatic classification** — every dump is tagged, categorized, and summarized on arrival
- 🔍 **Natural language recall** — ask in plain language, get the exact saved item back
- 🌐 **Multilingual voice input** — speak in your own language; MemoDrop transcribes, understands, and replies in kind
- 🏪 **Personal + Business modes** — one system, two audiences, switchable via a segmented toggle
- 📇 **Memory Vault** — a searchable, filterable dashboard of everything you've ever saved
- ✏️ **Live edit sync** — editing a dump re-classifies it and updates its record everywhere, instantly
- ⏰ **Smart reminders** — natural language due dates ("remind me Friday") are extracted automatically, surfaced via an on-load banner and a dedicated "Due Today" filter, with mark-done and snooze actions
- 💰 **Supplier quote comparison** — ask "which supplier quote was cheapest for X" and get an AI-generated comparison summary plus a side-by-side table across every quote saved for that item
- 📊 **Monthly insights card** — a lightweight "This Month" summary in the Vault (total memories saved, most common category, top tag) with zero manual reporting
- 📁 **Automatic document folder classification** — uploaded PDFs/DOCX files are read, classified by content (Government & Legal, Business & Finance, Academic & Coursework, Personal), and organized into folder views in the Vault automatically

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML/React, custom chat-app interface |
| Backend | Python, FastAPI |
| AI Processing | Groq LLM (classification, extraction, summarization, comparison) |
| Voice Transcription | Whisper (multilingual speech-to-text) |
| Document Parsing | pdfplumber / python-docx (text extraction for classification) |
| Structured Storage | Supabase (Postgres), with SQLite fallback |
| Semantic Search | pgvector (cosine similarity), TF-IDF fallback |
| Hosting | Railway / Render |

## Project Structure

```
memodrop/
├── main.py                # FastAPI app entrypoint, API routes
├── database.py             # Supabase/SQLite schema, fallback logic, vector search
├── schema.sql               # Postgres schema + match_memories RPC (pgvector)
├── static/
│   └── app.js               # Frontend-backend API integration
├── requirements.txt
└── README.md
```

### Key API Routes

| Route | Purpose |
|---|---|
| `POST /memories` | Save a new memory (text, link, document, voice, quote, reminder) |
| `GET /memories/recall` | Natural language semantic recall |
| `GET /reminders/due` | Fetch all pending reminders due now or earlier |
| `PATCH /reminders/{id}/done` | Mark a reminder as done |
| `PATCH /reminders/{id}/snooze` | Push a reminder's due date forward |
| `POST /quotes/compare` | Compare saved supplier quotes for a given item |
| `GET /vault/insights` | Monthly aggregate stats (total saved, top category, top tag) |
| `GET /vault/documents` | Documents grouped by auto-classified folder |

## Getting Started

### Prerequisites
- Python 3.10+
- A Supabase project (or SQLite fallback works out of the box)
- An LLM API key (Groq)

## Team

Built by **Leharin Nisha**, **Geethalakshmi**, and **Shimharshini** — AMET University, Chennai.

## Roadmap

- WhatsApp integration (via Twilio/Meta Cloud API) as an additional capture channel
- Passive surfacing — proactively resurfacing saved items without being asked
- Expanded regional language support beyond Tamil/Hindi
- Export and sharing for business records (supplier quotes, complaints)

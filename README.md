# MemoDrop

**Your memory, finally organized.**

MemoDrop is an AI-powered memory assistant. You dump anything — shopping links, documents, supplier quotes, customer complaints, random thoughts, reminders, voice notes — with zero structure required, and later ask for it back in plain language. MemoDrop classifies, tags, and stores everything automatically, so nothing you save is ever truly lost.


🔗 **Live Demo:** [MemoDrop - AI Memory Assistant](https://memodrop.onrender.com/)

---

## The Problem

People constantly generate scattered fragments of information they mean to revisit — but default to dumping them wherever is fastest: a notes app, a random chat, a photo gallery. None of these were built to be memory systems, so none of them give anything back.

- **The WhatsApp & Screenshot Graveyard:** Over 80% of users dump links, voice notes, and receipts into "Message Yourself" or screenshot galleries because capture takes $< 2$ seconds. Over 90% are never revisited due to high search friction.
- **Exact-Keyword Search Failure:** Built-in search in notes and chat apps relies on exact substring matches. Saving *"outfit for daughter's wedding"* yields zero results when searching *"saree"*. Human memory is semantic, not syntactic.
- **The Day-of-Deadline Alarm Fallacy:** Conventional reminder apps alert you at 9:00 AM on the deadline morning. For complex assignments or tasks requiring 3–5 days of preparation, day-of notifications arrive too late.
- **Micro-SME Fragmentation:** Small business owners track fluctuating quotes, customer orders, and complaints scattered across loose chats and paper slips, leading to missed follow-ups, lost supplier margins, and painful month-end manual audits.

---
## The Solution

A dedicated mobile-first chat interface where you dump anything — text, links, camera captures, documents, voice notes — and MemoDrop automatically:
- **Classifies each entry** (quote, complaint, reminder, note, idea, link, document, contact)
- **Extracts key entities** (dates, prices, links, names, phone numbers, addresses)
- **Summarizes and tags content** for fast, meaning-based retrieval
- **Stores it in a dual semantic memory layer** (Supabase pgvector + local SQLite offline cache)

Ask a natural question later — *"what was that saree link from last week"* or *"who gave the lowest rate for cotton rolls"* — and MemoDrop retrieves the exact original content, with context, instantly.

One engine serves two audiences: individuals who want a frictionless personal memory system, and small business owners who need an always-available record of suppliers, orders, and customers — without the cost of a full ERP or CRM.

---

## Ecosystem & Hardware Synergy

- **Productivity Track:** A phone-first AI second brain designed to eliminate upfront organizational friction through semantic vector retrieval and context-aware task runways.
- **Native Mobile Hardware Integration:** Built around the smartphone sensor array—leveraging high-resolution camera capture for paper invoice and receipt OCR via Llama-3.2 Vision, low-latency microphone telemetry for multilingual speech ingestion (Whisper), and tactile haptic event triggers.
- **Cross-Device Productivity (vivo Office Kit):** Employs the smartphone as an agile field collector while streaming real-time memory events over WebSockets to a mirrored desktop cockpit, enabling seamless mobile-to-desktop hand-offs without manual sync.
- **Business Digitization & Decision Intelligence:** Side-by-side quote arbitrage and auto-generated month-end ledgers replacing manual auditing for micro-merchants.

---

## Key Features

### Core Everyday Experience
- 🗑️ **Zero-friction capture** — text, links, camera images, documents, and voice notes; no folders, tags, or naming required upfront.
- 🧠 **Automatic classification** — every dump is tagged, categorized, and summarized on arrival.
- 🔍 **Natural language vector recall** — ask in plain language (e.g., *"where is that saree link?"*); retrieves contextually via vector embeddings instead of exact keywords.
- 🌐 **Multilingual voice input** — speak naturally in Tamil, Hindi, or English; Whisper transcribes, extracts core intent, and indexes seamlessly.
- 🏪 **Personal + Business modes** — one system, two audiences, switchable via a segmented toggle.
- 📇 **Memory Vault** — a searchable, filterable dashboard of everything you've ever saved.
- ✏️ **Chat Action Bar (Edit, Delete, Copy)** — familiar messaging controls on every bubble; inline edits re-classify and re-index vector embeddings in real time.

### Smarter Organization & Tasks
- ⏰ **Active Runway Reminders** — context-aware deadline scheduling calculates a 3–5 day lead buffer, surfacing tasks early in an "Active Zone" so you have drafting time before the hard deadline.
- 🔀 **Smart Split for rambling dumps** — parses multi-intent voice notes (*"Call electrician, order 40 cotton rolls, submit project by Monday"*) and prompts a one-tap action to split into separate Contact, Quote, and Task cards.
- 📁 **Convert search results to a folder** — organize after you ask, not before. Querying a topic (e.g., *"what are my UI/UX notes"*) provides a one-tap button: `📁 Convert these into a Folder`.
- ⚡ **One-tap action triggers** — extracted phone numbers trigger direct **📞 Call / 💬 WhatsApp** buttons, addresses open in Maps, and links render rich preview cards.

### Business Mode (For Micro-SMEs & Freelancers)
- 💰 **Side-by-side supplier quote comparison** — ask *"which supplier quote was cheapest for cotton rolls"* and get an AI-generated summary plus a comparative side-by-side table across every saved quote.
- 📊 **Zero-effort month-end summary** — auto-tallies total expenses, top cost categories, vendor spend, and logged complaints into an instant summary card with zero manual bookkeeping.
- 📦 **Dispute & Return Dossier** — snap a photo of damaged inventory, record a quick voice complaint, and generate a formatted incident slip ready to share via WhatsApp.
- 📁 **Automatic document folder classification** — uploaded PDFs/DOCX files are read, classified by content (Government & Legal, Business & Finance, Academic & Coursework, Personal), and organized into folder views in the Vault automatically.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML/React, Tailwind CSS, custom mobile-first chat interface |
| **Backend** | Python 3.10+, FastAPI, Uvicorn |
| **AI Processing** | Groq LLMs (`llama-3.3-70b-versatile` for routing, entities, comparison) |
| **Vision OCR** | Groq Vision (`llama-3.2-11b-vision` for receipts and document parsing) |
| **Voice Transcription** | Whisper (`whisper-large-v3` for multilingual speech-to-text) |
| **Document Parsing** | `pdfplumber` / `python-docx` (text extraction for classification) |
| **Structured Storage** | Supabase (PostgreSQL), with embedded SQLite local cache fallback |
| **Semantic Search** | `pgvector` (cosine similarity), TF-IDF fallback |
| **Real-Time Cross-Device** | WebSockets (`/ws/sync`) + vivo Office Kit screen mirroring |
| **Hosting** | Railway / Render |

---

## Project Structure

```
memodrop/
├── main.py                # FastAPI app entrypoint, API routes, WebSocket sync hub
├── database.py            # Supabase/SQLite schema, fallback logic, vector search
├── schema.sql             # Postgres schema + match_memories RPC (pgvector)
├── validate_pipeline.py   # Test script for ingestion, OCR & semantic recall
├── static/
│   ├── index.html         # Mobile-first web app & desktop vault layout
│   ├── app.js             # Frontend-backend API integration & audio recording
│   └── styles.css         # Dark glassmorphic styling
├── requirements.txt
└── README.md
```

### Key API Routes

| Route | Purpose |
| :--- | :--- |
| `POST /memories` | Save a new memory (text, link, document, voice, camera OCR, quote, reminder) |
| `GET /memories/recall` | Natural language semantic vector recall |
| `PUT /memories/{id}` | Inline edit memory content (automatically re-indexes vector embeddings) |
| `DELETE /memories/{id}` | Delete a memory record permanently from vector store |
| `POST /memories/split` | Smart split rambling dumps into distinct Task, Quote, and Contact cards |
| `GET /reminders/due` | Fetch all pending reminders due or active within their lead runway |
| `PATCH /reminders/{id}/done` | Mark an Active Runway task as completed |
| `PATCH /reminders/{id}/snooze` | Push a task runway or deadline date forward |
| `POST /vault/folders/create` | Group dynamic query results into an auto-classified permanent folder |
| `POST /quotes/compare` | Compare saved supplier quotes side-by-side for a given item |
| `GET /vault/insights` | Monthly aggregate stats (total spend, top vendor, active quotes, complaints) |
| `POST /business/disputes` | Generate structured dispute dossier slip for WhatsApp export |
| `GET /vault/documents` | Documents grouped by auto-classified folder |
| `WS /ws/sync` | Real-time WebSocket connection for vivo Office Kit live desktop sync |

---

## Getting Started

### Prerequisites
- Python 3.10+
- A Supabase project with `pgvector` enabled (or embedded SQLite fallback works out of the box)
- A Groq Cloud API key

### Installation
```bash
# 1. Clone repository
git clone [https://github.com/your-username/memodrop.git](https://github.com/your-username/memodrop.git)
cd memodrop

# 2. Set up virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables (.env)
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=your_supabase_project_url  # Optional
SUPABASE_KEY=your_supabase_anon_key      # Optional

# 5. Run pipeline validation
python validate_pipeline.py

# 6. Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

```
Built by **Leharin Nisha**— AMET University, Chennai.

## Roadmap

- Snapdragon NPU Quantization: On-device quantized SLM inference for offline vector classification.
- WhatsApp Webhook Ingestion: Passive capture channel via Meta Cloud API / Twilio.
- Expanded Regional Dialects: Enhanced transcription across additional Indian regional languages.
- Collaborative Vaults: Shared multi-merchant spaces for partner inventory and quote sharing.

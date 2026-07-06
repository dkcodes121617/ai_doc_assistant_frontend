# Document-Based AI Assistant

A production-grade, full-stack RAG (Retrieval-Augmented Generation) assistant that enables users to upload documents (PDF, DOCX, TXT) and ask questions with exact, inline citations.

## Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database / Vector Store:** ChromaDB (local ephemeral or persistent)
- **Embeddings:** Google Gemini `models/gemini-embedding-001`
- **LLM:** Google Gemini `gemini-2.0-flash`
- **Document Processing:** `pdfplumber` (text PDFs), `pypdfium2` + Gemini Vision (image-only/scanned PDFs), `python-docx` (Word documents)
- **Streaming:** Server-Sent Events (SSE) via `sse-starlette`
- **Rate Limiting:** `slowapi`
- **Validation:** Pydantic & `python-magic`

### Frontend
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom Indigo/Blue Theme)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Notifications:** Sonner

## Features

- **Multi-format Uploads:** Supports PDF, DOCX, and TXT files (up to 10MB).
- **Vision OCR:** Automatically detects image-only or scanned PDFs (if text < 30 chars per page) and uses Gemini Vision to extract text natively.
- **DOCX Parsing:** Intelligently groups Word paragraphs into ~3000-character synthetic pages so they can be chunked identically to PDFs.
- **Smart Chunking:** Documents are split using a semantic Markdown text splitter to preserve context boundaries.
- **Smart Inline Citations:** The LLM cites sources inline (e.g. `[1]`, `[2]`). If multiple relevant paragraphs are retrieved from the same page, the backend automatically groups them into a single citation, so the source panel displays all relevant paragraphs for that page together without showing the entire unrelated page text.
- **Real-time Streaming:** Uses SSE to stream LLM tokens as they are generated, along with a "thinking" state.
- **Fully Responsive:** Mobile-first design with a slide-in drawer on mobile and a collapsible sidebar on desktop.

## How Chunking & Retrieval Works

1. **Extraction:**
   - **PDF (Text):** Extracted page-by-page using `pdfplumber`.
   - **PDF (Image/Scanned):** Rendered to PNG at 2x scale via `pypdfium2`, then passed to Gemini Vision for OCR.
   - **DOCX:** Extracted via `python-docx`, grouping paragraphs into 3000-character synthetic "pages".
   - **TXT:** Treated as a single page.

2. **Chunking:**
   - The text is passed through `MarkdownTextSplitter` from LangChain (configured via `RecursiveCharacterTextSplitter`).
   - The splitter breaks the text into chunks of ~1000 characters, with a 200-character overlap to prevent cutting off sentences mid-thought.
   - Each chunk retains metadata about its source document and page number.

3. **Embedding & Storage:**
   - Each chunk is embedded using `models/gemini-embedding-001`.
   - The embeddings and metadata are stored in ChromaDB.

4. **Retrieval & LLM Generation:**
   - The user's query is embedded and compared against the ChromaDB collection using cosine similarity.
   - The top 5 most relevant chunks are retrieved.
   - The backend groups these chunks by page number, merging multiple paragraphs from the same page into a single context block.
   - These merged page contexts are injected into the system prompt.
   - The LLM streams the answer using SSE, citing the chunks.
   - The final SSE event sends the citations payload, which the frontend uses to populate the Source Panel.

## Setup & Running

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Copy env example and add your Gemini API key
cp .env.example .env

uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

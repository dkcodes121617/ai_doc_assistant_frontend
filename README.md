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
- **Smart Chunking:** Documents are dynamically split using a custom Recursive Character Text Splitter. It respects natural semantic boundaries (paragraphs and lines) ensuring chunks are highly coherent, up to a maximum of 800 characters.
- **Precise Inline Citations:** The LLM cites sources inline (e.g. `[1]`, `[2]`). If multiple paragraphs are retrieved from the same page, the backend preserves them as distinct citations, ensuring the source panel displays only the exact, specific paragraphs relevant to the answer rather than entire pages.
- **Anti-Hallucination Guardrails:** The LLM is configured with an expert, highly rigorous system prompt (specifically tailored for financial/complex PDFs). It explicitly forbids inferring data and forces the model to state exactly when information is missing rather than guessing.
- **Dynamic Suggested Questions:** When you upload documents, the backend reads a snippet of the content and uses the LLM to generate exactly 4 context-aware, dynamic suggested questions that are highly relevant to your specific files, replacing the generic starter prompts.
- **Real-time Streaming:** Uses SSE to stream LLM chat tokens as they are generated, as well as providing a live, real-time streaming progress bar directly from the backend during document uploads (reporting exact percentage and granular OCR status).
- **Fully Responsive:** Mobile-first design with a slide-in drawer on mobile and a collapsible sidebar on desktop.

## How Chunking & Retrieval Works

1. **Extraction:**
   - **PDF (Text):** Extracted page-by-page using `pdfplumber`.
   - **PDF (Image/Scanned):** Rendered to PNG at 2x scale via `pypdfium2`, then passed to Gemini Vision for OCR.
   - **DOCX:** Extracted via `python-docx`, grouping paragraphs into 3000-character synthetic "pages". If the DOCX contains no text (image-only), it automatically unzips the document, extracts embedded media, and runs them through Gemini Vision OCR.
   - **TXT:** Treated as a single page.

2. **Chunking:**
   - The text is passed through a custom built `RecursiveCharacterTextSplitter`.
   - The splitter intelligently breaks the text based on semantic boundaries (`\n\n`, then `\n`, then `. `), preserving natural paragraphs up to an 800-character limit with a 150-character overlap.
   - Each chunk retains metadata about its source document and page number.

3. **Embedding & Storage:**
   - Each chunk is embedded using `models/gemini-embedding-001`.
   - The embeddings and metadata are stored in ChromaDB.

4. **Retrieval & LLM Generation:**
   - The user's query is embedded and compared against the ChromaDB collection using cosine similarity.
   - The top 10 most relevant chunks are retrieved.
   - These retrieved contexts are injected into a highly rigorous, anti-hallucination system prompt demanding that the LLM cite its sources (e.g., `[1]`, `[2]`) and strictly stick to the exact provided numbers.
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

# Copy the env example file
cp .env.example .env.local

npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

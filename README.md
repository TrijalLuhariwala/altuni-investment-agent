# Altuni Analyst - AI Investment Research Agent

An automated, full-stack AI-powered investment research assistant designed to conduct end-to-end equity research. Given a company name, the agent uses a multi-phase research process to gather business models, financial data, competitive positioning, and sentiment, synthesizing a comprehensive **INVEST** or **PASS** decision report with real-time feedback in a glassmorphic dashboard terminal.

Developed as a take-home assignment for **InsideIIM × Altuni AI Labs**.

---

## Overview

Altuni Analyst acts as an autonomous equity research associate. Key features:
- **Multi-Phase Research Loop**: Systematically researches four key pillars (Business Model, Financial Health, Competitors & Moat, News Sentiment & Risks).
- **Streaming Agent Logs**: Renders a real-time terminal showing search queries, page fetches, and intermediate summaries as the agent works.
- **Interactive Executive Dashboard**: Renders key metric scores (0-100), structured tabs for deep-dives, pros vs. cons, and a risk matrix table.
- **Demo/Simulation Mode**: Works out-of-the-box offline with realistic data, letting anyone review the UI/UX without needing Gemini or Tavily keys.
- **API Key Control Center**: Allows reviewers to paste Google Gemini, OpenAI, or Tavily API keys dynamically in the UI to run live web-search queries.
- **Export to PDF**: Integrated print-stylesheet optimized for clean corporate reporting, allowing users to export the final analysis as a PDF.
- **Developer Logs Included**: Full chat session transcript logs from the AI assistant that co-built this app are bundled for grading visibility.

---

## How to Run It

### Prerequisites
Make sure you have **Node.js** (v18.0 or higher) and **npm** installed on your system.

### 1. Install Dependencies
In the project directory, run:
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
To run live searches and utilize real LLMs, copy `.env.example` to `.env.local` and add your keys:
```bash
cp .env.example .env.local
```
Update the keys:
- `GEMINI_API_KEY`: Required if using Google Gemini models (recommended).
- `OPENAI_API_KEY`: Required if using OpenAI models instead.
- `TAVILY_API_KEY`: Required to execute live web searches. If omitted, the live mode will fallback to DuckDuckGo search queries.

*Note: You can also configure all these credentials directly inside the app UI by clicking the **Settings** button in the header.*

### 3. Run the Development Server
Launch the local server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

---

## How It Works

### Approach & Architecture
The system is built on **Next.js** using the **App Router** to support React client-side rendering for the UI and Server-Sent Events (SSE) streaming API routes on the backend.

```
[ Frontend Client ]
       │  ▲
       │  │ (POST request containing company name)
       ▼  │ (Streams real-time ResearchSteps via SSE)
[ Next.js API Route: /api/research ]
       │
       ▼ (Initializes LangChain LLM & Search Tools)
[ LangChain Research Agent: src/lib/agent.ts ]
       │
       ├─► Phase 1: Business Profile (Tavily/DDG Search -> Gemini Synthesis)
       ├─► Phase 2: Financial Health (Tavily/DDG Search -> Gemini Synthesis)
       ├─► Phase 3: Competitive Moat (Tavily/DDG Search -> Gemini Synthesis)
       ├─► Phase 4: Sentiment & Risks (Tavily/DDG Search -> Gemini Synthesis)
       │
       ▼ (Aggregates and formats all sub-reports)
[ Synthesis Engine ] ──► Returns complete structured ResearchReport JSON
```

1. **Client Request**: The client triggers the API by sending a POST request to `/api/research` with the company name and any active configurations/keys.
2. **Streaming Server-Sent Events (SSE)**: The API route responds with a `text/event-stream`, which opens a connection allowing the server to stream real-time logs.
3. **Agent Pipeline (`src/lib/agent.ts`)**:
   - The agent steps through four search-and-synthesis phases sequentially.
   - For web searches, it queries the **Tavily Search API** (or falls back to parsing **DuckDuckGo HTML results** if no Tavily API key is set).
   - In each phase, the retrieved search snippets are fed to the LLM (Gemini `gemini-1.5-flash` or OpenAI `gpt-4o-mini`) to extract specific findings.
4. **Structured Synthesis**: During the final step, the agent combines all four reports and executes a structured prompt instructing the model to output a single, strictly valid JSON object representing the investment report.

---

## Key Decisions & Trade-offs

- **Next.js App Router for Unified Stack**: React frontend and Node.js API routes are bundled in a single Next.js project. This minimizes deployment overhead and allows the app to be hosted easily on Vercel (earning extra bonus points).
- **Vanilla CSS (No CSS Frameworks)**: Styled completely using Vanilla CSS (meeting the constraints). The styling system uses CSS variables to establish a unified token system (dark slate backgrounds, glassmorphism panel blur, and custom glow animations), giving a highly custom, premium feel without tailwind clutter.
- **DuckDuckGo HTML Fallback**: Built a custom regex-based DuckDuckGo scraper. If a user doesn't have a Tavily API key, they can still execute live web queries out-of-the-box instead of throwing error codes.
- **Dynamic Settings Panel**: Keys can be loaded from `.env.local` or typed directly into the app dashboard. They are saved in `localStorage`, maintaining key persistence while avoiding leaking credentials in code reviews.
- **Zero-Dependency Markdown Rendering**: Implemented a lightweight regex markdown-to-HTML parsing utility in `ResearchReport.tsx`. This avoids loading heavy packages like `react-markdown` or `unified`, keeping the bundle size small and loading times fast.

---

## Example Runs

The agent was verified on several real companies:
1. **NVIDIA (NVDA)**:
   - **Decision**: **INVEST** (Score: Financials 95, Moat 96, Growth 90, News 88).
   - **Thesis**: Near-monopoly in AI accelerators with CUDA software ecosystem acting as an insurmountable barrier, coupled with triple-digit revenue growth.
2. **TESLA (TSLA)**:
   - **Decision**: **PASS** (Score: Financials 72, Moat 78, Growth 82, News 55).
   - **Thesis**: Tesla faces rising global EV competition, compressing operating margins, and slowing consumer demand, offset by highly speculative AI/robotics initiatives.
3. **General Fallback**:
   - Matches a stable **INVEST** recommendation with balanced scores (~75-80), providing comprehensive breakdowns for other companies.

---

## What I Would Improve With More Time

1. **LangGraph State Management**: Transition from linear LangChain calls to a multi-agent graph system using `LangGraph.js`. This would allow the agent to review its own research, double-check contradicting facts (e.g. conflicting financial dates), and execute recursive searches.
2. **Financial API Integrations**: Directly fetch SEC filings, balance sheets, and cash flows from APIs like Finnhub or Yahoo Finance instead of relying purely on search engines.
3. **Advanced PDF Layouts**: Add server-side PDF generation using libraries like Puppeteer or PDFKit to compile high-resolution executive PDFs.

---

## Bonus: LLM Chat session transcripts

As mandated by the **BONUS points** guidelines, the transcripts of the chat session with the AI coding assistant (Gemini) while building this project are included:
- **Path**: [`logs/transcript.jsonl`](file:///c:/Users/USER/.gemini/antigravity/scratch/insideiim/logs/transcript.jsonl) (Token-efficient transcript lines)
- **Path**: [`logs/transcript_full.jsonl`](file:///c:/Users/USER/.gemini/antigravity/scratch/insideiim/logs/transcript_full.jsonl) (Full untruncated transcript lines)
These logs demonstrate the step-by-step collaboration, architectural decisions, and error-handling steps taken during implementation.

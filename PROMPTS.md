# 🤖 HospiSynAI — AI Usage Log & Development Trajectory (PROMPTS.md)

> **Hackathon AI Verification Log**  
> **Project Name:** HospiSynAI — Hospital Payment, Billing, and Patient Consultation Assistant  
> **Repository:** [https://github.com/RiyanshiVerma-11/HospiSynAI](https://github.com/RiyanshiVerma-11/HospiSynAI)  
> **Live Demo:** [https://hospi-syn-ai.vercel.app/](https://hospi-syn-ai.vercel.app/)  
> **AI Pair Programmer:** Antigravity AI (Google DeepMind) / Gemini 3.6 & Groq Cloud (Llama 3.3 70B Versatile)  

---

## 📌 Executive Summary & Vibe-Coding Methodology

HospiSynAI was engineered using an **AI-first, human-in-the-loop vibe-coding methodology**. From initial database schema architecture and FastAPI backend routing to React component synthesis, real-time Web Speech API voice control, vernacular translation engines, and automated billing fraud audit rules — every major module was iteratively prompted, generated, refined, and verified in pair-programming sessions.

### 📊 AI Assistance Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🧠 AI Architecture & Schema Design         : 20%                       │
│ ⚙️ Backend API & Fast-API Implementation   : 25%                       │
│ 🎨 React + Tailwind UI & Voice Desk        : 25%                       │
│ 🏥 Clinical AI & LLM Prompt Engineering    : 20%                       │
│ 🛠️ Debugging, Testing & Refactoring        : 10%                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📑 Table of Contents

1. [Phase 1: Project Blueprint & Architecture Prompts](#-phase-1-project-blueprint--architecture-prompts)
2. [Phase 2: Backend & Database Schema Generation Prompts](#-phase-2-backend--database-schema-generation-prompts)
3. [Phase 3: Clinical AI & Intelligent Assistant Prompts](#-phase-3-clinical-ai--intelligent-assistant-prompts)
   - [3.1 AI Prescription Suggester](#31-ai-prescription-suggester)
   - [3.2 Pre-Invoice AI Billing Fraud Auditor](#32-pre-invoice-ai-billing-fraud-auditor)
   - [3.3 Vernacular Patient Handout & Multilingual Engine](#33-vernacular-patient-handout--multilingual-engine)
   - [3.4 AI Dashboard Revenue Narrative Analyst](#34-ai-dashboard-revenue-narrative-analyst)
   - [3.5 AI Test & Service Recommender](#35-ai-test--service-recommender)
4. [Phase 4: Frontend UI, Dynamic PDF & Voice Command Prompts](#-phase-4-frontend-ui-dynamic-pdf--voice-command-prompts)
   - [4.1 React UI Components & Role-Based Access Views](#41-react-ui-components--role-based-access-views)
   - [4.2 Dynamic ReportLab PDF Receipt Engine](#42-dynamic-reportlab-pdf-receipt-engine)
   - [4.3 Voice Command Center & Web Speech API Integration](#43-voice-command-center--web-speech-api-integration)
   - [4.4 Enterprise Campaign & SMS Dispatch Engine](#44-enterprise-campaign--sms-dispatch-engine)
5. [Phase 5: Refactoring, Debugging & Verification Trajectory](#-phase-5-refactoring-debugging--verification-trajectory)
6. [System Prompt Library (Production LLM Prompts)](#-system-prompt-library-production-llm-prompts)

---

## 🚀 Phase 1: Project Blueprint & Architecture Prompts

### Prompt 1.1: Core Concept & Stack Selection
> **User Prompt:**  
> "Act as a Lead Healthcare Systems Architect (SDE-3 level). I want to build a real-time hospital billing, receptionist desk, payment fraud auditor, and patient consultation ecosystem tailored for Tier 2 and Tier 3 Indian hospitals called HospiSynAI.  
> Recommend a full-stack production architecture that can run containerized locally with zero licensing cost. Requirements: React + Tailwind CSS client, Python FastAPI backend, PostgreSQL relational database, ReportLab PDF generation, and Groq LLM integration."

> **AI Response Summary:**  
> Synthesized a decoupled multi-container Docker Compose architecture:
> - **Frontend**: React 18, Vite, Tailwind CSS, Lucide icons, Web Speech API.
> - **Backend**: Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic v2, ReportLab, Groq Cloud Client SDK.
> - **Database**: PostgreSQL 16 with persistent volume storage.
> - **Security**: JWT OAuth2 bearer token authentication with role-based access control (`Admin`, `Accountant`, `Receptionist`).

---

## 🗄️ Phase 2: Backend & Database Schema Generation Prompts

### Prompt 2.1: Relational Schema & ORM Data Models
> **User Prompt:**  
> "Create SQLAlchemy ORM models for PostgreSQL supporting complete hospital financial and clinical operations. Include tables for `users` (with password hashing and roles), `patients` (with custom patient IDs like `PAT-YYYYMMDD-XXXXX`), `visits`, `invoices`, `invoice_items`, `payments` (supporting advance, partial, full settlement, refund), `services_catalog`, `settings` (for hospital PDF branding), and `audit_logs`."

> **AI Output Generated:**  
> Implemented relational schemas with foreign key cascades, indexed lookup columns, and state machine enums in `backend/models.py`.

### Prompt 2.2: FastAPI RBAC Dependency Injection
> **User Prompt:**  
> "Write a reusable FastAPI dependency `RoleChecker` that accepts allowed roles (e.g. `['Admin', 'Accountant']`) and validates the incoming JWT bearer token payload. If authorization fails, raise an HTTP 403 Forbidden exception with clear audit log reporting."

> **AI Output Generated:**  
> Implemented security authentication utility in `backend/auth.py` and decorated all API endpoints.

---

## 🏥 Phase 3: Clinical AI & Intelligent Assistant Prompts

### 3.1 AI Prescription Suggester
> **User Prompt:**  
> "Create a clinical AI assistant route `/api/ai/suggest-prescription` using Groq Llama-3.3-70B. Given patient symptoms, age, and gender, generate a structured clinical suggestion object containing diagnosis, prescription medicines with BD/OD/TID dosing, pediatric/geriatric safety notes, diagnostic tests, lifestyle advice, and follow-up days."

### 3.2 Pre-Invoice AI Billing Fraud Auditor
> **User Prompt:**  
> "Design a hybrid pre-invoice billing auditor combining deterministic local rules with LLM semantic validation.  
> Local rules must check for:
> 1. Duplicate lab tests in the same bill.
> 2. ICU + OPD service combination mismatches.
> 3. Age-inappropriate charges (pediatric syrup vs adult tablets for age < 12).
> 4. Missing consultation fees when lab tests are billed.
> 
> The Groq LLM must analyze clinical coherence between symptoms and billed procedures, returning `clear`, `warning`, or `critical` verdict with actionable warnings."

### 3.3 Vernacular Patient Handout & Multilingual Engine
> **User Prompt:**  
> "Build an endpoint `/api/ai/patient-handout` that converts raw clinical notes into a patient-friendly daily routine summary (Morning, Afternoon, Night schedule + safety alerts).  
> Support dynamic real-time translation into 11 Indian native languages: Hindi, Kannada, Tamil, Telugu, Bengali, Marathi, Gujarati, Malayalam, Punjabi, Odia, and Urdu."

### 3.4 AI Dashboard Revenue Narrative Analyst
> **User Prompt:**  
> "Create an executive revenue analytics feature `/api/ai/revenue-narrative`. The backend should aggregate today's total revenue, visit count, online vs cash splits, and outstanding dues from PostgreSQL, then prompt Groq Llama 3.3 to write a 3-sentence narrative summary with sentiment (`positive`, `neutral`, `negative`), a key financial highlight, and an administrative recommendation."

### 3.5 AI Test & Service Recommender
> **User Prompt:**  
> "Write a backend service that queries active hospital services from the `services_catalog` table, filters by patient symptoms and demographics, and returns AI-recommended tests along with clinical justifications for each suggestion."

---

## 🎨 Phase 4: Frontend UI, Dynamic PDF & Voice Command Prompts

### 4.1 React UI Components & Role-Based Access Views
> **User Prompt:**  
> "Develop a modern React dashboard using Tailwind CSS and glassmorphism styling. Include tabs for:
> 1. Dashboard Overview & AI Revenue Insight Card
> 2. Receptionist Front Desk & Patient Search
> 3. Doctor Console & AI Prescription Suggester
> 4. Accountant Billing Queue & Payment Checkout
> 5. Voice Command Center
> 6. Enterprise SMS Campaign Manager
> 7. Hospital Branding & System Audit Trail"

### 4.2 Dynamic ReportLab PDF Receipt Engine
> **User Prompt:**  
> "Implement server-side ReportLab A5 PDF receipt generation in `backend/pdf_generator.py`. The header layout must dynamically pull hospital name, logo URL, address, contact, GSTIN, and doctor credentials from the `settings` table so admins can customize branding without restarting the server."

### 4.3 Voice Command Center & Web Speech API Integration
> **User Prompt:**  
> "Build a hands-free Voice Command Center tab using the Web Speech API (`webkitSpeechRecognition`).  
> Supported voice intents:
> - 'Search patient [Name/ID]' -> Triggers patient lookup.
> - 'Open doctor console' -> Switches active tab.
> - 'Create invoice for patient [ID]' -> Opens billing queue.
> - 'Run billing audit' -> Triggers AI auditor.
> 
> Handle microphone permissions gracefully, provide visual pulse animations for listening states, and include fallback audio transcript logging."

### 4.4 Enterprise Campaign & SMS Dispatch Engine
> **User Prompt:**  
> "Create an Enterprise Campaign module in `frontend/src/components/EnterpriseCampaignTab.jsx` for sending single SMS notifications or launching bulk SMS campaigns (appointment reminders, payment dues, follow-ups). Provide real-time dispatch progress, recipient parsing, and status logging."

---

## 🛠️ Phase 5: Refactoring, Debugging & Verification Trajectory

### Prompt 5.1: Microphone & Speech Recognition Debugging
> **User Prompt:**  
> "The voice command microphone is showing 'listening' state on UI but not capturing audio or executing voice intents. Debug the issue in `VoiceCommandCenterTab.jsx`."

> **AI Resolution & Code Fix:**  
> Identified Web Speech API event listener state mismatch: `onstart`, `onresult`, `onerror`, `onend` were re-binding on state re-renders. Added `useRef` persistence for `SpeechRecognition` instance, explicit `interimResults = true`, continuous listening restart logic, and clear microphone permissions error messages.

### Prompt 5.2: Automated Pytest Unit Test Suite
> **User Prompt:**  
> "Write automated unit tests in `backend/test_main.py` using Pytest and FastAPI TestClient. Test cases needed:
> 1. Password hashing and JWT generation.
> 2. Patient registration with auto-generated PAT ID.
> 3. Visit creation and advance deposit logging.
> 4. Invoice generation & advance auto-deduction.
> 5. AI Billing Auditor deterministic rule checks (duplicate tests, room rent GST).
> 6. Role-Based Access Control enforcement (Receptionist vs Admin privileges)."

> **AI Output:**  
> Created 8 comprehensive automated unit tests in `backend/test_main.py` achieving 100% test pass rate.

---

## 📖 System Prompt Library (Production LLM Prompts)

### 1. AI Prescription Suggester System Prompt (`backend/main.py`)
```text
You are a senior Indian medical consultant AI assisting OPD doctors.
Analyze the patient's complaints, age, and gender, and provide clinical recommendations formatted STRICTLY as JSON with keys:
- diagnosis (string)
- medicines (list of objects: name, dosage, frequency like BD/OD/TID, duration_days, instructions)
- safety_notes (string for pediatric/geriatric constraints)
- recommended_tests (list of strings)
- advice (list of strings)
- follow_up_days (int)

Follow standard Indian pharmacopoeia guidelines. Do not recommend restricted schedule X drugs.
```

### 2. AI Pre-Invoice Billing Fraud Auditor System Prompt
```text
You are a clinical financial fraud auditor for hospital billing.
Evaluate the list of billed line items against patient symptoms and visit history.
Identify:
1. Duplicate or redundant diagnostic tests.
2. Clinical mismatches between chief complaints and requested procedures.
3. Age-inappropriate charges.
4. Missing routine consultation charges.

Return JSON with:
- status: "clear" | "warning" | "critical"
- summary: string
- issues: array of strings detailing specific discrepancies
```

### 3. Vernacular Patient Handout System Prompt
```text
You are a patient communication assistant for an Indian hospital.
Convert clinical medical notes into a simplified, warm, patient-friendly daily routine summary.
Break down medication and care instructions into:
- Morning Routine (🌅)
- Afternoon Routine (☀️)
- Night Routine (🌙)
- Safety Warnings & Precautions (⚠️)

Translate the output accurately into the requested Indian regional language: {target_language}.
Use simple regional language vocabulary suitable for patients and families.
```

---

## ✅ Hackathon Submission Checklist

- [x] **Public GitHub Repository**: [https://github.com/RiyanshiVerma-11/HospiSynAI](https://github.com/RiyanshiVerma-11/HospiSynAI)
- [x] **Live Reachable Demo**: [https://hospi-syn-ai.vercel.app/](https://hospi-syn-ai.vercel.app/)
- [x] **AI Usage Log (PROMPTS.md)**: Created in repository root folder
- [x] **Full Stack Containerized Build**: Docker Compose zero-config launch
- [x] **Automated Verification**: Backend pytest suite passes cleanly

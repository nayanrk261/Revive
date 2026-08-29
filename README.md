# Revive — AI Revenue Recovery Agent

> **Revive** is an autonomous AI dunning and revenue recovery agent that diagnoses payment failures, subscription churn, abandoned checkout carts, and overdue invoices, executing customized, risk-aware recovery actions to minimize customer friction and reclaim lost revenue.

---

## 🏆 Built For
**Razorpay AI Buildathon 2026** — *Track 03: AI Revenue Recovery*

---

## 🚨 The Problem

Modern online businesses lose significant revenue due to payment friction across four primary failure points:
1. **Failed Gateway Payments**: Sudden technical glitches or bank declines during checkout.
2. **Abandoned Carts**: High-intent customers leaving during checkout without completing payment.
3. **Subscription Failures**: Expired cards, insufficient funds, or recurring billing authorization failures causing churn.
4. **Overdue Invoices**: Unpaid B2B invoices lingering past agreed payment terms.

Traditional recovery relies on rigid, static dunning emails that treat high-value VIP customers the exact same as high-risk churners, damaging customer relationships and resulting in low recovery conversion rates.

---

## 🔄 What It Does: The Recovery Loop

Revive replaces static dunning rules with an automated, closed-loop lifecycle:

```
[ DETECT ] ──► [ DIAGNOSE ] ──► [ DECIDE ] ──► [ ACT ] ──► [ TRACK ] ──► [ STOP ]
```

1. **Detect**: Automatically identifies payment failures, abandoned checkouts, subscription dunning cases, and overdue invoices from ingested payment streams.
2. **Diagnose**: Evaluates customer history, churn probability, payment method type, and failure severity to score customer risk (0–100).
3. **Decide**: The AI Agent reasons over the case using LLM tool-calling (or deterministic heuristics fallback) subject to a hard **Guardrails Safety Layer** (max frequency limits, discount caps, tone enforcement).
4. **Act**: Dispatches tailored, personalized recovery actions (e.g., tailored reminder emails via Nodemailer with payment retry links).
5. **Track**: Logs all executed actions into an audit log trail, monitoring conversion status and customer response.
6. **Stop**: Automatically halts dunning sequences immediately upon payment recovery or when safety threshold limits are reached.

---

## 🏗️ Architecture & System Design

Revive is engineered as a decoupled, multi-tenant architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React + Vite Frontend                           │
│  (Modern Dashboard, Recovery Queue, Case Inspection, Baseline Proof)   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │  HTTP / REST API (JWT Auth)
┌──────────────────────────────────▼─────────────────────────────────────┐
│                        Express.js Backend Server                       │
│  ┌───────────────────────────┬──────────────────────────────────────┐  │
│  │ Multi-Tenant Auth System  │ Ingestion Engine (CSV / LLM Parse)   │  │
│  ├───────────────────────────┼──────────────────────────────────────┤  │
│  │ Risk Engine (0-100 Score) │ Guardrails Safety & Constraint Layer │  │
│  ├───────────────────────────┼──────────────────────────────────────┤  │
│  │ Autonomous AI Agent       │ Rules vs AI Baseline Comparison     │  │
│  │ (LLM / Heuristic Fallback)│ Engine                               │  │
│  └───────────────────────────┴──────────────────────────────────────┘  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │  Mongoose ODM
┌──────────────────────────────────▼─────────────────────────────────────┐
│                      MongoDB Database / Atlas                          │
│  (Users, Customers, RevenueEvents, RecoveryCases, AgentAction Logs)    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 18, Tailwind CSS, Vite, Axios, Lucide React icons.
- **Backend**: Node.js, Express.js, JWT Authentication, Nodemailer.
- **Database**: MongoDB (Atlas or local instance) via Mongoose schemas.
- **AI Reasoning**: Multi-step tool-calling with OpenAI GPT-4o-mini / OpenRouter API with zero-downtime heuristic fallback when API keys are absent.
- **Guardrails System**: Enforces policy limits (maximum email retry count, maximum allowed discount %, tone safety).
- **Comparison Engine**: Real-time evaluation comparing static rule-based dunning against AI Agent recovery performance.

---

## ✨ Key Features

- **Multi-Tenant Account Isolation**: Supports both **Individual** and **Business** account types. Data belongs strictly to the authenticated tenant.
- **Flexible Data Ingestion**: Upload raw unstructured text logs or structured CSV files. Smart LLM/regex parser extracts customer details, payment amounts, failure reasons, and timestamps.
- **Interactive Onboarding Walkthrough**: Step-by-step onboarding modal guides new users through sample data uploading and system setup.
- **Real Email Dispatch**: Integrates Nodemailer for sending authentic recovery emails with dynamic payment links directly to customer inboxes.
- **Razorpay Integration Support**: Real Razorpay Test-Mode integration setup for payment link verification and gateway checkout callbacks.
- **Rules vs. Agent Baseline Proof**: Live comparative metrics demonstrating win-rate lift, recovered revenue boost, and customer friction reduction when using AI over traditional static rules.
- **Instant Demo Mode**: Pre-seeded dataset featuring 70 realistic customers and 160 revenue events across all failure types for instant offline evaluation.

---

## 🛠️ Tech Stack

### Backend (`server/`)
- **Node.js** (v18+) & **Express.js** (v4.19)
- **MongoDB** & **Mongoose** (v8.4)
- **jsonwebtoken** (v9.0) & **bcryptjs** (v2.4)
- **nodemailer** (v6.9)
- **openai** (v4.47)
- **razorpay** (v2.9)
- **dotenv** & **cors**

### Frontend (`client/`)
- **React** (v18.3)
- **Vite** (v5.2)
- **Tailwind CSS** (v3.4) & **PostCSS** / **Autoprefixer**
- **Axios** (v1.7)
- **Lucide React** icons

---

## 🚀 Setup & Local Installation

Follow these exact steps to run Revive locally on your machine:

### Prerequisites
- Node.js (v18.0 or higher)
- npm (v9.0 or higher)
- MongoDB running locally (`mongodb://127.0.0.1:27017`) OR a free MongoDB Atlas connection string.

### 1. Clone the Repository
```bash
git clone https://github.com/nayanrk261/Revive.git
cd Revive
```

### 2. Install Dependencies
Install dependencies for both `server` and `client`:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

*(Or run `npm run install:all` from the repository root)*

### 3. Environment Configuration

Copy `.env.example` to `.env` in the `server/` directory:

```bash
cd ../server
cp .env.example .env
```

Configure your environment variables in `server/.env`:
```env
PORT=5005
MONGODB_URI=mongodb://127.0.0.1:27017/revive
JWT_SECRET=super_secret_jwt_key_revive_2026

# Optional LLM integration (falls back to heuristic engine if omitted)
OPENAI_API_KEY=your_openai_api_key

# Optional Real Email settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

*(Optionally copy `client/.env.example` to `client/.env` if customizing the API base URL).*

### 4. Run Development Servers

Start the backend server:
```bash
cd server
npm run dev
```
*(Backend runs on `http://localhost:5005`)*

In a separate terminal, start the frontend client:
```bash
cd client
npm run dev
```
*(Frontend runs on `http://localhost:5173` or `http://localhost:3000`)*

---

## 🎮 Demo Mode for Judges & Evaluators

Judges can explore Revive without signing up:
1. Open the app on your browser (`http://localhost:5173`).
2. On the login screen, click **"Enter Demo Mode"**.
3. Revive will instantly grant access to a pre-seeded tenant dataset containing **70 synthetic customers** and **160 revenue events** across all 4 payment failure categories.
4. You can explore the Executive Dashboard, trigger real-time AI Agent reasoning on cases, run baseline comparisons, or click **"Re-Seed Data"** at any time to reset state.

---

## 🚧 Roadmap & Current Implementation Limits

To provide full transparency for competition evaluation, here is what is currently working vs. future scope:

### ✅ Currently Built & Operational
- CSV and Raw Unstructured Text data ingestion via parser & LLM extraction.
- Automated dunning case creation, risk calculation, and guardrail enforcement.
- AI Agent decision loop (OpenAI LLM + rule-based heuristic fallback).
- Real email dispatching via SMTP/Nodemailer.
- Razorpay test-mode configuration integration.
- Live Rules vs. Agent performance baseline comparison engine.
- Instant database re-seeding and multi-tenant user authentication.

### 🔮 Not Built Yet / Future Scope
- **OCR Ledger Ingestion**: Optical Character Recognition for scanning physical handwritten billing ledgers.
- **Omnichannel Delivery**: Direct WhatsApp Business API and SMS gateway integrations (Email is currently the live messaging channel).
- **Automated Daily Sync**: Direct cron job synchronization with external third-party ERPs like Tally or QuickBooks.

---

## 🖼️ Application Screenshots

<!-- screenshot: login -->
*Login & Signup Screen with Demo Mode entry point*

<!-- screenshot: onboarding modal -->
*Interactive Onboarding Walkthrough & Data Ingestion Modal*

<!-- screenshot: dashboard -->
*Executive Dashboard with Revenue Loss metrics and Failure Type breakdown*

<!-- screenshot: recovery queue -->
*Recovery Case Queue sorted by Risk Score and Recovery Potential*

<!-- screenshot: case detail -->
*Deep-dive Case View with AI Agent Reasoning, Guardrails Check, and Audit Log*

<!-- screenshot: baseline proof -->
*Rules vs. AI Agent Baseline Performance Comparison Engine*

---

## 👥 Team & Contact

Built for **Razorpay AI Buildathon 2026** by:
- **Project Lead / Developer**: Revive Team
- **Track**: Track 03 — AI Revenue Recovery
- **Repository**: [GitHub — nayanrk261/Revive](https://github.com/nayanrk261/Revive)
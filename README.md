# Revive — Autonomous AI Revenue Recovery Agent

> **Revive** is an autonomous AI revenue recovery agent that diagnoses payment failures, subscription churn, abandoned checkout carts, and overdue invoices, executing risk-aware dunning actions across Email, Telegram, and Razorpay payment links to reclaim lost revenue without customer friction.

---

## 🏆 Built For

**Razorpay AI Buildathon 2026** — *Track 03: AI Revenue Recovery*

---

## 🚨 The Problem

Modern businesses lose up to 15–20% of top-line revenue due to payment friction and uncollected revenue across four primary failure categories:

1. **Gateway Payment Failures**: Sudden bank declines, technical timeouts, or authentication errors during online checkout.
2. **Abandoned Checkout Carts**: High-intent shoppers dropping off at checkout before completing payment.
3. **Subscription Renewal Failures**: Expired credit cards, insufficient funds, or recurring authorization failures causing passive customer churn.
4. **Overdue B2B Invoices**: Unpaid invoices lingering past agreed credit terms without proactive follow-up.

Traditional recovery relies on rigid, static dunning emails that send identical generic reminders to high-value VIP accounts and high-risk churners alike—damaging customer relationships, increasing friction, and yielding low recovery rates.

---

## 🔄 What It Does: The 6-Stage Recovery Loop

Revive replaces static dunning schedules with an intelligent, closed-loop recovery lifecycle across all 4 event types:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  DETECT  │ ──►│ DIAGNOSE │ ──►│  DECIDE  │ ──►│   ACT    │ ──►│  TRACK   │ ──►│   STOP   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

1. **DETECT**: Ingests incoming payment streams, webhooks, or uploaded logs to identify payment failures across Gateway Failures, Abandoned Carts, Subscription Failures, and Overdue Invoices.
2. **DIAGNOSE**: Analyzes customer history, payment method, lifetime value (LTV), and failure severity to calculate a comprehensive **Customer Risk Score (0–100)**.
3. **DECIDE**: The Autonomous AI Agent (using Groq / OpenAI LLM tool-calling with a fallback heuristic engine) formulates a personalized recovery strategy governed by strict **Safety Guardrails** (retry caps, discount limits, tone safety).
4. **ACT**: Executes real, personalized recovery actions—dispatching emails with Razorpay test-mode payment links via Nodemailer, or sending real-time Telegram notification alerts.
5. **TRACK**: Logs all executed actions into an audit trail and tracks real-time customer response, payment retry attempts, and status transitions.
6. **STOP**: Automatically halts the recovery sequence immediately when payment is recovered or when safety threshold limits (max retries) are reached.

---

## 🏗️ System Architecture

Revive is engineered as a multi-tenant, decoupled full-stack platform:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          React 18 + Vite Client                         │
│   (Dashboard, Recovery Queue, Case Inspection, Baseline Performance)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │  REST API (JWT Auth)
┌────────────────────────────────────▼────────────────────────────────────┐
│                         Express.js Backend Server                       │
│  ┌─────────────────────────────┬─────────────────────────────────────┐  │
│  │ Multi-Tenant Auth (JWT)     │ Data Ingestion Engine (CSV / LLM)   │  │
│  ├─────────────────────────────┼─────────────────────────────────────┤  │
│  │ Risk Engine (0-100 Score)   │ Guardrails Safety & Constraint Layer│  │
│  ├─────────────────────────────┼─────────────────────────────────────┤  │
│  │ Autonomous AI Agent Engine  │ Rules vs. AI Baseline Comparison    │  │
│  │ (Groq/OpenAI LLM + Fallback)│ Engine                              │  │
│  └─────────────────────────────┴─────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │  Mongoose ODM
┌────────────────────────────────────▼────────────────────────────────────┐
│                       MongoDB Database / Atlas                          │
│   (Users, Customers, RevenueEvents, RecoveryCases, AgentActions)        │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 18, Vite, Tailwind CSS, Axios, Lucide React icons.
- **Backend API**: Node.js, Express.js, JWT authentication, Nodemailer, Razorpay SDK.
- **Database**: MongoDB (Local or Atlas) with fallback to in-memory `MongoMemoryServer`.
- **AI Agent Core**: Multi-step tool-calling agent using Groq / OpenAI with a deterministic fallback engine when API keys are absent.
- **Risk Engine**: Multi-factor scoring model assessing customer risk and recovery probability.
- **Guardrails Safety Engine**: Enforces policy constraints including maximum retry attempts, discount percentage limits, and message tone safety.
- **Comparison Engine**: Real-time evaluation comparing static rule-based dunning vs. Revive AI recovery performance.

---

## ✨ Key Features

- **Multi-Tenant Authentication & Isolation**: Full JWT-based auth supporting **Individual** and **Business** accounts with complete tenant data isolation.
- **Flexible Data Ingestion**: Upload structured CSV files or paste raw unstructured payment failure text logs. The smart LLM/Regex parser extracts customer names, emails, amounts, failure reasons, and timestamps.
- **Interactive Onboarding Walkthrough**: Step-by-step onboarding guide helping new users upload sample data, configure recovery guardrails, and run initial recovery tests.
- **Real Multi-Channel Execution**:
  - **Real Email Dispatch**: Sends authentic recovery emails via Nodemailer complete with dynamic Razorpay payment retry links.
  - **Real Telegram Dispatch**: Sends instant payment reminder alerts directly to specified Telegram chats via Telegram Bot API.
  - **Real Razorpay Integration**: Test-mode Razorpay API integration for generating payment links and handling payment callbacks.
- **Rules vs. Agent Baseline Proof**: Live metrics comparing static rule-based dunning against AI Agent performance, displaying win-rate lift, recovered revenue boost, and customer friction reduction.
- **Pre-Seeded Demo Mode**: Instant offline evaluation mode populated with 70 synthetic customers and 160 revenue events across all 4 failure categories, with a one-click database re-seed capability.

---

## 🛠️ Tech Stack

### Backend (`server/`)
From `server/package.json`:
- **Node.js** & **Express.js** (`^4.19.2`) — Core REST API framework
- **MongoDB** & **Mongoose** (`^8.4.1`) — Database ODM
- **mongodb-memory-server** (`^9.2.0`) — In-memory database fallback for easy setup
- **jsonwebtoken** (`^9.0.2`) & **bcryptjs** (`^2.4.3`) — JWT authentication & password hashing
- **nodemailer** (`^6.9.13`) — Real email dispatching
- **openai** (`^4.47.1`) — LLM integration (Groq / OpenAI API support)
- **razorpay** (`^2.9.3`) — Official Razorpay Node SDK
- **dotenv** (`^16.4.5`) & **cors** (`^2.8.5`) — Environment & CORS middleware

### Frontend (`client/`)
From `client/package.json`:
- **React** (`^18.3.1`) & **React DOM** (`^18.3.1`) — UI framework
- **Vite** (`^5.2.11`) — Next-generation frontend tooling
- **Tailwind CSS** (`^3.4.3`), **PostCSS** (`^8.4.38`), **Autoprefixer** (`^10.4.19`) — Utility-first styling
- **Axios** (`^1.7.2`) — HTTP client

---

## 🚀 Setup & Local Installation

Follow these steps to run Revive locally:

### Prerequisites
- Node.js (v18.0 or higher)
- npm (v9.0 or higher)
- MongoDB running locally (`mongodb://127.0.0.1:27017`) OR a free MongoDB Atlas connection string *(Note: `MongoMemoryServer` will automatically spin up if local MongoDB is unavailable)*.

### 1. Clone the Repository
```bash
git clone https://github.com/nayanrk261/Revive.git
cd Revive
```

### 2. Install Dependencies
Install dependencies for both `server` and `client` folders:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

*(Or run `npm run install:all` from the root directory).*

### 3. Environment Setup
Copy `server/.env.example` to `server/.env`:

```bash
cd ../server
cp .env.example .env
```

Edit `server/.env` with your environment variables:
```env
PORT=5005
MONGO_URI=mongodb://127.0.0.1:27017/revive
JWT_SECRET=your_jwt_secret_key_here

# Optional: Groq / OpenAI API Keys
GROQ_API_KEY=gsk_your_groq_api_key
OPENAI_API_KEY=sk-your_openai_api_key

# Optional: Razorpay Test Credentials
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Optional: Real Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Revive AI Revenue Recovery" <your_email@gmail.com>

# Optional: Real Telegram Settings
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

CLIENT_URL=http://localhost:5173
```

### 4. Run Development Servers
Start the Express backend server:
```bash
cd server
npm run dev
```
*(Backend server runs on `http://localhost:5005`)*

In a second terminal, start the React client:
```bash
cd client
npm run dev
```
*(Frontend application runs on `http://localhost:5173`)*

---

## 🎮 Demo Mode for Evaluators & Judges

You can test Revive instantly without creating an account or setting up API keys:

1. Open the application in your browser (`http://localhost:5173`).
2. On the authentication page, click **"Enter Demo Mode"**.
3. You will immediately enter a pre-seeded tenant workspace containing **70 synthetic customers** and **160 revenue events** across all 4 payment failure types.
4. Explore the Executive Dashboard, trigger real-time AI Agent reasoning on cases, review guardrail checks, compare rules vs. AI baseline metrics, or click **"Re-Seed Data"** at any time to reset the dataset state.

---

## 🚧 Current Implementation Scope ("What's Not Built Yet")

To ensure complete transparency for Buildathon evaluation, here is what is currently operational vs. future scope:

### ✅ Built & Fully Operational
- Multi-tenant JWT authentication & role-based dashboard access.
- Structured CSV & raw unstructured text log ingestion via smart parser.
- Automated dunning case creation, 0–100 risk score calculation, and guardrail enforcement.
- Autonomous AI Agent reasoning loop (Groq / OpenAI LLM tool calling with heuristic fallback).
- **Real Email execution** via Nodemailer with dynamic Razorpay payment links.
- **Real Telegram execution** via Telegram Bot API notifications.
- **Real Razorpay integration** for payment link creation and payment status callbacks.
- Real-time Rules vs. AI Agent Baseline Performance Comparison Engine.
- Instant pre-seeded Demo Mode with one-click database re-seeding.

### 🔮 Not Built Yet / Future Scope
- **OCR Ledger Ingestion**: Optical Character Recognition for scanning physical handwritten billing ledgers or paper invoices (currently supports CSV and text log uploads).
- **Real WhatsApp & SMS Delivery**: Native WhatsApp Business API and SMS carrier gateway integrations (currently live real delivery is active for Email and Telegram).
- **Automated Daily Sync**: Automatic cron-based background synchronization with third-party ERP accounting software like Tally or QuickBooks (currently manual file upload and log ingestion are supported).

---

## 🖼️ Application Screenshots

<!-- screenshot: login -->
*Login & Authentication Screen with instant Demo Mode entry point*

<!-- screenshot: onboarding modal -->
*Interactive Onboarding Walkthrough & Data Ingestion Modal*

<!-- screenshot: dashboard -->
*Executive Dashboard with Revenue Loss Breakdown by Failure Type*

<!-- screenshot: recovery queue -->
*Recovery Case Queue sorted by Risk Score and Recovery Potential*

<!-- screenshot: case detail -->
*Deep-Dive Case View featuring AI Agent Reasoning, Guardrails Check, and Audit Log*

<!-- screenshot: baseline proof -->
*Rules vs. AI Agent Baseline Performance Comparison Engine*

---

## 👥 Team & Contact

Built for **Razorpay AI Buildathon 2026**:
- **Project**: Revive — Autonomous AI Revenue Recovery Agent
- **Track**: Track 03 — AI Revenue Recovery
- **Repository**: [GitHub — nayanrk261/Revive](https://github.com/nayanrk261/Revive)
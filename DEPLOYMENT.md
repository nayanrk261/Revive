# Revive — Production Deployment Guide

This guide provides step-by-step instructions for deploying **Revive — AI Revenue Recovery Agent** to free-tier cloud infrastructure using **MongoDB Atlas**, **Render** (Backend), and **Vercel** (Frontend).

---

## 🍃 1. Database Setup: MongoDB Atlas

1. **Create Account & Cluster**:
   - Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a free-tier cluster (M0 Shared).

2. **Database Access**:
   - Go to **Security** -> **Database Access**.
   - Add a new database user (e.g. `revive_admin`) with password authentication and `Read and write to any database` privileges.

3. **Network Access**:
   - Go to **Security** -> **Network Access**.
   - Click **Add IP Address** -> Select **Allow Access from Anywhere** (`0.0.0.0/0`) to allow connections from your deployed backend on Render.

4. **Get Connection String**:
   - Go to **Database** -> Click **Connect** on your cluster -> Choose **Drivers** (Node.js).
   - Copy the connection string (format: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/revive?retryWrites=true&w=majority`).
   - Save this for `MONGODB_URI`.

---

## ⚙️ 2. Backend Deployment: Render

1. **Create Web Service**:
   - Log in to [Render Dashboard](https://dashboard.render.com/).
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository (`Revive`).

2. **Service Configuration**:
   - **Name**: `revive-api` (or custom name)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Environment Variables**:
   Under **Environment**, add the following key-value pairs:
   ```env
   PORT=5005
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/revive
   JWT_SECRET=your_long_random_jwt_secret_string
   OPENAI_API_KEY=your_openai_or_openrouter_api_key
   RAZORPAY_KEY_ID=your_razorpay_test_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_gmail_app_password
   CLIENT_URL=http://localhost:5173  # (Update to your Vercel URL after Step 3)
   ```

4. **Deploy Service**:
   - Click **Create Web Service**.
   - Wait for build and deployment to finish.
   - Test health check endpoint in browser: `https://your-render-app.onrender.com/api/health`. Expected response:
     ```json
     { "status": "ok", "service": "Revive - AI Revenue Recovery Agent" }
     ```

---

## ⚡ 3. Frontend Deployment: Vercel

1. **Import Project**:
   - Log in to [Vercel](https://vercel.com/).
   - Click **Add New...** -> **Project**.
   - Import your GitHub repository (`Revive`).

2. **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `client`.

3. **Environment Variables**:
   Add the environment variable for Vite:
   ```env
   VITE_API_BASE_URL=https://your-render-app.onrender.com/api
   ```

4. **Deploy**:
   - Click **Deploy**.
   - Vercel will build and host your frontend application (e.g. `https://revive-recovery.vercel.app`).

---

## 🔄 4. Post-Deployment CORS & Cross-Domain Configuration

1. **Update Backend CORS Origin**:
   - Return to your **Render Dashboard** -> **Environment Variables**.
   - Set `CLIENT_URL` to your live Vercel URL (e.g., `https://revive-recovery.vercel.app`).
   - Save changes to trigger a automatic redeploy of the Render backend.

2. **Final Live Verification**:
   - Open your deployed Vercel frontend URL.
   - Test **Signup / Login**, **Onboarding Ingestion**, **Demo Mode**, and **Agent Reasoning** to confirm live full-stack communication.

# 🐳 Dokploy (Self-Hosted VPS) Deployment Guide

This guide details how to host your **Dr. Paul AI Chatbot** on your own dedicated VPS using **Dokploy** (the open-source Heroku/Vercel alternative running on Docker). 

Deploying via Dokploy gives you 100% control over your data, free SSL certificates, and zero platform-hosting fees!

---

## 📋 Prerequisites
1. **Dokploy** installed and running on your VPS.
2. Your codebase pushed to a Git repository (**GitHub**, **GitLab**, or a custom Git server).
3. Your **Gemini API Key** and **Google Sheets Webhook URL** ready.

---

## 🛠️ Step 1: Create a Project & Application in Dokploy

1. Open your **Dokploy Dashboard** (e.g., `https://dokploy.yourvps.com`).
2. Go to **Projects** in the left sidebar $\rightarrow$ Click **Create Project**.
3. Name your project (e.g., `drpaul-clinic`).
4. Click into the project and click **Create Service** $\rightarrow$ select **Application**.
5. Name your application (e.g., `ai-chatbot`).

---

## 🔌 Step 2: Configure Git Repository Source

1. In the application settings, select your Git provider (**GitHub** or custom **Git**).
2. Connect your Git account or enter the repository SSH/HTTPS URL.
3. Select your repository (e.g., `username/drpaulaichatbot`).
4. Set the branch to monitor (e.g., `main` or `master`).
5. **Enable Auto-Deploy**: If checked, Dokploy will automatically rebuild and redeploy the chatbot every time you push code to GitHub!

---

## ⚙️ Step 3: Configure Build Settings

Dokploy provides two excellent ways to build Next.js applications: **Nixpacks** (zero-config, automatic) and **Docker**.

### Option A: Nixpacks (Recommended - Easiest)
Nixpacks is the default builder in Dokploy. It automatically detects Next.js, installs Node.js, installs your dependencies, and compiles the production bundle.
*   **Build Provider**: Select **Nixpacks**.
*   **Port**: Enter `3000` (Next.js default port).

### Option B: Custom Dockerfile (Optional - Optimized)
If you prefer standard Docker builds, you can add a `Dockerfile` to the root of your project. Dokploy will automatically detect it and build it.
*   *If you wish to go this route, see the **Advanced Dockerfile** section at the bottom of this guide.*

---

## 🔑 Step 4: Configure Environment Variables

Next.js needs the API key and Sheets webhook to run.
1. In your application dashboard, click the **Environment** tab.
2. Add the following variables:
   *   `GEMINI_API_KEY` $\rightarrow$ `YOUR_ACTUAL_GOOGLE_GEMINI_KEY`
   *   `GOOGLE_SHEETS_WEBHOOK_URL` $\rightarrow$ `YOUR_GOOGLE_SHEETS_WEBHOOK_URL`
   *   `PORT` $\rightarrow$ `3000`
3. Click **Save**.

---

## 🌐 Step 5: Configure Domain & Let's Encrypt SSL

Dokploy comes with Traefik pre-installed, allowing you to add domains and generate SSL certificates automatically.
1. Go to the **Domains** tab in the application settings.
2. Click **Add Domain**.
3. Enter your custom domain or subdomain (e.g., `chat.drpaulsonline.com` or `chatbot.yourdomain.com`).
   *   *Make sure your domain's DNS settings point an `A` record (or `CNAME`) to your VPS IP address.*
4. Select **HTTPS/SSL** (Let's Encrypt).
5. Click **Save**. Dokploy will automatically generate a free Let's Encrypt SSL certificate and auto-renew it forever!

---

## 🚀 Step 6: Deploy and Verify

1. Go back to the **Deployments** (or **Overview**) tab.
2. Click **Deploy**.
3. Click the **Logs** button to view real-time compilation logs. You will see Dokploy pulling your code, compiling the Next.js pages, and launching the server on port `3000`.
4. Once deployed, visit your configured subdomain (e.g., `https://chat.drpaulsonline.com`). 
5. Test the chat and submit a lead form to verify that the patient details synchronize immediately to your Google Sheet webhook!

---

## 🐳 Advanced: Optimized Standalone Dockerfile (Optional)

If you prefer building a standard Docker container over using Nixpacks, follow these steps:

### 1. Update `next.config.ts`
Enable standalone output in [next.config.ts](file:///m:/drpaulaichatbot/next.config.ts) to shrink the final Docker image from ~1GB down to ~120MB:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

### 2. Add a `Dockerfile` to the root directory
Create a file named `Dockerfile` in the root of your project:
```dockerfile
# 1. Base Image
FROM node:18-alpine AS base

# 2. Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 4. Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.5.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set correct permission for prerender cache & leads storage
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

### 3. Change Build Provider in Dokploy
*   **Build Provider**: Set to **Dockerfile**.
*   **Path to Dockerfile**: `./Dockerfile`
*   Click **Save** and **Deploy**.

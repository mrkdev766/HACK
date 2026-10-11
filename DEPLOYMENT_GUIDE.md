# 🚀 TRAVELHOLIC / WANDERLY - Complete Deployment Guide

This guide provides step-by-step instructions to deploy **Travelholic (Wanderly)** to **Vercel** with a **Supabase PostgreSQL database** and **Google Gemini AI**.

---

## 📋 Table of Contents
1. [Prerequisites](#-prerequisites)
2. [Database Setup (Supabase)](#-database-setup-supabase)
3. [AI Configuration (Google Gemini)](#-ai-configuration-google-gemini)
4. [GitHub Repository Setup](#-github-repository-setup)
5. [Vercel Deployment Guide](#-vercel-deployment-guide)
6. [Environment Variables Reference](#-environment-variables-reference)
7. [Verification & Troubleshooting](#-verification--troubleshooting)

---

## 🛠 Prerequisites
Before starting, make sure you have accounts for:
- [GitHub](https://github.com)
- [Vercel](https://vercel.com)
- [Supabase](https://supabase.com)
- [Google AI Studio](https://aistudio.google.com) (for Gemini API Key)

---

## 🗄 Database Setup (Supabase)

### Step 1: Create a Supabase Project
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**, pick your organization, select a region, and choose a strong database password.
3. Once provisioned, navigate to **Project Settings -> API** and copy:
   - `Project URL` (e.g. `https://xxxx.supabase.co`)
   - `anon public key` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role key` (`SUPABASE_SERVICE_ROLE_KEY`)

### Step 2: Run Database Schema SQL
1. Open the **SQL Editor** in your Supabase dashboard.
2. Open the file [`supabase/schema.sql`](file:///supabase/schema.sql) in this repository.
3. Paste the contents into the SQL Editor and click **Run**.
4. *(Optional)* To seed initial demo data, run [`supabase/seed.sql`](file:///supabase/seed.sql) in the SQL Editor.

### Step 3: Configure Storage Bucket for Photo Uploads
1. Go to **Storage** in the Supabase menu.
2. Create a new bucket named `journal-photos`.
3. Toggle **Public Bucket** to **ON**.
4. Set allowed MIME types to `image/*`.

---

## 🤖 AI Configuration (Google Gemini)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Generate a new API Key (`GEMINI_API_KEY`).
3. This key enables AI-powered mystery itinerary generation, budget calculation, and alternative route suggestions.

---

## 🐙 GitHub Repository Setup

To push your repository to GitHub:

```bash
# Initialize git if not done
git init

# Add all files (secrets and build files are excluded by .gitignore)
git add .

# Create initial commit
git commit -m "feat: complete production ready Travelholic platform with Supabase & Vercel support"

# Rename branch to main
git branch -M main

# Add your GitHub remote repository
git remote add origin https://github.com/<YOUR_USERNAME>/travelholic.git

# Push code to GitHub
git push -u origin main
```

---

## 🌐 Vercel Deployment Guide

### Step 1: Import Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New... -> Project**.
3. Import your `travelholic` GitHub repository.

### Step 2: Configure Environment Variables
In the Vercel project creation screen, expand **Environment Variables** and add:

| Key | Example Value / Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` |
| `GEMINI_API_KEY` | `AIzaSy...` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app-name.vercel.app` |

*(Note: If Supabase variables are omitted, Travelholic automatically runs using its robust built-in fallback storage engine!)*

### Step 3: Deploy
1. Click **Deploy**.
2. Vercel will run `npm run build` and deploy your app globally on edge nodes.
3. Access your live website at the generated `.vercel.app` domain!

---

## 🧪 Verification & Troubleshooting

- **Check Build Health**: Run `cmd /c npm run build` locally to ensure static generation passes cleanly.
- **Demo Mode**: If Supabase API credentials are not provided, the application switches seamlessly to demo store mode so user flows remain functional.
- **Photo Uploads**: Ensure `journal-photos` storage bucket RLS permits uploads for authenticated users or public inserts.

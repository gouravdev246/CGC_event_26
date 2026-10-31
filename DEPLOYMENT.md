# Deployment Guide: Backend on Dokploy + Frontend on Vercel

This guide walks you through deploying your **Backend API on Dokploy** and your **Frontend Web App on Vercel**.

---

## Part 1: Deploy Backend on Dokploy

### Step 1: Create an Application in Dokploy
1. Log in to your **Dokploy** console.
2. Select or create your **Project**.
3. Click **Create Service** > **Application**.
4. Name the service: `knowapi-backend`.

### Step 2: Connect Repository & Build Settings
In the **General** tab:
- **Source**: Select `GitHub` (or Git repository).
- **Repository**: Choose your repository (e.g. `your-username/your-repo`).
- **Branch**: `main`.
- **Build Type**: `Dockerfile`.
- **Context Path**: `/server` (or `server`).
- **Dockerfile Path**: `Dockerfile` (or `server/Dockerfile` if context is `/`).

### Step 3: Configure Port & Volume
1. **Port**: Set to `5000`.
2. **Persistent Volume**: Go to the **Volumes** tab and add a volume to persist uploaded PDF documents across restarts:
   - **Host Path**: `/var/lib/dokploy/knowapi-uploads` (or any persistent host path)
   - **Container Path**: `/app/uploads`

### Step 4: Add Environment Variables
Go to the **Environment** tab and add the backend variables:

```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://gouravdev246:Gourav%40mongodb.com@cluster0.xfazdbn.mongodb.net/raas
PINECONE_API_KEY=pcsk_74o2JV_C4hByi3TVHR9FKmoQZgMqVSiHdAaajB7beZ7atTfnQTgpRLmaZemCwqpsPb3uPM
PINECONE_INDEX=raas
BL_API_KEY=bl_aaabmtz5juwpwuy3689esg065xr4agcg
BL_WORKSPACE=gourav246
BL_API_ENDPOINT=https://run.blaxel.ai/gourav246/models/sandbox-openai/v1/chat/completions
COHERE_API_KEY=cohere_Dpl9eKrgxk7lGztQFIXsG0BxosBq5OwmzUsNowlv1FTn9t
JWT_SECRET=TKg4o1yHxaoP3mR4Vlxto2hGcKHY7m7xNSUlXexUEf3
```

### Step 5: Configure Domain & SSL
1. Go to the **Domains** tab in Dokploy.
2. Add your backend domain (e.g., `api.yourdomain.com` or use a free Traefik/Dokploy domain like `backend-xxxx.dokploy.app`).
3. Set **Port**: `5000`.
4. Enable **HTTPS (Let's Encrypt)**.
5. Click **Deploy**.

### Step 6: Verify Backend
Once deployed, check:
`https://api.yourdomain.com/api/health`
It should return:
```json
{ "success": true, "message": "KnowAPI server is running" }
```

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Import Project in Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.

### Step 2: Configure Project Settings
In the Vercel project configuration screen:
1. **Framework Preset**: `Vite` (automatically detected).
2. **Root Directory**: Click **Edit** and select `client`.
3. **Build Command**: `npm run build` (default).
4. **Output Directory**: `dist` (default).
5. **Install Command**: `npm install` (default).

### Step 3: Add Environment Variable
Under **Environment Variables**, add:
- **Key**: `VITE_API_BASE_URL`
- **Value**: `https://api.yourdomain.com/api` *(Your live Dokploy backend URL with `/api` at the end)*

### Step 4: Deploy
Click **Deploy**.

Vercel will build the frontend and deploy it globally with automatic SSL and SPA routing configured via [`client/vercel.json`](file:///c:/Users/omgop/OneDrive/Desktop/CGC_event_26/client/vercel.json).

---

## Architecture Summary

```
+---------------------------------------+
|          User's Web Browser           |
+-------------------+-------------------+
                    |
          +---------+---------+
          |                   |
          v                   v
+-------------------+  +--------------------------------+
|  Frontend (Vercel)|  |  Backend (Dokploy)             |
|  app.domain.com   |  |  api.domain.com                |
+-------------------+  +--------------------------------+
| • React 19 + Vite |  | • Express on Port 5000         |
| • SPA Rewrites    |  | • MongoDB Atlas                |
| • Fast Global CDN |  | • Pinecone Vector DB           |
|                   |  | • Cohere 1024 Embeddings       |
|                   |  | • Blaxel / Groq LLM Inference  |
|                   |  | • Volume: /app/uploads         |
+-------------------+  +--------------------------------+
```


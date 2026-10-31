# Deploying to Dokploy

[Dokploy](https://dokploy.com) is an open-source PaaS built on Docker and Traefik. You can deploy this project to Dokploy in two ways:

1. **Option A (Recommended): Docker Compose Stack** — Deploys both frontend and backend together in a single stack with an internal network and persistent volume.
2. **Option B: Separate Applications** — Deploys backend and frontend as two independent applications with individual subdomains.

---

## Prerequisites

1. A Dokploy server instance installed on a VPS (e.g., DigitalOcean, Hetzner, AWS, Linode).
2. Your project pushed to GitHub (or GitLab / Gitea).
3. A domain or subdomain pointing to your Dokploy VPS IP address (e.g., `app.yourdomain.com` and `api.yourdomain.com`).

---

## Option A: Deploy via Dokploy Compose (Recommended)

This deploys both services together using your repository's `docker-compose.yml`.

### Step 1: Create a Compose Project in Dokploy
1. In your Dokploy dashboard, go to your **Project** and click **Create Service** > **Compose**.
2. Name your compose service (e.g., `knowapi-rag`).

### Step 2: Configure Source Repository
1. Select **Provider**: `GitHub` (or Git repository).
2. Select your repository: `your-username/your-repo`.
3. Select **Branch**: `main`.
4. Set **Compose Path**: `docker-compose.yml`.

### Step 3: Configure Environment Variables
In the **Environment** tab of the Compose service, paste your backend environment variables:

```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xfazdbn.mongodb.net/raas
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX=raas
BL_API_KEY=bl_...
BL_WORKSPACE=your_blaxel_workspace
BL_API_ENDPOINT=https://run.blaxel.ai/your_workspace/models/sandbox-openai/v1/chat/completions
COHERE_API_KEY=cohere_...
JWT_SECRET=your_jwt_secret_key
```

### Step 4: Configure Domain & Routing
1. In the **Domains** tab, add your domain (e.g., `knowapi.yourdomain.com`).
2. Point the domain to service: `frontend`, Port: `80`.
3. Enable **HTTPS (Let's Encrypt / Certificate)**.

> NGINX inside the `frontend` container automatically proxies all `/api/` and `/docs` requests to the `backend` service over the internal Docker network.

### Step 5: Deploy
Click **Deploy**. Dokploy will pull your repository, build both Docker containers, attach the volume for uploaded documents, and issue an automatic SSL certificate.

---

## Option B: Deploy as Two Separate Applications

If you prefer separate subdomains (e.g. `api.yourdomain.com` for the API and `app.yourdomain.com` for the UI):

### 1. Deploy the Backend
1. In Dokploy, click **Create Service** > **Application**.
2. Service Name: `knowapi-backend`.
3. **Build Type**: `Dockerfile`.
4. **Context Path**: `/server`.
5. **Dockerfile Path**: `Dockerfile`.
6. **Port**: `5000`.
7. **Volumes**: Add a persistent volume mount:
   - Host path: `/var/lib/dokploy/knowapi-uploads`
   - Container path: `/app/uploads`
8. **Environment Variables**: Add `PORT=5000`, `MONGO_URI`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `BL_API_KEY`, `BL_WORKSPACE`, `BL_API_ENDPOINT`, `COHERE_API_KEY`, `JWT_SECRET`.
9. **Domains**: Add `api.yourdomain.com` with HTTPS enabled.
10. Click **Deploy**.

### 2. Deploy the Frontend
1. Click **Create Service** > **Application**.
2. Service Name: `knowapi-frontend`.
3. **Build Type**: `Dockerfile`.
4. **Context Path**: `/client`.
5. **Dockerfile Path**: `Dockerfile`.
6. **Port**: `80`.
7. **Build Arguments**:
   - `VITE_API_BASE_URL`: `https://api.yourdomain.com/api`
8. **Domains**: Add `app.yourdomain.com` with HTTPS enabled.
9. Click **Deploy**.

---

## Health Check & Verification

Once deployed:
- Visit your frontend domain: `https://knowapi.yourdomain.com`
- Check backend health: `https://knowapi.yourdomain.com/api/health`
- Check API docs: `https://knowapi.yourdomain.com/docs`


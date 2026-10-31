# Docker Deployment Guide

This project contains a containerized setup for both the **Backend (Express + LangChain RAG)** and **Frontend (React + Vite + NGINX)** using Docker Compose.

---

## Architecture Overview

```
                      +-----------------------------+
                      |       Host Machine          |
                      |   Ports: 5173 / 3000 / 5000 |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
+-------------------------------+           +-------------------------------+
|    knowapi-frontend           |           |    knowapi-backend            |
|    (NGINX Alpine, Port 80)    |           |    (Node 20 Alpine, Port 5000)|
+-------------------------------+           +-------------------------------+
| • Serves React SPA            |           | • Express API                 |
| • SPA client-side routing     |           | • Pinecone Vector Store       |
| • Proxies /api/ to backend    | --------> | • Cohere Embeddings           |
| • Proxies /docs to backend    |           | • Blaxel / Groq LLM RAG       |
+-------------------------------+           +---------------+---------------+
                                                            |
                                            +---------------v---------------+
                                            | Volume: knowapi-backend-uploads
                                            | (Persists uploaded PDFs)      |
                                            +-------------------------------+
```

---

## Prerequisites

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Make sure Docker Desktop is started and running.

---

## Quick Start (Single Command)

From the project root directory, run:

```bash
docker compose up --build
```

To run in detached (background) mode:

```bash
docker compose up -d --build
```

---

## Accessing the Services

| Service | URL | Description |
|---|---|---|
| **Frontend Web App** | `http://localhost:5173` or `http://localhost:3000` | Full developer portal & dashboard |
| **Backend REST API** | `http://localhost:5000/api/health` | Healthcheck endpoint |
| **API Documentation** | `http://localhost:5173/docs` or `http://localhost:5000/docs` | Interactive API documentation |

---

## Stopping and Managing Containers

### Stop containers:
```bash
docker compose down
```

### Stop containers and remove persistent volumes:
```bash
docker compose down -v
```

### View container logs:
```bash
docker compose logs -f
```

### View backend logs only:
```bash
docker compose logs -f backend
```

---

## File Structure

```
├── docker-compose.yml        # Multi-container orchestration
├── DOCKER.md                 # Docker guide and commands
├── server/
│   ├── Dockerfile            # Node.js 20 Alpine production image
│   ├── .dockerignore         # Excludes node_modules, temp files
│   ├── .env                  # Runtime environment variables
│   └── .env.example          # Environment variables template
└── client/
    ├── Dockerfile            # Multi-stage build (Node -> Nginx Alpine)
    ├── nginx.conf            # Reverse proxy & SPA routing config
    └── .dockerignore         # Excludes node_modules, dist, temp files
```


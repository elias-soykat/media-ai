# Single VPS Production Deployment Guide

This guide details how to deploy the entire application to a single low-cost **$6–$10/month VPS** (such as Hetzner Cloud CX22, DigitalOcean Basic Droplet, or Linode 2GB) using **Docker**, **Caddy**, and **PostgreSQL**.

---

## Architecture Overview

```
                          Internet (HTTPS :443)
                                  │
                                  ▼
                   ┌───────────────────────────────┐
                   │    Caddy Reverse Proxy        │
                   │    (Automatic TLS / SSL)      │
                   └──────────────┬────────────────┘
                                  │
                     Internal Bridge Network
                                  │
                   ┌──────────────┴────────────────┐
                   │   Next.js 15 Standalone App   │
                   │   (:3000 Node.js Container)   │
                   └──────────────┬────────────────┘
                                  │
                   ┌──────────────┴────────────────┐
                   │     PostgreSQL 16 Engine      │
                   │   (Persistent Docker Volume)  │
                   └───────────────────────────────┘
```

- **In-Browser Processing:** Cropping, resizing, compression, conversion, video trimming, and timeline playback run 100% in the user's browser, consuming 0 VPS CPU/RAM.
- **Temporary Cloud Storage:** Uploaded files and AI processing artifacts are stored in Cloudflare R2 with an automatic **24-hour lifecycle expiration rule** ($0 egress fees).
- **Payment & Credits:** Paddle Merchant of Record checkout and cryptographically verified webhooks handle monetization without monthly fixed subscription costs.

---

## 1. Prerequisites

1. A virtual private server running **Ubuntu 22.04 LTS** or **Debian 12** with at least 2 GB RAM.
2. A registered domain name pointing an `A` record to the public IP of your VPS (e.g. `editor.yourdomain.com`).
3. Cloudflare R2 bucket with an S3 API token.
4. Paddle account with Merchant of Record API keys & Webhook endpoint configured.

---

## 2. Server Setup & Docker Installation

SSH into your VPS as root:

```bash
ssh root@YOUR_SERVER_IP
```

Update system packages and install Docker with Docker Compose plugin:

```bash
apt-get update && apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg git ufw

# Install Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Configure basic firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

---

## 3. Clone Repository & Setup Environment

```bash
git clone https://github.com/your-username/online-editing.git /opt/editor
cd /opt/editor
```

Create production `.env` file:

```bash
cp .env.example .env
nano .env
```

Ensure the following variables are configured:

```env
# Domain & Server
APP_DOMAIN=editor.yourdomain.com
NODE_ENV=production
SESSION_SECRET=a_random_32_character_secret_string_here

# PostgreSQL
DATABASE_URL=postgresql://app_user:app_password@postgres:5432/app_db?schema=public

# Cloudflare R2 Storage (24-hour temporary media)
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_PUBLIC_DOMAIN=https://media.yourdomain.com

# Paddle Merchant of Record
PADDLE_ENVIRONMENT=production
PADDLE_API_KEY=your_live_paddle_api_key
PADDLE_WEBHOOK_SECRET=your_live_padddle_webhook_secret

# AI Providers
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

---

## 4. Launch Services with Docker Compose

Build and launch the containers:

```bash
docker compose up -d --build
```

Run database migrations to initialize PostgreSQL schema:

```bash
docker compose exec app npx prisma migrate deploy
```

Caddy will automatically provision a valid Let's Encrypt TLS certificate for your domain configured in `APP_DOMAIN`.

---

## 5. Maintenance & Management

### Viewing Service Logs
```bash
# View combined logs
docker compose logs -f

# View application logs only
docker compose logs -f app

# View Caddy web server logs
docker compose logs -f caddy
```

### Updating to the Latest Version
```bash
cd /opt/editor
git pull origin main
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

### Backing Up PostgreSQL
```bash
docker compose exec -t postgres pg_dump -U app_user -d app_db > /opt/backups/backup_$(date +%F).sql
```


# KoalaClicker Website Deployment Guide

This guide explains how to host the static KoalaClicker landing website (`/website` directory) securely and efficiently.

## Prerequisites
- The website is 100% static (pure HTML, CSS, JS).
- No build step is required.
- Do **not** use inline scripts (compliant with strict Content Security Policy).

---

## Option 1: Host with Caddy (Recommended)

Caddy is the simplest, most modern way to host static websites with automatic HTTPS and excellent security headers.

1. **Install Caddy** on your server.
2. Place the [Caddyfile](./Caddyfile) in your deployment folder.
3. Run Caddy from the repository root:
   ```bash
   caddy run --config deploy/Caddyfile
   ```

### Features included in the Caddyfile:
- **Automatic HTTPS** (via Let's Encrypt).
- **Zstd & Gzip compression** for ultra-fast load times.
- **Strict Content Security Policy (CSP)** preventing XSS.
- **Clean URLs** (e.g. `/impressum` automatically resolves to `/impressum.html`).

---

## Option 2: Host with Docker & Caddy

If you prefer containerization:

1. Create a `Dockerfile` in the root:
   ```dockerfile
   FROM caddy:2-alpine
   COPY deploy/Caddyfile /etc/caddy/Caddyfile
   COPY website /srv
   ```
2. Build and run the image:
   ```bash
   docker build -t koalaclicker-site .
   docker run -d -p 80:80 -p 443:443 --name koalaclicker-site koalaclicker-site
   ```

---

## Option 3: Host with Nginx

If using Nginx, configure your site block as follows to achieve similar clean URLs and compression:

```nginx
server {
    listen 80;
    server_name clicker.koalastuff.net;
    root /var/www/koalaclicker/website;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/javascript image/svg+xml;

    # Clean URLs
    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    # Security Headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://raw.githubusercontent.com; object-src 'none'; frame-ancestors 'none';" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

# vet-project

Web application security auditing and vulnerability assessment toolkit.

## Overview

vet-project automates the discovery, classification, and reporting of security vulnerabilities in web applications. Combines passive reconnaissance with active scanning for comprehensive coverage.

## Features

- **Automated Recon** — Subdomain enumeration, endpoint discovery, tech stack fingerprinting
- **Vulnerability Scanning** — OWASP Top 10 coverage, misconfiguration detection
- **SSL/TLS Audit** — Certificate validation, cipher strength, protocol support
- **Security Headers Check** — CSP, HSTS, CORS, cookie security analysis
- **Report Generation** — HTML/PDF/JSON export with prioritized findings

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Engine | Python / FastAPI |
| Scanning | Nmap, Nuclei, custom modules |
| Database | PostgreSQL |
| Reports | WeasyPrint, Jinja2 |
| Deployment | Docker Compose |

## Quick Start

```bash
git clone https://github.com/ayushdixit1-av/vet-project.git
cd vet-project
docker compose up -d
```

Open http://localhost:8000

## License

MIT


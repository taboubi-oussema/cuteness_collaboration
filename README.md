# Cuteness Collaboration

Cuteness MLM & E-Commerce Management System.

## Architecture

- **cuteness-backend**: Spring Boot 4 REST API (Java 17, Spring Data JPA, Spring Security, JWT, MySQL).
- **cuteness_collaboration**: Angular 21 with Ionic & Capacitor frontend application.

## Prerequisites

- Java 17 (OpenJDK 17)
- Node.js 20+ and npm 11+
- MySQL Server (Port 3306, Database: `cuteness_db`)

## Getting Started

### Database Setup
Create the `cuteness_db` database (the tables are created automatically on first start with
`JPA_DDL_AUTO=update`). Database dumps contain real user data and are no longer stored in the repository.

### Backend Setup (`cuteness-backend`)
```bash
cd cuteness-backend
./mvnw clean spring-boot:run
```
The API starts on port `8081`.

### Frontend Setup (`cuteness_collaboration`)
```bash
cd cuteness_collaboration
npm install
npm start
```
The frontend runs on `http://localhost:4200/`.

## Security & configuration

Secrets are **never** stored in the repository. The backend reads them from environment variables
(or from a local, git-ignored `.env` file).

1. Copy `.env.example` to `.env` (in the repo root or in `cuteness-backend/`) and fill in real values.
2. Required: `JWT_SECRET` (random, 32+ chars: `openssl rand -base64 48`), `MAIL_USERNAME`, `MAIL_PASSWORD`
   (Gmail app password), `GEMINI_API_KEY`, `NAVEX_TOKEN_ETAT`.
3. To create the first admin, set `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` (12+ chars) once, start the
   app, then remove the password from your environment.
4. In production set: `CORS_ALLOWED_ORIGINS` (your real site URL), `CORS_DEV_ORIGINS=false`,
   `JPA_DDL_AUTO=validate`, `FRONTEND_URL`, and `TRUST_PROXY_HEADERS=true` only if the API is behind your own
   reverse proxy. Use a dedicated MySQL user (not `root`) and serve everything over HTTPS.

Never commit database dumps, `.env` files or uploaded user documents.

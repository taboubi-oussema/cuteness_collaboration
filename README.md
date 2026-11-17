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
Import the initial schema:
```bash
mysql -u root -p cuteness_db < "cuteness_db (3).sql"
```

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

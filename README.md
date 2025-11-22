# 🎯 Siftly - AI-Powered Resume Screening Platform

> Intelligent resume screening and candidate matching powered by advanced AI models

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 Overview

Siftly is a comprehensive AI-powered recruitment platform that automates resume screening and candidate matching. It leverages state-of-the-art language models to parse resumes, extract key information, and match candidates with job requirements intelligently.

### ✨ Key Features

- 🤖 **AI-Powered Matching** - Multiple LLM providers (Gemini, Groq, HuggingFace) with intelligent fallback
- 📄 **Smart Resume Parsing** - Automatic extraction of skills, experience, education, and more
- 🎯 **Intelligent Scoring** - Weighted matching based on skills, experience, and requirements
- 🔄 **Async Processing** - Background workers for scalable resume processing
- 💾 **Cloud Storage** - Cloudinary integration for secure resume storage
- 🔐 **Secure Authentication** - JWT-based auth with refresh tokens
- 📊 **Real-time Updates** - Redis-powered job queues for instant feedback
- 🐳 **Docker Ready** - Fully containerized for easy deployment
- 🎨 **Modern UI** - Beautiful, responsive React frontend with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  React + Vite + Tailwind CSS
│   (Nginx)       │  Port: 80
└────────┬────────┘
         │
┌────────▼────────┐
│   Backend API   │  Node.js + Express + TypeScript
│   + Workers     │  Port: 3000
│   (PM2)         │  - API Server
└────────┬────────┤  - Matching Worker
         │        │  - Parsing Worker
         │        └────────┬─────────┐
         │                 │         │
┌────────▼────────┐  ┌────▼─────┐  ┌▼──────────┐
│  AI Service     │  │ Postgres │  │   Redis   │
│  (FastAPI)      │  │ Database │  │   Queue   │
│  Port: 8000     │  │          │  │           │
└─────────────────┘  └──────────┘  └───────────┘
```

### Technology Stack

#### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - HTTP client

#### Backend
- **Node.js 20** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL 15** - Database
- **Redis 7** - Queue & caching
- **PM2** - Process manager
- **Bull** - Job queue
- **Winston** - Logging

#### AI Service
- **Python 3.11** - Runtime
- **FastAPI** - Web framework
- **Google Gemini** - Primary LLM
- **Groq** - Fallback LLM
- **HuggingFace** - Fallback LLM
- **Uvicorn** - ASGI server

#### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Nginx** - Frontend server & reverse proxy

## 🚀 Quick Start

### Prerequisites

- Docker 24+ and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/siftly.git
cd siftly
```

### 2. Configure Environment

```bash
# Copy environment template
cp ENV_TEMPLATE.md .env

# Edit with your values
nano .env
```

**Minimum Required Variables:**
```bash
POSTGRES_PASSWORD=your_password
JWT_SECRET=your_64_char_secret
ACCESS_TOKEN_SECRET=your_64_char_secret
REFRESH_TOKEN_SECRET=your_64_char_secret
GOOGLE_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_ORIGIN=http://localhost
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Development Environment

```bash
# Start all services
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Check status
docker compose -f docker-compose.dev.yml ps
```

### 4. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **AI Service**: http://localhost:8000
- **API Docs**: http://localhost:3000/api/docs

### 5. Production Deployment

```bash
# Build production images
docker compose build

# Start production services
docker compose up -d

# Check health
curl http://localhost:3000/api/health
curl http://localhost:8000/health
curl http://localhost/health
```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Comprehensive deployment instructions
- [Environment Variables](ENV_TEMPLATE.md) - Configuration reference
- [API Documentation](http://localhost:3000/api/docs) - OpenAPI/Swagger docs

## 🎯 Usage

### 1. Register & Login

```bash
# Register new user
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

### 2. Create Job Posting

```bash
POST /api/jobs
{
  "title": "Senior Software Engineer",
  "description": "We are looking for...",
  "requirements": "5+ years experience...",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": 5,
  "location": "Remote",
  "education": "Bachelor's Degree"
}
```

### 3. Upload Resumes

```bash
POST /api/resumes/upload
Content-Type: multipart/form-data

files: [resume1.pdf, resume2.pdf, ...]
```

### 4. Run Matching

```bash
POST /api/matching/run
{
  "jobId": "job-uuid",
  "resumeIds": ["resume-uuid-1", "resume-uuid-2"],
  "weights": {
    "skills": 0.4,
    "experience": 0.3,
    "education": 0.2,
    "overall": 0.1
  }
}
```

### 5. View Results

```bash
GET /api/matching/job/{jobId}/results?page=1&limit=10
```

## 🔧 Development

### Local Setup (Without Docker)

#### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

#### AI Service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# AI service tests
cd ai-service
pytest
```

## 🐳 Docker Commands

```bash
# Development
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml logs -f [service]

# Production
docker compose up -d
docker compose down
docker compose logs -f [service]
docker compose ps
docker compose restart [service]

# Rebuild specific service
docker compose build [service]
docker compose up -d --no-deps [service]

# Database operations
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma studio

# Access containers
docker compose exec backend sh
docker compose exec ai-service bash
```

## 📊 Monitoring

### Health Checks

```bash
# Backend
curl http://localhost:3000/api/health

# AI Service  
curl http://localhost:8000/health

# Frontend
curl http://localhost/health
```

### PM2 Dashboard (Backend Container)

```bash
docker exec siftly_backend pm2 monit
docker exec siftly_backend pm2 status
docker exec siftly_backend pm2 logs
```

### Container Stats

```bash
docker stats
docker compose ps
```

## 🔒 Security

- JWT authentication with access & refresh tokens
- Secure HTTP-only cookies
- Rate limiting on all endpoints
- CORS configuration
- Helmet security headers
- Environment variable validation
- SQL injection prevention (Prisma ORM)
- XSS protection

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powerful language models
- Groq for fast inference
- HuggingFace for open-source models
- Cloudinary for media management
- All open-source contributors

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/siftly/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/siftly/discussions)
- **Email**: support@siftly.io

---

Made with ❤️ by the Siftly Team

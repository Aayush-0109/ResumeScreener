## MVP Remaining Tasks (Backend + AI Service)

**Current Status**: Async batch processing ✅, Validation hardening ✅, Environment validation ✅

### Backend (Node) - PENDING

- [ ] **Export endpoints (streamed)**
  - GET /match/:jobId/exports?format=csv|json
  - Stream large datasets without memory buffering
  - Proper headers and backpressure handling

- [ ] **Production logging & monitoring**
  - Structured logging with Winston
  - Request/response logging with correlation IDs
  - Enhanced health checks with dependency validation
  - Error tracking and metrics collection

- [ ] **Graceful shutdown handling**
  - SIGTERM handlers for API server
  - Worker job completion before shutdown
  - Connection cleanup and resource disposal

### AI Service (FastAPI) - PENDING

- [ ] **LLM resilience finalization**
  - Complete provider fallback metadata
  - Deterministic mode (temperature=0) option
  - Processing metadata in responses (provider, timing, truncation)

- [ ] **Input pipeline safeguards**
  - Stricter MIME/size validation
  - Clear error messages for corrupt/password PDFs
  - Document limitations when text extraction fails

### Production Readiness - PENDING

- [ ] **Performance optimization**
  - Database query optimization
  - Connection pooling configuration
  - Response caching improvements

- [ ] **Docker production builds**
  - Multi-stage builds for smaller images
  - Production environment configuration
  - Health check endpoints in containers

- [ ] **End-to-end testing**
  - Complete user flow validation
  - Load testing with realistic data volumes
  - Error recovery testing

### Acceptance Criteria

- [ ] **Exports**: 10k+ matches stream successfully without timeout/memory issues
- [ ] **Logging**: All requests tracked with correlation IDs, structured logs
- [ ] **Shutdown**: Services stop gracefully, workers complete current jobs
- [ ] **LLM**: Provider failures don't break flow, metadata returned
- [ ] **Performance**: Response times <500ms p95, stable memory usage
- [ ] **Reliability**: <1% error rate, auto-recovery from failures

### Out of Scope (Post-MVP)

- Advanced search functionality
- Score history tracking
- Multiple user roles
- Webhooks for match completion
- Skill expertise levels
- Cultural fit scoring
- Idempotency keys
- CI/CD pipeline
- Advanced monitoring (Prometheus/Grafana)



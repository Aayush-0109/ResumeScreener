## MVP Remaining Tasks (Backend + AI Service)

Scope: Excludes advanced search and health checks/monitoring/performance tests. Single role only, no score history, cache already applied.

### Backend (Node)
- [ ] Implement async batch processing with a queue
  - Enqueue large match jobs; poll status; cancel job
  - Endpoints: POST enqueue, GET status, DELETE cancel
  - Worker consumes jobs and persists latest results

- [ ] Export endpoints (streamed)
  - JSON/CSV export for matched results (no in-memory buffering)
  - Optional PDF summary for top-N

- [ ] Optional webhooks for match completion
  - Register/list/remove webhook with HMAC secret
  - Deliver events with retries and signature header

- [ ] Validation hardening
  - Strict zod schemas for weights (0–1), topN limits, IDs
  - File size limits, mime validation already enforced through upload layer
  - Consistent error shape with correlation ID

- [ ] Idempotency and retries
  - Idempotency key header on match requests to prevent duplicate work
  - Safe replays in queue/worker

### AI Service (FastAPI)
- [ ] Skill expertise levels and confidence
  - Extend parse to label skills: beginner/intermediate/advanced/expert
  - Return confidence per skill and normalize aliases

- [ ] Additional lightweight scores (behind flags)
  - Cultural fit: heuristic/LLM-based tone/keywords
  - Bias risk: detect sensitive signals and return a risk note
  - Predictive success (rule-of-thumb): combine matched skills, exp gap, edu
  - Configurable via request flags; defaults off

- [ ] LLM resilience and cost control
  - Configurable provider order (gemini → groq → hf → regex)
  - Retries with backoff, input truncation for long resumes
  - Return metadata: provider used, truncation, timing

- [ ] Determinism options
  - Temperature=0 path for consistent scores
  - Include prompt/version metadata in responses

- [ ] Input pipeline safeguards
  - Stricter MIME/size caps; clear errors for corrupt/password PDFs
  - Document OCR fallback limitations (if text extraction fails)

### Minimal Data Model Adjustments (no history)
- [ ] Persist latest match results per job (optional)
  - Columns/JSON field for scores (skills/experience/education/technical/cultural/bias/predictive)
  - Store weights, provider, and brief insight text

- [ ] Webhooks (optional)
  - Table for webhook endpoints and secrets

### APIs and Contracts
- [ ] Extend match request options
  - flags: { includeCultural, includeBias, includePredictive }
  - weights validation/normalization; topN cap

- [ ] Exports API
  - POST /exports/matches → streamed CSV/JSON

- [ ] Webhooks management (if enabled)
  - CRUD endpoints for webhook registration

### DevOps (limited scope)
- [ ] Environment validation on startup
  - Fail fast when required API keys/vars are missing

- [ ] CI/CD basics
  - Lint, typecheck, and unit/integration tests for critical paths
  - Tagged builds produce images and run DB migrations

### Acceptance Hints
- Async batch: 500+ resumes processed without request timeout; status transitions observable.
- Exports: Large responses stream successfully; memory stays bounded.
- Flags and weights: Requests with invalid values are rejected; normalized weights sum to 1.
- LLM fallback: Provider failures don’t break flow; response includes provider metadata.
- Determinism: Temperature=0 runs yield consistent outputs for identical inputs.



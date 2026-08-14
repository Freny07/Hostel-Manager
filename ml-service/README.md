# Hostel-Manager ML Microservice

Standalone Python FastAPI microservice providing machine learning foundation and semantic embeddings for Hostel-Manager.

## Architecture & Model Specifications

- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn ASGI Server
- **Embedding Model**: `all-MiniLM-L6-v2` (Sentence-Transformers)
- **Vector Dimensions**: 384 dense floating-point values
- **Normalization**: L2-normalized vectors (`normalize_embeddings=True`) for direct cosine similarity via dot product

## Directory Structure

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application & lifespan entrypoint
│   ├── config.py        # Settings & environment configuration
│   ├── api/
│   │   ├── __init__.py
│   │   ├── health.py    # Health check endpoints (/health)
│   │   └── embeddings.py# Vector embedding endpoints (/api/v1/embeddings)
│   └── core/
│       ├── __init__.py
│       └── embeddings.py# SentenceTransformer model manager
├── .env.example         # Template configuration file
├── requirements.txt     # Service dependencies
└── README.md            # Service documentation
```

## API Endpoints

### 1. Health Check Endpoint
- **URL**: `GET /health` or `GET /api/v1/health`
- **Response**:
```json
{
  "status": "healthy",
  "service": "hostel-ml-service",
  "version": "0.1.0",
  "environment": "development"
}
```

### 2. Generate Semantic Vector Embedding Endpoint
- **URL**: `POST /api/v1/embeddings` or `POST /embeddings`
- **Request Body**:
```json
{
  "title": "Water leakage in washroom",
  "text": "The pipe under the washbasin in Room 302 is broken and leaking water constantly.",
  "normalize": true
}
```
- **Response**:
```json
{
  "embedding": [0.0124, -0.0456, 0.0891, ...],
  "dimension": 384,
  "model": "all-MiniLM-L6-v2",
  "text_length": 105
}
```

### 3. Input Validation Errors
If `text` is empty or whitespace-only, the service responds with `HTTP 400 Bad Request`:
```json
{
  "detail": "Issue text cannot be empty or whitespace-only."
}
```

## Getting Started

### 1. Install Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Run Service Locally

```bash
uvicorn app.main:app --reload --port 8000
```

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.health import router as health_router
from app.api.embeddings import router as embeddings_router
from app.core.embeddings import get_embedding_manager

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager for startup & shutdown events.
    Pre-loads the SentenceTransformer model once on startup to optimize per-request latency.
    """
    print(f"Starting {settings.SERVICE_NAME} v{settings.VERSION} [{settings.ENV}]...")
    try:
        manager = get_embedding_manager()
        manager.load_model()
    except Exception as e:
        print(f"Warning: Failed to pre-load embedding model during startup: {e}")
    yield
    print(f"Shutting down {settings.SERVICE_NAME}...")


app = FastAPI(
    title="Hostel-Manager ML Microservice",
    description="Dedicated Machine Learning microservice for semantic similarity and issue intelligence.",
    version=settings.VERSION,
    lifespan=lifespan,
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health_router)
app.include_router(embeddings_router)


@app.get("/")
async def root():
    """Root endpoint describing service status and documentation endpoints."""
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": "/health",
        "embeddings_endpoint": "/api/v1/embeddings",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=(settings.ENV == "development"),
    )

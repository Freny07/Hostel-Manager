from fastapi import APIRouter
from pydantic import BaseModel
from app.config import get_settings

router = APIRouter(tags=["Health"])


class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str


@router.get("/health", response_model=HealthCheckResponse)
@router.get("/api/v1/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Health Check Endpoint
    Returns system status, service name, and version info.
    """
    settings = get_settings()
    return HealthCheckResponse(
        status="healthy",
        service=settings.SERVICE_NAME,
        version=settings.VERSION,
        environment=settings.ENV,
    )

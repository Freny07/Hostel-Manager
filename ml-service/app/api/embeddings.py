from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.core.embeddings import get_embedding_manager, EMBEDDING_DIMENSION, MODEL_NAME

router = APIRouter(tags=["Embeddings"])


class EmbeddingRequest(BaseModel):
    text: str = Field(
        ...,
        description="The maintenance issue description text to embed.",
        min_length=1,
        max_length=5000,
        examples=["The ceiling fan in Room 204 is sparking and making a loud buzzing noise."],
    )
    title: Optional[str] = Field(
        None,
        description="Optional issue title to prepend for extra context.",
        max_length=200,
        examples=["Sparking ceiling fan"],
    )
    normalize: bool = Field(
        True,
        description="Whether to L2-normalize the vector for cosine similarity.",
    )


class EmbeddingResponse(BaseModel):
    embedding: List[float] = Field(
        ...,
        description="The dense 384-dimensional vector embedding values.",
    )
    dimension: int = Field(EMBEDDING_DIMENSION, description="Vector dimension size.")
    model: str = Field(MODEL_NAME, description="Sentence Transformer model name.")
    text_length: int = Field(..., description="Total character length of encoded text.")


@router.post("/embeddings", response_model=EmbeddingResponse, status_code=status.HTTP_200_OK)
@router.post("/api/v1/embeddings", response_model=EmbeddingResponse, status_code=status.HTTP_200_OK)
async def create_embedding(request: EmbeddingRequest):
    """
    Generate Semantic Vector Embedding

    Accepts maintenance issue text (and optional title), validates non-empty text,
    and produces a normalized 384-dimensional vector embedding using SentenceTransformers.
    """
    cleaned_text = request.text.strip()
    if not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Issue text cannot be empty or whitespace-only.",
        )

    manager = get_embedding_manager()

    try:
        result = manager.generate_embedding(
            text=cleaned_text,
            title=request.title,
            normalize=request.normalize,
        )
        return EmbeddingResponse(**result)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except RuntimeError as run_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(run_err),
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred generating embedding: {str(err)}",
        )

import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# Default Sentence Transformer Model: 384 dimensions, lightweight & fast CPU inference
MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384


class EmbeddingManager:
    """
    Singleton manager for loading the SentenceTransformer model once on application startup
    and generating normalized vector embeddings for issue descriptions.
    """
    _instance: Optional["EmbeddingManager"] = None

    def __init__(self, model_name: str = MODEL_NAME):
        self.model_name = model_name
        self.model = None
        self._is_loaded = False

    @classmethod
    def get_instance(cls) -> "EmbeddingManager":
        if cls._instance is None:
            cls._instance = EmbeddingManager()
        return cls._instance

    def load_model(self):
        """Loads the SentenceTransformer model into memory if not already loaded."""
        if self._is_loaded and self.model is not None:
            return

        logger.info(f"Loading SentenceTransformer model '{self.model_name}'...")
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(self.model_name)
            self._is_loaded = True
            logger.info(f"Model '{self.model_name}' successfully loaded into memory.")
        except Exception as e:
            logger.error(f"Failed to load SentenceTransformer model '{self.model_name}': {e}")
            self.model = None
            self._is_loaded = False

    def is_ready(self) -> bool:
        """Returns True if the embedding model is loaded and ready."""
        return self._is_loaded and self.model is not None

    def generate_embedding(
        self, text: str, title: Optional[str] = None, normalize: bool = True
    ) -> dict:
        """
        Generates a normalized 384-dimensional vector embedding for the input text.

        :param text: Issue description text.
        :param title: Optional issue title to prepend for context.
        :param normalize: Whether to L2-normalize the vector (enables cosine similarity via dot product).
        :return: Dict containing embedding vector list, dimension, and model metadata.
        """
        cleaned_text = text.strip() if text else ""
        if not cleaned_text:
            raise ValueError("Issue text cannot be empty or whitespace-only.")

        combined_text = f"{title.strip()}. {cleaned_text}" if title and title.strip() else cleaned_text

        if not self.is_ready():
            self.load_model()

        if self.model is None:
            raise RuntimeError(
                f"Embedding model '{self.model_name}' is not available or failed to initialize."
            )

        # Generate embedding vector
        vector = self.model.encode(combined_text, normalize_embeddings=normalize)

        # Convert numpy array to Python list of floats
        vector_list: List[float] = vector.tolist() if hasattr(vector, "tolist") else [float(v) for v in vector]

        return {
            "embedding": vector_list,
            "dimension": len(vector_list),
            "model": self.model_name,
            "text_length": len(combined_text),
        }


# Export singleton getter
get_embedding_manager = EmbeddingManager.get_instance

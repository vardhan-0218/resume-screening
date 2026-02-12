import os
import pickle
import uuid
import logging
import numpy as np
from typing import List, Dict, Any, Optional
from pathlib import Path

# Try to import faiss, fallback to None if not available
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    faiss = None
    FAISS_AVAILABLE = False

logger = logging.getLogger(__name__)

class VectorService:
    """Simplified vector service using FAISS with basic embeddings."""
    
    def __init__(self):
        self.index_path = os.getenv("FAISS_INDEX_PATH", "./vector_db/")
        
        # FAISS index and metadata
        self.index = None
        self.metadata = {}
        self.faiss_available = FAISS_AVAILABLE
        
        if not self.faiss_available:
            logger.warning("⚠️ FAISS not available - vector operations will be disabled")
        self.dimension = 384  # Default dimension
        
        # Ensure directory exists
        Path(self.index_path).mkdir(parents=True, exist_ok=True)
        
        # Load existing index if available
        self._load_index()
    
    def _load_index(self):
        """Load existing FAISS index and metadata."""
        if not self.faiss_available:
            logger.info("📁 FAISS not available - using fallback mode")
            self.metadata = {}
            return
            
        try:
            index_file = os.path.join(self.index_path, "faiss.index")
            metadata_file = os.path.join(self.index_path, "metadata.pkl")
            
            if os.path.exists(index_file) and os.path.exists(metadata_file):
                # Check file sizes to ensure they're not corrupted
                if os.path.getsize(index_file) > 0 and os.path.getsize(metadata_file) > 0:
                    self.index = faiss.read_index(index_file)
                    with open(metadata_file, 'rb') as f:
                        self.metadata = pickle.load(f)
                    logger.info(f"✅ Loaded existing index with {len(self.metadata)} items")
                else:
                    logger.warning("⚠️ Index files are empty, creating new index")
                    self._create_new_index()
            else:
                logger.info("📁 No existing index found, creating new one")
                self._create_new_index()
        except Exception as e:
            logger.warning(f"❌ Failed to load existing index: {e}")
            logger.info("🔄 Creating new index")
            self._create_new_index()
    
    def _create_new_index(self):
        """Create a new FAISS index."""
        if not self.faiss_available:
            self.metadata = {}
            logger.info("✅ Created fallback index (no FAISS)")
            return
            
        try:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = {}
            logger.info("✅ Created new FAISS index")
        except Exception as e:
            logger.error(f"❌ Failed to create FAISS index: {e}")
            # Create a minimal fallback index
            self.index = None
            self.metadata = {}
    
    def _save_index(self):
        """Save FAISS index and metadata to disk."""
        try:
            index_file = os.path.join(self.index_path, "faiss.index")
            metadata_file = os.path.join(self.index_path, "metadata.pkl")
            
            if self.index is not None:
                faiss.write_index(self.index, index_file)
            with open(metadata_file, 'wb') as f:
                pickle.dump(self.metadata, f)
            logger.info("Saved index and metadata")
        except Exception as e:
            logger.error(f"Failed to save index: {e}")
    
    def _create_simple_embedding(self, text: str) -> np.ndarray:
        """Create a simple embedding using basic text features."""
        # Simple hash-based embedding for demonstration
        # In production, use proper embeddings from OpenAI or other service
        words = text.lower().split()
        embedding = np.zeros(self.dimension, dtype=np.float32)
        
        for i, word in enumerate(words[:self.dimension]):
            # Create a simple hash-based embedding
            hash_val = hash(word) % 1000
            embedding[i % self.dimension] = hash_val / 1000.0
        
        # Normalize the embedding
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        
        return embedding
    
    async def store_resume_embedding(self, embeddings: List[float], text: str, filename: str) -> str:
        """Store resume embedding in vector database."""
        try:
            resume_id = str(uuid.uuid4())
            
            if not self.faiss_available:
                # Fallback: just store metadata without vector operations
                self.metadata[resume_id] = {
                    'filename': filename,
                    'text': text,
                    'embedding': embeddings[:384] if len(embeddings) > 384 else embeddings
                }
                logger.info(f"✅ Stored resume {filename} in fallback mode")
                return resume_id
            
            # Convert embeddings to numpy array
            embedding_array = np.array(embeddings, dtype=np.float32)
            if len(embeddings) != self.dimension:
                # If embeddings don't match expected dimension, create simple embedding
                embedding_array = self._create_simple_embedding(text)
            
            # Add to FAISS index
            if self.index is None:
                self._create_new_index()
            self.index.add(embedding_array.reshape(1, -1))
            
            # Store metadata
            self.metadata[resume_id] = {
                'filename': filename,
                'text': text,
                'embedding': embedding_array.tolist()
            }
            
            # Save to disk
            self._save_index()
            
            logger.info(f"Stored resume embedding for {filename}")
            return resume_id
            
        except Exception as e:
            logger.error(f"Failed to store resume embedding: {e}")
            raise
    
    async def calculate_similarity(self, resume_id: str, job_description: str) -> float:
        """Calculate similarity between resume and job description."""
        try:
            if resume_id not in self.metadata:
                logger.warning(f"Resume {resume_id} not found in metadata")
                return 0.0
            
            if not self.faiss_available:
                # Fallback: simple text-based similarity
                resume_text = self.metadata[resume_id]['text'].lower()
                job_text = job_description.lower()
                
                # Simple keyword overlap calculation
                resume_words = set(resume_text.split())
                job_words = set(job_text.split())
                overlap = len(resume_words.intersection(job_words))
                total = len(resume_words.union(job_words))
                
                return overlap / total if total > 0 else 0.0
            
            # Create embedding for job description
            job_embedding = self._create_simple_embedding(job_description)
            
            # Get resume embedding
            resume_embedding = np.array(self.metadata[resume_id]['embedding'], dtype=np.float32)
            
            # Calculate cosine similarity
            similarity = np.dot(resume_embedding, job_embedding) / (
                np.linalg.norm(resume_embedding) * np.linalg.norm(job_embedding)
            )
            
            # Convert to proper decimal (0-1)
            similarity_score = float(similarity * 0.5 + 0.5)  # Scale to 0-1 range
            similarity_score = max(0.0, min(1.0, similarity_score))  # Clamp to 0-1
            
            logger.info(f"Calculated similarity: {similarity_score:.4f} ({similarity_score*100:.2f}%)")
            return similarity_score
            
        except Exception as e:
            logger.error(f"Failed to calculate similarity: {e}")
            return 0.0
    
    async def search_similar_resumes(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar resumes based on query."""
        try:
            # Create embedding for query
            query_embedding = self._create_simple_embedding(query)
            
            # Search in FAISS index
            if self.index is None:
                return []
            distances, indices = self.index.search(query_embedding.reshape(1, -1), top_k)
            
            results = []
            for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
                if idx < len(self.metadata):
                    # Get resume ID by index
                    resume_id = list(self.metadata.keys())[idx]
                    result = {
                        'resume_id': resume_id,
                        'filename': self.metadata[resume_id]['filename'],
                        'similarity_score': float(1 / (1 + distance)),  # Convert distance to similarity
                        'distance': float(distance)
                    }
                    results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to search similar resumes: {e}")
            return []
    
    async def remove_resume_embedding(self, resume_id: str) -> bool:
        """Remove resume embedding from vector database."""
        try:
            if resume_id not in self.metadata:
                logger.warning(f"Resume {resume_id} not found")
                return False
            
            # Remove from metadata
            del self.metadata[resume_id]
            
            # Rebuild index (FAISS doesn't support individual removal)
            self._rebuild_index()
            
            logger.info(f"Removed resume embedding for {resume_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove resume embedding: {e}")
            return False
    
    def _rebuild_index(self):
        """Rebuild the FAISS index from metadata."""
        try:
            self._create_new_index()
            
            for resume_id, data in self.metadata.items():
                embedding = np.array(data['embedding'], dtype=np.float32)
                if self.index is not None:
                    self.index.add(embedding.reshape(1, -1))
            
            self._save_index()
            logger.info("Rebuilt FAISS index")
            
        except Exception as e:
            logger.error(f"Failed to rebuild index: {e}")
    
    async def get_index_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector database."""
        try:
            return {
                'total_resumes': len(self.metadata),
                'index_dimension': self.dimension,
                'index_type': type(self.index).__name__,
                'index_path': self.index_path
            }
        except Exception as e:
            logger.error(f"Failed to get index stats: {e}")
            return {}

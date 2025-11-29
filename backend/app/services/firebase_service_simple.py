import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from ..models.resume_models import ResumeAnalysis, JobDescription, ScoringResult, BatchAnalysis

logger = logging.getLogger(__name__)

class FirebaseService:
    """Simplified Firebase service using local file storage as fallback."""
    
    def __init__(self):
        self.storage_path = os.getenv("STORAGE_PATH", "./data/")
        self.use_firebase = False
        
        # Ensure storage directory exists
        Path(self.storage_path).mkdir(parents=True, exist_ok=True)
        
        # Try to initialize Firebase if credentials are available
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase if credentials are available."""
        try:
            # Check if Firebase credentials are available
            if (os.getenv("FIREBASE_PROJECT_ID") and 
                os.getenv("FIREBASE_PRIVATE_KEY") and 
                os.getenv("FIREBASE_CLIENT_EMAIL")):
                
                import firebase_admin
                from firebase_admin import credentials, firestore
                
                # Initialize Firebase
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", ""),
                    "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
                    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                    "client_id": os.getenv("FIREBASE_CLIENT_ID", ""),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                })
                
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.use_firebase = True
                logger.info("Initialized Firebase service")
            else:
                logger.info("Firebase credentials not found, using local storage")
                self.use_firebase = False
                
        except Exception as e:
            logger.warning(f"Failed to initialize Firebase: {e}, using local storage")
            self.use_firebase = False
    
    async def store_resume_analysis(self, analysis: ResumeAnalysis) -> str:
        """Store resume analysis in Firebase or local storage."""
        try:
            if self.use_firebase:
                return await self._store_in_firebase("resumes", analysis.id, analysis.dict())
            else:
                return await self._store_locally("resumes", analysis.id, analysis.dict())
        except Exception as e:
            logger.error(f"Failed to store resume analysis: {e}")
            # Fallback to local storage
            return await self._store_locally("resumes", analysis.id, analysis.dict())
    
    async def get_resume_analysis(self, resume_id: str) -> Optional[ResumeAnalysis]:
        """Get resume analysis by ID."""
        try:
            if self.use_firebase:
                data = await self._get_from_firebase("resumes", resume_id)
            else:
                data = await self._get_locally("resumes", resume_id)
            
            if data:
                return ResumeAnalysis(**data)
            return None
        except Exception as e:
            logger.error(f"Failed to get resume analysis: {e}")
            return None
    
    async def get_all_resume_analyses(self) -> List[ResumeAnalysis]:
        """Get all resume analyses."""
        try:
            if self.use_firebase:
                docs = await self._get_all_from_firebase("resumes")
            else:
                docs = await self._get_all_locally("resumes")
            
            return [ResumeAnalysis(**doc) for doc in docs]
        except Exception as e:
            logger.error(f"Failed to get all resume analyses: {e}")
            return []
    
    async def get_all_resume_ids(self) -> List[str]:
        """Get all resume IDs."""
        try:
            if self.use_firebase:
                return await self._get_all_ids_from_firebase("resumes")
            else:
                return await self._get_all_ids_locally("resumes")
        except Exception as e:
            logger.error(f"Failed to get all resume IDs: {e}")
            return []
    
    async def delete_resume_analysis(self, resume_id: str) -> bool:
        """Delete resume analysis by ID."""
        try:
            if self.use_firebase:
                return await self._delete_from_firebase("resumes", resume_id)
            else:
                return await self._delete_locally("resumes", resume_id)
        except Exception as e:
            logger.error(f"Failed to delete resume analysis: {e}")
            return False
    
    async def store_batch_analysis(self, job_description: JobDescription, results: List[ScoringResult]) -> str:
        """Store batch analysis results."""
        try:
            batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            batch_data = {
                "id": batch_id,
                "job_description": job_description.dict(),
                "results": [result.dict() for result in results],
                "timestamp": datetime.now().isoformat(),
                "total_resumes": len(results)
            }
            
            if self.use_firebase:
                return await self._store_in_firebase("batch_analyses", batch_id, batch_data)
            else:
                return await self._store_locally("batch_analyses", batch_id, batch_data)
        except Exception as e:
            logger.error(f"Failed to store batch analysis: {e}")
            return batch_id
    
    # Firebase methods
    async def _store_in_firebase(self, collection: str, doc_id: str, data: Dict) -> str:
        """Store data in Firebase."""
        doc_ref = self.db.collection(collection).document(doc_id)
        doc_ref.set(data)
        return doc_id
    
    async def _get_from_firebase(self, collection: str, doc_id: str) -> Optional[Dict]:
        """Get data from Firebase."""
        doc_ref = self.db.collection(collection).document(doc_id)
        doc = doc_ref.get()
        return doc.to_dict() if doc.exists else None
    
    async def _get_all_from_firebase(self, collection: str) -> List[Dict]:
        """Get all documents from Firebase collection."""
        docs = self.db.collection(collection).stream()
        return [doc.to_dict() for doc in docs]
    
    async def _get_all_ids_from_firebase(self, collection: str) -> List[str]:
        """Get all document IDs from Firebase collection."""
        docs = self.db.collection(collection).stream()
        return [doc.id for doc in docs]
    
    async def _delete_from_firebase(self, collection: str, doc_id: str) -> bool:
        """Delete document from Firebase."""
        doc_ref = self.db.collection(collection).document(doc_id)
        doc_ref.delete()
        return True
    
    # Local storage methods
    async def _store_locally(self, collection: str, doc_id: str, data: Dict) -> str:
        """Store data locally."""
        collection_path = Path(self.storage_path) / collection
        collection_path.mkdir(exist_ok=True)
        
        file_path = collection_path / f"{doc_id}.json"
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        return doc_id
    
    async def _get_locally(self, collection: str, doc_id: str) -> Optional[Dict]:
        """Get data from local storage."""
        file_path = Path(self.storage_path) / collection / f"{doc_id}.json"
        
        if file_path.exists():
            with open(file_path, 'r') as f:
                return json.load(f)
        return None
    
    async def _get_all_locally(self, collection: str) -> List[Dict]:
        """Get all documents from local storage."""
        collection_path = Path(self.storage_path) / collection
        documents = []
        
        if collection_path.exists():
            for file_path in collection_path.glob("*.json"):
                with open(file_path, 'r') as f:
                    documents.append(json.load(f))
        
        return documents
    
    async def _get_all_ids_locally(self, collection: str) -> List[str]:
        """Get all document IDs from local storage."""
        collection_path = Path(self.storage_path) / collection
        ids = []
        
        if collection_path.exists():
            for file_path in collection_path.glob("*.json"):
                ids.append(file_path.stem)
        
        return ids
    
    async def _delete_locally(self, collection: str, doc_id: str) -> bool:
        """Delete document from local storage."""
        file_path = Path(self.storage_path) / collection / f"{doc_id}.json"
        
        if file_path.exists():
            file_path.unlink()
            return True
        return False

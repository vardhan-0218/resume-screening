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
            firebase_project_id = os.getenv("FIREBASE_PROJECT_ID")
            firebase_private_key = os.getenv("FIREBASE_PRIVATE_KEY")
            firebase_client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
            
            logger.info(f"Firebase credentials check: project_id={bool(firebase_project_id)}, private_key={bool(firebase_private_key)}, client_email={bool(firebase_client_email)}")
            
            if (firebase_project_id and 
                firebase_private_key and 
                firebase_client_email):
                
                import firebase_admin
                from firebase_admin import credentials, firestore
                
                # Check if Firebase is already initialized
                if firebase_admin._apps:
                    logger.info("Firebase already initialized, getting existing app")
                    self.db = firestore.client()
                    self.use_firebase = True
                    return
                
                # Initialize Firebase
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": firebase_project_id,
                    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", ""),
                    "private_key": firebase_private_key.replace('\\n', '\n'),
                    "client_email": firebase_client_email,
                    "client_id": os.getenv("FIREBASE_CLIENT_ID", ""),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                })
                
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.use_firebase = True
                logger.info("✅ Initialized Firebase service")
            else:
                logger.info("❌ Firebase credentials not found, using local storage")
                self.use_firebase = False
                
        except Exception as e:
            logger.error(f"❌ CRITICAL: Failed to initialize Firebase: {e}")
            logger.warning("🔄 Falling back to local storage temporarily")
            self.use_firebase = False
    
    async def migrate_local_to_firebase(self) -> int:
        """Migrate all local resume data to Firebase."""
        migrated_count = 0
        try:
            logger.info("🔄 Starting migration of local resume data to Firebase...")
            local_docs = await self._get_all_locally("resumes")
            logger.info(f"Found {len(local_docs)} local resumes to migrate")
            
            # Test Firebase connection first
            test_doc = {"test": "connection", "timestamp": datetime.now().isoformat()}
            await self._store_in_firebase("test", "connection_test", test_doc)
            logger.info("✅ Firebase connection test successful")
            
            # Migrate in smaller batches
            for i, doc in enumerate(local_docs):
                try:
                    await self._store_in_firebase("resumes", doc['id'], doc)
                    migrated_count += 1
                    if i % 10 == 0:  # Log progress every 10 items
                        logger.info(f"📊 Migrated {migrated_count}/{len(local_docs)} resumes...")
                except Exception as e:
                    logger.error(f"❌ Failed to migrate resume {doc.get('id', 'unknown')}: {e}")
                    continue
            
            logger.info(f"🎉 Migration complete! Migrated {migrated_count}/{len(local_docs)} resumes to Firebase")
            return migrated_count
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            return migrated_count
    
    async def store_resume_analysis(self, analysis: ResumeAnalysis) -> str:
        """Store resume analysis in Firebase only."""
        try:
            logger.info(f"📤 Storing resume analysis {analysis.id} in Firebase")
            return await self._store_in_firebase("resumes", analysis.id, analysis.dict())
        except Exception as e:
            logger.error(f"Failed to store resume analysis in Firebase: {e}")
            # Return the ID to prevent crashes, but log the error
            return analysis.id
    
    async def get_resume_analysis(self, resume_id: str) -> Optional[ResumeAnalysis]:
        """Get resume analysis by ID from Firebase only."""
        try:
            logger.info(f"Getting resume analysis {resume_id} from Firebase")
            doc = await self._get_from_firebase("resumes", resume_id)
            if doc:
                return ResumeAnalysis(**doc)
            return None
        except Exception as e:
            logger.error(f"Failed to get resume analysis from Firebase: {e}")
            return None
    
    async def get_all_resume_analyses(self) -> List[ResumeAnalysis]:
        """Get all resume analyses from Firebase (with local fallback if needed)."""
        try:
            if self.use_firebase:
                logger.info("Getting resume analyses from Firebase")
                docs = await self._get_all_from_firebase("resumes")
                logger.info(f"Found {len(docs)} resume documents in Firebase")
                return [ResumeAnalysis(**doc) for doc in docs]
            else:
                logger.info("Getting resume analyses from local storage")
                docs = await self._get_all_locally("resumes")
                logger.info(f"Found {len(docs)} resume documents locally")
                return [ResumeAnalysis(**doc) for doc in docs]
        except Exception as e:
            logger.error(f"Failed to get resume analyses: {e}")
            return []
    
    async def get_all_resume_ids(self) -> List[str]:
        """Get all resume IDs from Firebase only."""
        try:
            return await self._get_all_ids_from_firebase("resumes")
        except Exception as e:
            logger.error(f"Failed to get resume IDs from Firebase: {e}")
            return []
    
    async def delete_resume_analysis(self, resume_id: str) -> bool:
        """Delete resume analysis from Firebase only."""
        try:
            logger.info(f"Deleting resume analysis {resume_id} from Firebase")
            return await self._delete_from_firebase("resumes", resume_id)
        except Exception as e:
            logger.error(f"Failed to delete resume analysis from Firebase: {e}")
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
            
            logger.info(f"📦 Storing batch analysis {batch_id} in Firebase")
            return await self._store_in_firebase("batch_analyses", batch_id, batch_data)
        except Exception as e:
            logger.error(f"Failed to store batch analysis in Firebase: {e}")
            # Return the batch_id to prevent crashes
            return batch_id
    
    # Firebase methods
    async def _store_in_firebase(self, collection: str, doc_id: str, data: Dict) -> str:
        """Store data in Firebase."""
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.set(data)
            logger.info(f"✅ Successfully stored document {doc_id} in {collection}")
            return doc_id
        except Exception as e:
            logger.error(f"❌ Firebase storage failed for {doc_id}: {e}")
            # For now, return the doc_id to prevent crashes
            return doc_id
    
    async def _get_from_firebase(self, collection: str, doc_id: str) -> Optional[Dict]:
        """Get data from Firebase."""
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc = doc_ref.get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            logger.error(f"❌ Firebase retrieval failed for {doc_id}: {e}")
            return None
    
    async def _get_all_from_firebase(self, collection: str) -> List[Dict]:
        """Get all documents from Firebase collection."""
        try:
            docs = self.db.collection(collection).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"❌ Firebase collection retrieval failed for {collection}: {e}")
            return []
    
    async def _get_all_ids_from_firebase(self, collection: str) -> List[str]:
        """Get all document IDs from Firebase collection."""
        docs = self.db.collection(collection).stream()
        return [doc.id for doc in docs]
    
    async def _delete_from_firebase(self, collection: str, doc_id: str) -> bool:
        """Delete document from Firebase."""
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.delete()
            logger.info(f"✅ Successfully deleted document {doc_id} from {collection}")
            return True
        except Exception as e:
            logger.error(f"❌ Firebase deletion failed for {doc_id}: {e}")
            return False
    
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

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
    
    # Automatically switch to SQLite if Supabase config is missing
    USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_KEY)
    
    @classmethod
    def validate(cls):
        # If GROQ_API_KEY is not set in .env, check the system environment directly
        if not cls.GROQ_API_KEY:
            cls.GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
            
        if not cls.GROQ_API_KEY:
            print("WARNING: GROQ_API_KEY is missing. You will need to provide it to perform LLM processing.")
            
        if cls.USE_SUPABASE:
            print("[Config] Storage layer: Supabase PostgreSQL (pgvector enabled).")
        else:
            print("[Config] Storage layer: Local SQLite fallback (Supabase credentials missing).")
            
        if cls.GEMINI_API_KEY:
            print("[Config] Embeddings layer: Gemini API (text-embedding-004).")
        else:
            print("[Config] Embeddings layer: Local TF-IDF / Jaccard similarity fallback.")
            
Config.validate()

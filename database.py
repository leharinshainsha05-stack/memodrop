import sqlite3
import json
import uuid
from datetime import datetime
import numpy as np
from config import Config

# Supabase Client Setup (conditional)
supabase_client = None
if Config.USE_SUPABASE:
    try:
        from supabase import create_client
        supabase_client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
    except Exception as e:
        print(f"[Database] Failed to initialize Supabase client: {e}. Falling back to SQLite.")
        Config.USE_SUPABASE = False

# SQLite database file path
SQLITE_DB_PATH = "memories.db"

def init_db():
    """Initializes the database (SQLite table creation & migrations if local mode)."""
    if Config.USE_SUPABASE:
        print("[Database] Using Supabase cloud database.")
        seed_mock_data()
        
    print(f"[Database] Initializing local SQLite database at {SQLITE_DB_PATH}...")
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        summary TEXT,
        intent TEXT NOT NULL,
        category TEXT,
        entities TEXT,                 -- JSON stringified dict
        tags TEXT,                     -- JSON stringified list of strings
        urgency TEXT DEFAULT 'none',   -- 'none', 'low', 'medium', 'high'
        is_business_related INTEGER DEFAULT 0, -- 0 (false) or 1 (true)
        language TEXT DEFAULT 'en',
        user_phone TEXT DEFAULT 'anonymous',
        due_date TEXT,
        reminder_status TEXT DEFAULT 'pending',
        document_folder TEXT,
        embedding TEXT,                -- JSON stringified list of floats (vector)
        created_at TEXT NOT NULL
    )
    """)
    conn.commit()
    
    # Run migrations for existing databases that were created before these columns were added
    cursor.execute("PRAGMA table_info(memories)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if "urgency" not in columns:
        print("[Database] Migration: Adding 'urgency' column to local SQLite.")
        cursor.execute("ALTER TABLE memories ADD COLUMN urgency TEXT DEFAULT 'none'")
        conn.commit()
        
    if "is_business_related" not in columns:
        print("[Database] Migration: Adding 'is_business_related' column to local SQLite.")
        cursor.execute("ALTER TABLE memories ADD COLUMN is_business_related INTEGER DEFAULT 0")
        conn.commit()
        
    if "language" not in columns:
        print("[Database] Migration: Adding 'language' column to local SQLite.")
        cursor.execute("ALTER TABLE memories ADD COLUMN language TEXT DEFAULT 'en'")
        conn.commit()
        
    if "user_phone" not in columns:
        print("[Database] Migration: Adding 'user_phone' column to local SQLite.")
        cursor.execute("ALTER TABLE memories ADD COLUMN user_phone TEXT DEFAULT 'anonymous'")
        conn.commit()
        
    if "due_date" not in columns:
        print("[Database] Migration: Adding 'due_date' column to local SQLite.")
        cursor.execute("ALTER TABLE memories ADD COLUMN due_date TEXT")
        conn.commit()
        
    if "reminder_status" not in columns:
        print("[Database] Migration: Adding 'reminder_status' column to local SQLite.")
        cursor.execute("ALTER TABLE memories ADD COLUMN reminder_status TEXT DEFAULT 'pending'")
        conn.commit()
        
    if "document_folder" not in columns:
        print("[Database] Migration: Adding 'document_folder' column to local SQLite.")
        cursor.execute("ALTER TABLE memories ADD COLUMN document_folder TEXT")
        conn.commit()
        
    conn.close()
    print("[Database] SQLite database initialized and migrated successfully.")
    seed_mock_data()

def seed_mock_data():
    """Seeds the database with standard mock data if empty."""
    mock_id_1 = "11111111-1111-1111-1111-111111111111"
    
    if Config.USE_SUPABASE:
        try:
            res = supabase_client.table("memories").select("id").eq("id", mock_id_1).execute()
            if not res.data:
                memories = [
                    {
                        "id": mock_id_1,
                        "content": "Check out this silk saree link for my daughter's wedding: https://www.myntra.com/saree/designer-silk-saree-10934",
                        "summary": "Designer silk saree for daughter's wedding",
                        "intent": "dump",
                        "category": "shopping_link",
                        "entities": {"prices": [], "urls": ["https://www.myntra.com/saree/designer-silk-saree-10934"], "phone_numbers": []},
                        "tags": ["saree", "wedding", "shopping"],
                        "urgency": "none",
                        "is_business_related": False,
                        "created_at": "2026-07-02T11:40:00Z"
                    },
                    {
                        "id": "22222222-2222-2222-2222-222222222222",
                        "content": "Fabric Supplier offered cotton roll at Rs 120 per meter. Contact: 9876543210. Valid till next month.",
                        "summary": "Cotton roll quote at Rs 120/meter",
                        "intent": "dump",
                        "category": "business_supplier_quote",
                        "entities": {"prices": ["Rs 120"], "urls": [], "phone_numbers": ["9876543210"]},
                        "tags": ["fabric", "cotton", "quote"],
                        "urgency": "medium",
                        "is_business_related": True,
                        "created_at": "2026-07-02T11:42:00Z"
                    },
                    {
                        "id": "33333333-3333-3333-3333-333333333333",
                        "content": "Customer Complaint: Ramesh (Order #9054) reported that the ceramic mug set arrived shattered. Refund requested.",
                        "summary": "Shattered ceramic mug set complaint (Ramesh, Order #9054)",
                        "intent": "dump",
                        "category": "business_customer_complaint",
                        "entities": {"prices": [], "urls": [], "phone_numbers": []},
                        "tags": ["complaint", "ceramic", "refund", "ramesh"],
                        "urgency": "high",
                        "is_business_related": True,
                        "created_at": "2026-07-02T11:43:00Z"
                    }
                ]
                supabase_client.table("memories").insert(memories).execute()
                print("[Database] Seeded mock data to Supabase.")
        except Exception as e:
            print(f"[Database] Failed to seed Supabase: {e}")
    else:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM memories WHERE id = ?", (mock_id_1,))
        if not cursor.fetchone():
            memories = [
                (
                    mock_id_1,
                    "Check out this silk saree link for my daughter's wedding: https://www.myntra.com/saree/designer-silk-saree-10934",
                    "Designer silk saree for daughter's wedding",
                    "dump",
                    "shopping_link",
                    json.dumps({"prices": [], "urls": ["https://www.myntra.com/saree/designer-silk-saree-10934"], "phone_numbers": []}),
                    json.dumps(["saree", "wedding", "shopping"]),
                    "none",
                    0,
                    None,
                    "2026-07-02T11:40:00Z"
                ),
                (
                    "22222222-2222-2222-2222-222222222222",
                    "Fabric Supplier offered cotton roll at Rs 120 per meter. Contact: 9876543210. Valid till next month.",
                    "Cotton roll quote at Rs 120/meter",
                    "dump",
                    "business_supplier_quote",
                    json.dumps({"prices": ["Rs 120"], "urls": [], "phone_numbers": ["9876543210"]}),
                    json.dumps(["fabric", "cotton", "quote"]),
                    "medium",
                    1,
                    None,
                    "2026-07-02T11:42:00Z"
                ),
                (
                    "33333333-3333-3333-3333-333333333333",
                    "Customer Complaint: Ramesh (Order #9054) reported that the ceramic mug set arrived shattered. Refund requested.",
                    "Shattered ceramic mug set complaint (Ramesh, Order #9054)",
                    "dump",
                    "business_customer_complaint",
                    json.dumps({"prices": [], "urls": [], "phone_numbers": []}),
                    json.dumps(["complaint", "ceramic", "refund", "ramesh"]),
                    "high",
                    1,
                    None,
                    "2026-07-02T11:43:00Z"
                )
            ]
            cursor.executemany("""
            INSERT INTO memories (id, content, summary, intent, category, entities, tags, urgency, is_business_related, embedding, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, memories)
            conn.commit()
            print("[Database] Seeded mock data to SQLite.")
        conn.close()

def add_memory(
    content: str, 
    summary: str, 
    intent: str, 
    category: str, 
    entities: dict, 
    tags: list, 
    urgency: str = "none",
    is_business_related: bool = False,
    embedding: list = None,
    language: str = "en",
    user_phone: str = "anonymous",
    due_date: str = None,
    reminder_status: str = "pending",
    document_folder: str = None
) -> dict:
    """Saves a new dump memory to SQLite and optionally duplicates to Supabase."""
    created_at = datetime.utcnow().isoformat() + "Z"
    memory_id = str(uuid.uuid4())
    
    # Store fields inside entities dict as a safety fallback
    if not isinstance(entities, dict):
        entities = {}
    entities["language"] = language
    entities["user_phone"] = user_phone
    entities["due_date"] = due_date
    entities["reminder_status"] = reminder_status
    entities["document_folder"] = document_folder
    
    memory_data = {
        "id": memory_id,
        "content": content,
        "summary": summary,
        "intent": intent,
        "category": category,
        "entities": entities,
        "tags": tags,
        "urgency": urgency,
        "is_business_related": is_business_related,
        "language": language,
        "user_phone": user_phone,
        "due_date": due_date,
        "reminder_status": reminder_status,
        "document_folder": document_folder,
        "created_at": created_at
    }

    # SQLite Save (Primary/Replica)
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO memories (id, content, summary, intent, category, entities, tags, urgency, is_business_related, language, user_phone, due_date, reminder_status, document_folder, embedding, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        memory_id,
        content,
        summary,
        intent,
        category,
        json.dumps(entities),
        json.dumps(tags),
        urgency,
        1 if is_business_related else 0,
        language,
        user_phone,
        due_date,
        reminder_status,
        document_folder,
        json.dumps(embedding) if embedding else None,
        created_at
    ))
    conn.commit()
    conn.close()
    print(f"[Database] Saved memory to local SQLite replica: {memory_id}")

    if Config.USE_SUPABASE:
        supabase_payload = memory_data.copy()
        if embedding:
            supabase_payload["embedding"] = embedding
        
        try:
            response = supabase_client.table("memories").insert(supabase_payload).execute()
            if response.data:
                print(f"[Database] Saved memory to Supabase: {memory_id}")
                res = response.data[0]
                ent = res.get("entities")
                if isinstance(ent, str):
                    try: ent = json.loads(ent)
                    except: ent = {}
                if not res.get("due_date") and isinstance(ent, dict):
                    res["due_date"] = ent.get("due_date")
                if not res.get("reminder_status") and isinstance(ent, dict):
                    res["reminder_status"] = ent.get("reminder_status", "pending")
                if not res.get("document_folder") and isinstance(ent, dict):
                    res["document_folder"] = ent.get("document_folder")
                return res
            else:
                raise Exception("No data returned from Supabase insert.")
        except Exception as e:
            print(f"[Database] Supabase insert failed: {e}. Retrying without new/regional columns...")
            try:
                # Remove columns and retry insert (preserved inside entities JSON)
                supabase_payload_fallback = supabase_payload.copy()
                for col in ["language", "user_phone", "due_date", "reminder_status", "document_folder"]:
                    if col in supabase_payload_fallback:
                        del supabase_payload_fallback[col]
                response = supabase_client.table("memories").insert(supabase_payload_fallback).execute()
                if response.data:
                    print(f"[Database] Saved memory to Supabase (without custom columns): {memory_id}")
                    res = response.data[0]
                    ent = res.get("entities")
                    if isinstance(ent, str):
                        try: ent = json.loads(ent)
                        except: ent = {}
                    if not res.get("due_date") and isinstance(ent, dict):
                        res["due_date"] = ent.get("due_date")
                    if not res.get("reminder_status") and isinstance(ent, dict):
                        res["reminder_status"] = ent.get("reminder_status", "pending")
                    if not res.get("document_folder") and isinstance(ent, dict):
                        res["document_folder"] = ent.get("document_folder")
                    return res
            except Exception as e2:
                print(f"[Database] Supabase fallback insert failed: {e2}. Falling back to local SQLite record.")
            
    return memory_data


def update_memory(
    memory_id: str,
    content: str,
    summary: str,
    category: str,
    entities: dict,
    tags: list,
    urgency: str = "none",
    is_business_related: bool = False,
    embedding: list = None,
    language: str = None,
    user_phone: str = None,
    due_date: str = None,
    reminder_status: str = None,
    document_folder: str = None
) -> dict:
    """Updates an existing memory in SQLite replica and optionally duplicates to Supabase."""
    if not isinstance(entities, dict):
        entities = {}
    if language:
        entities["language"] = language
    if user_phone:
        entities["user_phone"] = user_phone
    if due_date is not None:
        entities["due_date"] = due_date
    if reminder_status is not None:
        entities["reminder_status"] = reminder_status
    if document_folder is not None:
        entities["document_folder"] = document_folder
        
    update_data = {
        "content": content,
        "summary": summary,
        "category": category,
        "entities": entities,
        "tags": tags,
        "urgency": urgency,
        "is_business_related": is_business_related
    }
    if language:
        update_data["language"] = language
    if user_phone:
        update_data["user_phone"] = user_phone
    if due_date is not None:
        update_data["due_date"] = due_date
    if reminder_status is not None:
        update_data["reminder_status"] = reminder_status
    if document_folder is not None:
        update_data["document_folder"] = document_folder

    # SQLite Update (Primary/Replica)
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Dynamically build UPDATE query for SQLite based on optional fields
    set_clauses = ["content = ?", "summary = ?", "category = ?", "entities = ?", "tags = ?", "urgency = ?", "is_business_related = ?"]
    params = [content, summary, category, json.dumps(entities), json.dumps(tags), urgency, 1 if is_business_related else 0]
    
    if language:
        set_clauses.append("language = ?")
        params.append(language)
    if user_phone:
        set_clauses.append("user_phone = ?")
        params.append(user_phone)
    if due_date is not None:
        set_clauses.append("due_date = ?")
        params.append(due_date)
    if reminder_status is not None:
        set_clauses.append("reminder_status = ?")
        params.append(reminder_status)
    if document_folder is not None:
        set_clauses.append("document_folder = ?")
        params.append(document_folder)
    if embedding:
        set_clauses.append("embedding = ?")
        params.append(json.dumps(embedding))
        
    params.append(memory_id)
    query = f"UPDATE memories SET {', '.join(set_clauses)} WHERE id = ?"
    cursor.execute(query, params)
    conn.commit()
    conn.close()
    print(f"[Database] Updated memory in local SQLite replica: {memory_id}")

    if Config.USE_SUPABASE:
        supabase_payload = update_data.copy()
        if embedding:
            supabase_payload["embedding"] = embedding
        try:
            response = supabase_client.table("memories").update(supabase_payload).eq("id", memory_id).execute()
            if response.data:
                print(f"[Database] Updated memory on Supabase: {memory_id}")
                res = response.data[0]
                ent = res.get("entities")
                if isinstance(ent, str):
                    try: ent = json.loads(ent)
                    except: ent = {}
                if not res.get("due_date") and isinstance(ent, dict):
                    res["due_date"] = ent.get("due_date")
                if not res.get("reminder_status") and isinstance(ent, dict):
                    res["reminder_status"] = ent.get("reminder_status", "pending")
                if not res.get("document_folder") and isinstance(ent, dict):
                    res["document_folder"] = ent.get("document_folder")
                return res
            else:
                raise Exception("No data returned from Supabase update.")
        except Exception as e:
            print(f"[Database] Supabase update failed: {e}. Retrying without custom columns...")
            try:
                supabase_payload_fallback = supabase_payload.copy()
                for col in ["language", "user_phone", "due_date", "reminder_status", "document_folder"]:
                    if col in supabase_payload_fallback:
                        del supabase_payload_fallback[col]
                response = supabase_client.table("memories").update(supabase_payload_fallback).eq("id", memory_id).execute()
                if response.data:
                    print(f"[Database] Updated memory on Supabase (without custom columns): {memory_id}")
                    res = response.data[0]
                    ent = res.get("entities")
                    if isinstance(ent, str):
                        try: ent = json.loads(ent)
                        except: ent = {}
                    if not res.get("due_date") and isinstance(ent, dict):
                        res["due_date"] = ent.get("due_date")
                    if not res.get("reminder_status") and isinstance(ent, dict):
                        res["reminder_status"] = ent.get("reminder_status", "pending")
                    if not res.get("document_folder") and isinstance(ent, dict):
                        res["document_folder"] = ent.get("document_folder")
                    return res
            except Exception as e2:
                print(f"[Database] Supabase fallback update failed: {e2}. Falling back to SQLite update.")

    return {
        "id": memory_id,
        **update_data
    }


def delete_memory(memory_id: str) -> bool:
    """Deletes an existing memory by ID from local SQLite replica and optionally Supabase."""
    # SQLite Delete
    sqlite_success = False
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
        conn.commit()
        conn.close()
        print(f"[Database] Deleted memory from local SQLite replica: {memory_id}")
        sqlite_success = True
    except Exception as e:
        print(f"[Database] SQLite delete failed: {e}")

    if Config.USE_SUPABASE:
        try:
            supabase_client.table("memories").delete().eq("id", memory_id).execute()
            print(f"[Database] Deleted memory from Supabase: {memory_id}")
            return True
        except Exception as e:
            print(f"[Database] Supabase delete failed: {e}.")

    return sqlite_success


def get_memory(memory_id: str) -> dict:
    """Retrieves a single memory by ID."""
    if Config.USE_SUPABASE:
        try:
            response = supabase_client.table("memories").select("*").eq("id", memory_id).execute()
            if response.data:
                r = response.data[0]
                ent = r.get("entities")
                if isinstance(ent, str):
                    try:
                        ent = json.loads(ent)
                    except:
                        ent = {}
                return {
                    "id": r["id"],
                    "content": r["content"],
                    "summary": r["summary"],
                    "intent": r["intent"],
                    "category": r["category"],
                    "entities": ent,
                    "tags": r.get("tags") or [],
                    "urgency": r.get("urgency", "none"),
                    "is_business_related": bool(r.get("is_business_related")),
                    "language": r.get("language") or (ent.get("language") if isinstance(ent, dict) else "en"),
                    "user_phone": r.get("user_phone") or (ent.get("user_phone") if isinstance(ent, dict) else "anonymous"),
                    "due_date": r.get("due_date") or (ent.get("due_date") if isinstance(ent, dict) else None),
                    "reminder_status": r.get("reminder_status") or (ent.get("reminder_status") if isinstance(ent, dict) else "pending"),
                    "created_at": r["created_at"]
                }
        except Exception as e:
            print(f"[Database] Supabase read single memory failed: {e}. Reading from SQLite...")

    # SQLite read (Fallback)
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM memories WHERE id = ?", (memory_id,))
    r = cursor.fetchone()
    conn.close()
    
    if not r:
        return None
        
    entities_data = json.loads(r["entities"]) if r["entities"] else {}
    lang_val = r["language"] if "language" in r.keys() else entities_data.get("language", "en")
    phone_val = r["user_phone"] if "user_phone" in r.keys() else entities_data.get("user_phone", "anonymous")
    due_val = r["due_date"] if "due_date" in r.keys() else entities_data.get("due_date")
    status_val = r["reminder_status"] if "reminder_status" in r.keys() else entities_data.get("reminder_status", "pending")
    folder_val = r["document_folder"] if "document_folder" in r.keys() else entities_data.get("document_folder")
    
    return {
        "id": r["id"],
        "content": r["content"],
        "summary": r["summary"],
        "intent": r["intent"],
        "category": r["category"],
        "entities": entities_data,
        "tags": json.loads(r["tags"]) if r["tags"] else [],
        "urgency": r["urgency"] if "urgency" in r.keys() else "none",
        "is_business_related": bool(r["is_business_related"]) if "is_business_related" in r.keys() else False,
        "language": lang_val,
        "user_phone": phone_val,
        "due_date": due_val,
        "reminder_status": status_val,
        "document_folder": folder_val,
        "created_at": r["created_at"]
    }


def get_all_memories(category: str = None, user_phone: str = None) -> list:
    """Retrieves all memories, optionally filtered by category and user_phone."""
    if Config.USE_SUPABASE:
        try:
            query = supabase_client.table("memories").select("*")
            if category:
                query = query.eq("category", category)
            response = query.order("created_at", desc=True).execute()
            
            results = response.data
            if user_phone:
                filtered = []
                for r in results:
                    db_phone = r.get("user_phone")
                    ent = r.get("entities")
                    if isinstance(ent, str):
                        try:
                            ent = json.loads(ent)
                        except:
                            ent = {}
                    ent_phone = ent.get("user_phone") if isinstance(ent, dict) else None
                    if db_phone == user_phone or ent_phone == user_phone:
                        filtered.append(r)
                # Map due_date and reminder_status consistently
                for r in filtered:
                    ent = r.get("entities")
                    if isinstance(ent, str):
                        try: ent = json.loads(ent)
                        except: ent = {}
                    if not r.get("due_date") and isinstance(ent, dict):
                        r["due_date"] = ent.get("due_date")
                    if not r.get("reminder_status") and isinstance(ent, dict):
                        r["reminder_status"] = ent.get("reminder_status", "pending")
                return filtered
            return results
        except Exception as e:
            print(f"[Database] Supabase read failed: {e}. Reading from SQLite instead...")

    # SQLite read (Fallback)
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    if category and user_phone:
        cursor.execute("SELECT * FROM memories WHERE category = ? AND user_phone = ? ORDER BY created_at DESC", (category, user_phone))
    elif category:
        cursor.execute("SELECT * FROM memories WHERE category = ? ORDER BY created_at DESC", (category,))
    elif user_phone:
        cursor.execute("SELECT * FROM memories WHERE user_phone = ? ORDER BY created_at DESC", (user_phone,))
    else:
        cursor.execute("SELECT * FROM memories ORDER BY created_at DESC")
    
    rows = cursor.fetchall()
    conn.close()
    
    memories = []
    for r in rows:
        entities_data = json.loads(r["entities"]) if r["entities"] else {}
        lang_val = r["language"] if "language" in r.keys() else entities_data.get("language", "en")
        phone_val = r["user_phone"] if "user_phone" in r.keys() else entities_data.get("user_phone", "anonymous")
        due_val = r["due_date"] if "due_date" in r.keys() else entities_data.get("due_date")
        status_val = r["reminder_status"] if "reminder_status" in r.keys() else entities_data.get("reminder_status", "pending")
        folder_val = r["document_folder"] if "document_folder" in r.keys() else entities_data.get("document_folder")
        
        memories.append({
            "id": r["id"],
            "content": r["content"],
            "summary": r["summary"],
            "intent": r["intent"],
            "category": r["category"],
            "entities": entities_data,
            "tags": json.loads(r["tags"]) if r["tags"] else [],
            "urgency": r["urgency"] if "urgency" in r.keys() else "none",
            "is_business_related": bool(r["is_business_related"]) if "is_business_related" in r.keys() else False,
            "language": lang_val,
            "user_phone": phone_val,
            "due_date": due_val,
            "reminder_status": status_val,
            "document_folder": folder_val,
            "created_at": r["created_at"]
        })
    return memories

def cosine_similarity(v1, v2):
    """Calculates cosine similarity between two vectors."""
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))

def search_memories(query_text: str, query_embedding: list = None, limit: int = 5, user_phone: str = None) -> list:
    """Searches memories using semantic vector search, or keyword scoring fallback, filtered by user_phone."""
    if Config.USE_SUPABASE and query_embedding:
        try:
            # Call the pgvector RPC match_memories
            response = supabase_client.rpc("match_memories", {
                "query_embedding": query_embedding,
                "match_threshold": 0.2,
                "match_count": limit * 2 # Retrieve more to allow client-side filtering if user_phone is set
            }).execute()
            if response.data:
                matches = response.data
                if user_phone:
                    matches = [m for m in matches if m.get("user_phone") == user_phone or (m.get("entities") and (json.loads(m.get("entities")) if isinstance(m.get("entities"), str) else m.get("entities")).get("user_phone") == user_phone)]
                
                # Consistently assign due_date and reminder_status mapping
                for m in matches:
                    ent = m.get("entities")
                    if isinstance(ent, str):
                        try: ent = json.loads(ent)
                        except: ent = {}
                    if not m.get("due_date") and isinstance(ent, dict):
                        m["due_date"] = ent.get("due_date")
                    if not m.get("reminder_status") and isinstance(ent, dict):
                        m["reminder_status"] = ent.get("reminder_status", "pending")
                        
                return matches[:limit]
            else:
                print("[Database] Supabase semantic search returned no results, trying local fallback...")
        except Exception as e:
            print(f"[Database] Supabase RPC search failed: {e}. Trying local fallback...")

    # SQLite Search (Fallback)
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    if user_phone:
        cursor.execute("SELECT * FROM memories WHERE user_phone = ?", (user_phone,))
    else:
        cursor.execute("SELECT * FROM memories")
    rows = cursor.fetchall()
    conn.close()

    results = []
    
    # Mode A: If embedding is available, run Cosine Similarity
    if query_embedding:
        query_v = np.array(query_embedding)
        for r in rows:
            if r["embedding"]:
                try:
                    db_embedding = json.loads(r["embedding"])
                    db_v = np.array(db_embedding)
                    similarity = cosine_similarity(query_v, db_v)
                    
                    entities_data = json.loads(r["entities"]) if r["entities"] else {}
                    lang_val = r["language"] if "language" in r.keys() else entities_data.get("language", "en")
                    phone_val = r["user_phone"] if "user_phone" in r.keys() else entities_data.get("user_phone", "anonymous")
                    due_val = r["due_date"] if "due_date" in r.keys() else entities_data.get("due_date")
                    status_val = r["reminder_status"] if "reminder_status" in r.keys() else entities_data.get("reminder_status", "pending")
                    results.append({
                        "id": r["id"],
                        "content": r["content"],
                        "summary": r["summary"],
                        "intent": r["intent"],
                        "category": r["category"],
                        "entities": entities_data,
                        "tags": json.loads(r["tags"]) if r["tags"] else [],
                        "urgency": r["urgency"] if "urgency" in r.keys() else "none",
                        "is_business_related": bool(r["is_business_related"]) if "is_business_related" in r.keys() else False,
                        "language": lang_val,
                        "user_phone": phone_val,
                        "due_date": due_val,
                        "reminder_status": status_val,
                        "created_at": r["created_at"],
                        "similarity": similarity
                    })
                except Exception as e:
                    print(f"[Database] Vector similarity calc failed for row {r['id']}: {e}")
                    
        # Sort by similarity descending
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]

    # Mode B: If embedding is NOT available, run keyword overlap scoring (fallback search)
    query_words = set(query_text.lower().split())
    for r in rows:
        content = r["content"].lower()
        summary = (r["summary"] or "").lower()
        category = (r["category"] or "").lower()
        
        # Calculate overlap score
        score = 0.0
        for word in query_words:
            if word in content:
                score += 1.0
            if word in summary:
                score += 1.5
            if word in category:
                score += 2.0
                
        # Only include if there is some overlap
        if score > 0:
            entities_data = json.loads(r["entities"]) if r["entities"] else {}
            lang_val = r["language"] if "language" in r.keys() else entities_data.get("language", "en")
            phone_val = r["user_phone"] if "user_phone" in r.keys() else entities_data.get("user_phone", "anonymous")
            due_val = r["due_date"] if "due_date" in r.keys() else entities_data.get("due_date")
            status_val = r["reminder_status"] if "reminder_status" in r.keys() else entities_data.get("reminder_status", "pending")
            results.append({
                "id": r["id"],
                "content": r["content"],
                "summary": r["summary"],
                "intent": r["intent"],
                "category": r["category"],
                "entities": entities_data,
                "tags": json.loads(r["tags"]) if r["tags"] else [],
                "urgency": r["urgency"] if "urgency" in r.keys() else "none",
                "is_business_related": bool(r["is_business_related"]) if "is_business_related" in r.keys() else False,
                "language": lang_val,
                "user_phone": phone_val,
                "due_date": due_val,
                "reminder_status": status_val,
                "created_at": r["created_at"],
                "similarity": score / (len(query_words) + 1) # Normalization
            })
            
    # Sort by score descending
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:limit]


def search_quotes_only(query_text: str, query_embedding: list = None, user_phone: str = None) -> list:
    """Retrieves all business_supplier_quote memories for the user, scores them by similarity, and returns them."""
    quotes = []
    
    if Config.USE_SUPABASE:
        try:
            response = supabase_client.table("memories").select("*").eq("category", "business_supplier_quote").execute()
            if response.data:
                rows = response.data
                for r in rows:
                    db_phone = r.get("user_phone")
                    ent = r.get("entities")
                    if isinstance(ent, str):
                        try: ent = json.loads(ent)
                        except: ent = {}
                    ent_phone = ent.get("user_phone") if isinstance(ent, dict) else None
                    if db_phone == user_phone or ent_phone == user_phone or user_phone == "anonymous":
                        quotes.append({
                            "id": r["id"],
                            "content": r["content"],
                            "summary": r["summary"],
                            "category": r["category"],
                            "entities": ent,
                            "tags": r.get("tags") or [],
                            "urgency": r.get("urgency", "none"),
                            "is_business_related": bool(r.get("is_business_related")),
                            "language": r.get("language") or "en",
                            "user_phone": user_phone,
                            "due_date": r.get("due_date") or ent.get("due_date"),
                            "reminder_status": r.get("reminder_status") or ent.get("reminder_status", "pending"),
                            "created_at": r["created_at"],
                            "embedding": r.get("embedding")
                        })
        except Exception as e:
            print(f"[Database] Supabase get quotes failed: {e}. Falling back to SQLite...")
            
    if not quotes:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        if user_phone:
            cursor.execute("SELECT * FROM memories WHERE category = 'business_supplier_quote' AND user_phone = ?", (user_phone,))
        else:
            cursor.execute("SELECT * FROM memories WHERE category = 'business_supplier_quote'")
        rows = cursor.fetchall()
        conn.close()
        
        for r in rows:
            entities_data = json.loads(r["entities"]) if r["entities"] else {}
            lang_val = r["language"] if "language" in r.keys() else entities_data.get("language", "en")
            phone_val = r["user_phone"] if "user_phone" in r.keys() else entities_data.get("user_phone", "anonymous")
            due_val = r["due_date"] if "due_date" in r.keys() else entities_data.get("due_date")
            status_val = r["reminder_status"] if "reminder_status" in r.keys() else entities_data.get("reminder_status", "pending")
            
            quotes.append({
                "id": r["id"],
                "content": r["content"],
                "summary": r["summary"],
                "category": r["category"],
                "entities": entities_data,
                "tags": json.loads(r["tags"]) if r["tags"] else [],
                "urgency": r["urgency"] if "urgency" in r.keys() else "none",
                "is_business_related": bool(r["is_business_related"]) if "is_business_related" in r.keys() else False,
                "language": lang_val,
                "user_phone": phone_val,
                "due_date": due_val,
                "reminder_status": status_val,
                "created_at": r["created_at"],
                "embedding": r["embedding"]
            })
            
    scored_quotes = []
    if query_embedding:
        query_v = np.array(query_embedding)
        for q in quotes:
            similarity = 0.0
            if q["embedding"]:
                try:
                    db_emb = q["embedding"]
                    if isinstance(db_emb, str):
                        db_emb = json.loads(db_emb)
                    db_v = np.array(db_emb)
                    similarity = cosine_similarity(query_v, db_v)
                except Exception as e:
                    print(f"[Database] Quote similarity score failed: {e}")
            scored_quotes.append({**q, "similarity": similarity})
        scored_quotes.sort(key=lambda x: x["similarity"], reverse=True)
    else:
        query_words = set(query_text.lower().split())
        for q in quotes:
            score = 0.0
            content = q["content"].lower()
            summary = (q["summary"] or "").lower()
            for word in query_words:
                if word in content:
                    score += 1.0
                if word in summary:
                    score += 1.5
            scored_quotes.append({**q, "similarity": score / (len(query_words) + 1)})
        scored_quotes.sort(key=lambda x: x.get("similarity", 0.0), reverse=True)
        
    return scored_quotes


import os
from datetime import datetime
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import database
import brain
from config import Config

# Initialize FastAPI app
app = FastAPI(title="MemoDrop Standalone", description="Intelligent Memory Assistant")

# Ensure static folder exists
os.makedirs("static", exist_ok=True)

# Initialize storage layer
database.init_db()

import base64
import io
import pypdf
import docx

def extract_document_text(filename: str, base64_data: str) -> str:
    """Decodes base64 document data and extracts text from PDF or DOCX files."""
    try:
        if not base64_data:
            return ""
            
        data_str = base64_data.strip()
        if "base64," in data_str:
            data_str = data_str.split("base64,", 1)[1]
            
        file_bytes = base64.b64decode(data_str)
        filename_lower = filename.lower()
        extracted_text = ""
        
        if filename_lower.endswith(".pdf"):
            pdf_file = io.BytesIO(file_bytes)
            reader = pypdf.PdfReader(pdf_file)
            pages_text = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            extracted_text = "\n".join(pages_text)
            
        elif filename_lower.endswith(".docx"):
            docx_file = io.BytesIO(file_bytes)
            doc = docx.Document(docx_file)
            paragraphs = [p.text for p in doc.paragraphs if p.text]
            extracted_text = "\n".join(paragraphs)
            
        return extracted_text.strip()
    except Exception as e:
        print(f"[Document Extractor] Error extracting text from {filename}: {e}")
        return ""


@app.get("/")
async def get_dashboard():
    """Serves the main web dashboard."""
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>Static assets missing. Please build the dashboard in /static.</h1>")


@app.post("/api/transcribe")
async def api_transcribe_audio(file: UploadFile = File(...)):
    """Transcribes uploaded audio files using Whisper via Groq."""
    try:
        audio_bytes = await file.read()
        filename = file.filename or "recording.webm"
        print(f"[API] Transcribing audio file: {filename} ({len(audio_bytes)} bytes)...")
        text = brain.transcribe_audio(audio_bytes, filename)
        print(f"[API] Audio transcription: '{text.encode('ascii', errors='replace').decode()}'")
        return JSONResponse({"text": text})
    except Exception as e:
        print(f"[API] Audio transcription failed: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/api/send-message")
async def api_send_message(request: Request):
    """
    Simulation API for the web-based chat.
    Accepts JSON containing message text and returns the response plus detailed pipeline logs.
    """
    data = await request.json()
    message_text = data.get("message", "").strip()
    media_type = data.get("media_type", "text")
    timestamp = data.get("timestamp")
    user_phone = data.get("user_phone", "anonymous")
    
    if not timestamp:
        timestamp = datetime.utcnow().isoformat() + "Z"
    
    if not message_text:
        return JSONResponse({"error": "Empty message"}, status_code=400)
        
    pipeline_logs = []
    
    is_document_upload = message_text.startswith("[Document Attachment]")
    document_folder = None
    
    ai_process_text = message_text
    if message_text.startswith("[Image Attachment]"):
        parts = message_text.split(" | data:", 1)
        caption_part = parts[0].replace("[Image Attachment]", "").strip()
        caption = caption_part.replace("caption:", "").strip()
        ai_process_text = f"Image uploaded. Description/Caption: {caption}" if caption else "Image uploaded."
    elif message_text.startswith("[Location Attachment]"):
        ai_process_text = message_text.replace("[Location Attachment]", "Location shared:").strip()
    elif message_text.startswith("[Contact Attachment]"):
        ai_process_text = message_text.replace("[Contact Attachment]", "Contact shared:").strip()
    elif message_text.startswith("[Document Attachment]"):
        parts = message_text.split(" | data:", 1)
        meta_parts = parts[0].replace("[Document Attachment]", "").split(" | ")
        filename = ""
        caption = ""
        for mp in meta_parts:
            mp_s = mp.strip()
            if mp_s.startswith("filename:"):
                filename = mp_s.replace("filename:", "").strip()
            elif mp_s.startswith("caption:"):
                caption = mp_s.replace("caption:", "").strip()
        ai_process_text = f"Document uploaded: {filename}."
        if caption:
            ai_process_text += f" Description/Caption: {caption}"
            
        base64_data = parts[1].strip() if len(parts) > 1 else ""
        doc_text = extract_document_text(filename, base64_data)
        document_folder = brain.classify_document_folder(doc_text, filename)
        print(f"[DEBUG] Filename: {filename}, base64 len: {len(base64_data)}, extracted len: {len(doc_text)}, classified: {document_folder}", flush=True)

    # Step 1: Intent Routing
    pipeline_logs.append({"step": "1. Intent Routing", "status": "processing", "message": "Analyzing intent..."})
    forced_intent = data.get("intent")
    if forced_intent in ["dump", "query"]:
        intent = forced_intent
        confidence = "forced"
        cleaned_query = ai_process_text
        if intent == "query" and cleaned_query.lower().startswith("query:"):
            cleaned_query = cleaned_query[6:].strip()
    else:
        routing_result = brain.route_intent(ai_process_text)
        intent = routing_result.get("intent", "dump")
        confidence = routing_result.get("confidence", "high")
        cleaned_query = routing_result.get("cleaned_query")
    
    pipeline_logs.append({
        "step": "1. Intent Routing", 
        "status": "completed", 
        "message": f"Routed as '{intent.upper()}' ({confidence} confidence). Cleaned Query: {cleaned_query}"
    })
    
    response_text = ""
    extracted_data = {}
    search_results = []
    
    if intent == "query":
        # Step 2: Generate query vector
        pipeline_logs.append({"step": "2. Vector Generation", "status": "processing", "message": "Generating embedding for query..."})
        query_embedding = brain.generate_embedding(cleaned_query)
        if query_embedding:
            pipeline_logs.append({"step": "2. Vector Generation", "status": "completed", "message": f"Generated {len(query_embedding)}-dim embedding vector."})
        else:
            pipeline_logs.append({"step": "2. Vector Generation", "status": "completed", "message": "Skipped. No API key provided for embeddings."})
            
        # Step 3: DB Search
        pipeline_logs.append({"step": "3. Memory Search", "status": "processing", "message": f"Searching DB for: '{cleaned_query}'..."})
        search_results = database.search_memories(cleaned_query, query_embedding, limit=3, user_phone=user_phone)
        pipeline_logs.append({"step": "3. Memory Search", "status": "completed", "message": f"Found {len(search_results)} relevant memory matches."})
        
        # Format response
        # Format response natively in query language
        if search_results:
            response_text = brain.generate_query_response(cleaned_query, search_results)
            if not response_text:
                response_text = f"🔍 Found matching memories for your search:\n\n"
                for i, match in enumerate(search_results, 1):
                    category = match.get('category', 'other')
                    summary = match.get('summary', 'Memory')
                    content = match.get('content', '')
                    similarity = match.get('similarity', 0.0)
                    urgency = match.get('urgency', 'none')
                    
                    score_str = ""
                    if isinstance(similarity, float) and similarity > 0.0:
                        score = int(similarity * 100) if similarity <= 1.0 else int(similarity)
                        score_str = f" ({score}% relevance)"
                    
                    pretty_cat = category.replace("business_", "").replace("_", " ").capitalize()
                    urg_str = f", urgency: {urgency}" if urgency and urgency != 'none' else ""
                    
                    response_text += f"*{i}. [{pretty_cat}]* {summary}{score_str}{urg_str}\n"
                    response_text += f"   \"{content}\"\n\n"
        else:
            response_text = brain.generate_no_results_response(cleaned_query)
            
    else:  # intent == "dump"
        force_save = data.get("force_save", False)
        if not force_save:
            existing = database.find_duplicate_memory(message_text, user_phone=user_phone)
            if existing:
                # We pre-calculate what would have been saved so we can pass it to the frontend for replacement
                brain_data = brain.process_dump(ai_process_text, media_type, timestamp)
                category = brain_data.get("category", "random_thought")
                if is_document_upload:
                    category = "document"
                summary = brain_data.get("summary", "New Memory")
                entities = brain_data.get("entities", {})
                tags = brain_data.get("tags", [])
                urgency = brain_data.get("urgency", "none")
                is_business_related = brain_data.get("is_business_related", False)
                if "is_business_related" in data:
                    is_business_related = bool(data["is_business_related"])
                language = brain_data.get("language", "en")
                response_text = brain_data.get("reply")
                due_date = brain_data.get("due_date")
                reminder_status = brain_data.get("reminder_status")
                if not reminder_status and (category == "task_reminder" or due_date):
                    reminder_status = "pending"
                final_folder = document_folder
                if category == "document" and not final_folder:
                    final_folder = "Personal"
                    
                new_memory_data = {
                    "content": message_text,
                    "category": category,
                    "summary": summary,
                    "entities": entities,
                    "tags": tags,
                    "urgency": urgency,
                    "is_business_related": is_business_related,
                    "language": language,
                    "due_date": due_date,
                    "reminder_status": reminder_status,
                    "document_folder": final_folder
                }
                
                return JSONResponse({
                    "status": "duplicate_detected",
                    "existing_memory": {
                        "id": existing.get("id"),
                        "summary": existing.get("summary"),
                        "category": existing.get("category"),
                        "document_folder": existing.get("document_folder")
                    },
                    "new_memory_data": new_memory_data
                })

        # Step 2: LLM processing (categorization, entity extraction)
        pipeline_logs.append({"step": "2. AI Processing", "status": "processing", "message": "Categorizing and extracting entities..."})
        brain_data = brain.process_dump(ai_process_text, media_type, timestamp)
        category = brain_data.get("category", "random_thought")
        if is_document_upload:
            category = "document"
            
        summary = brain_data.get("summary", "New Memory")
        entities = brain_data.get("entities", {})
        tags = brain_data.get("tags", [])
        urgency = brain_data.get("urgency", "none")
        is_business_related = brain_data.get("is_business_related", False)
        
        # Respect user manual mode switcher override from the frontend web app
        if "is_business_related" in data:
            is_business_related = bool(data["is_business_related"])
        
        # Extract language and custom response
        language = brain_data.get("language", "en")
        response_text = brain_data.get("reply")
        due_date = brain_data.get("due_date")
        reminder_status = brain_data.get("reminder_status")
        if not reminder_status and (category == "task_reminder" or due_date):
            reminder_status = "pending"
            
        final_folder = document_folder
        if category == "document" and not final_folder:
            final_folder = "Personal"
            
        extracted_data = {
            "category": category,
            "summary": summary,
            "entities": entities,
            "tags": tags,
            "urgency": urgency,
            "is_business_related": is_business_related,
            "language": language,
            "user_phone": user_phone,
            "due_date": due_date,
            "reminder_status": reminder_status,
            "document_folder": final_folder
        }
        
        pipeline_logs.append({
            "step": "2. AI Processing", 
            "status": "completed", 
            "message": f"Category: {category}. Urgency: {urgency}. Business: {is_business_related}. Language: {language}. Phone: {user_phone}. Due: {due_date}. Status: {reminder_status}. Folder: {final_folder}"
        })
        
        # Step 3: Embed content for vector search
        pipeline_logs.append({"step": "3. Vector Storage", "status": "processing", "message": "Embedding dump text..."})
        embedding = brain.generate_embedding(ai_process_text)
        if embedding:
            pipeline_logs.append({"step": "3. Vector Storage", "status": "completed", "message": f"Generated {len(embedding)}-dim vector."})
        else:
            pipeline_logs.append({"step": "3. Vector Storage", "status": "completed", "message": "Skipped. No API key provided for embeddings."})
            
        # Step 4: Save or Update memory
        update_memory_id = data.get("update_memory_id")
        if update_memory_id:
            entities["updated_at"] = datetime.utcnow().isoformat() + "Z"
            
            existing_mem = database.get_memory(update_memory_id)
            existing_folder = existing_mem.get("document_folder") if existing_mem else None
            if not final_folder:
                final_folder = existing_folder
            if category == "document" and not final_folder:
                final_folder = "Personal"
                
            pipeline_logs.append({"step": "4. Database Write", "status": "processing", "message": f"Updating existing memory ID {update_memory_id}..."})
            saved_memory = database.update_memory(
                memory_id=update_memory_id,
                content=message_text,
                summary=summary,
                category=category,
                entities=entities,
                tags=tags,
                urgency=urgency,
                is_business_related=is_business_related,
                embedding=embedding,
                language=language,
                user_phone=user_phone,
                due_date=due_date,
                reminder_status=reminder_status,
                document_folder=final_folder
            )
            if not saved_memory:
                saved_memory = {"id": update_memory_id}
            elif isinstance(saved_memory, dict) and "id" not in saved_memory:
                saved_memory["id"] = update_memory_id
        else:
            pipeline_logs.append({"step": "4. Database Write", "status": "processing", "message": "Writing memory to database..."})
            saved_memory = database.add_memory(
                content=message_text,
                summary=summary,
                intent="dump",
                category=category,
                entities=entities,
                tags=tags,
                urgency=urgency,
                is_business_related=is_business_related,
                embedding=embedding,
                language=language,
                user_phone=user_phone,
                due_date=due_date,
                reminder_status=reminder_status,
                document_folder=final_folder
            )
        
        pipeline_logs.append({
            "step": "4. Database Write", 
            "status": "completed", 
            "message": f"Memory saved successfully! ID: {saved_memory.get('id')}"
        })
        
        # Format fallback response if LLM reply is missing
        if not response_text:
            tag_str = " ".join([f"#{t}" for t in tags])
            pretty_cat = category.replace("business_", "").replace("_", " ").capitalize()
            response_text = f"📥 *Saved to MemoDrop!*\n\n*Category:* {pretty_cat}\n*Summary:* {summary}\n*Urgency:* {urgency.capitalize()}\n*Tags:* {tag_str}\n\nAsk me to retrieve it anytime!"

    # Include saved memory ID inside extracted dict for dump intents
    extracted_response = {**extracted_data, "id": saved_memory.get("id")} if intent == "dump" and saved_memory else extracted_data
    
    return JSONResponse({
        "intent": intent,
        "response": response_text,
        "extracted": extracted_response,
        "search_results": search_results,
        "pipeline_logs": pipeline_logs
    })


@app.post("/api/quotes/compare")
@app.post("/quotes/compare")
async def api_compare_quotes(request: Request):
    """
    Exposes quote comparison semantic search & Groq synthesis.
    """
    print("[API] Hit /api/quotes/compare endpoint!")
    try:
        data = await request.json()
        query = data.get("query", "").strip()
        user_phone = data.get("user_phone", "anonymous")
        
        if not query:
            return JSONResponse({"error": "Query cannot be empty"}, status_code=400)
            
        # 1. Generate query embedding
        query_embedding = brain.generate_embedding(query)
        
        # 2. Search only quotes
        quotes = database.search_quotes_only(query, query_embedding, user_phone=user_phone)
                
        if not quotes:
            return JSONResponse({
                "status": "success",
                "cheapest_supplier": "N/A",
                "cheapest_price": "N/A",
                "comparison_summary": "No saved supplier quotes found to compare.",
                "table_data": [],
                "raw_memories": []
            })
            
        # 3. Synthesize comparison using Groq LLM
        comparison_result = brain.compare_quotes(query, quotes)
        
        return JSONResponse({
            "status": "success",
            "cheapest_supplier": comparison_result.get("cheapest_supplier", "N/A"),
            "cheapest_price": comparison_result.get("cheapest_price", "N/A"),
            "comparison_summary": comparison_result.get("comparison_summary", ""),
            "table_data": comparison_result.get("table_data", []),
            "raw_memories": quotes
        })
    except Exception as e:
        print(f"[API] Error comparing quotes: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/vault/documents")
@app.get("/vault/documents")
async def api_get_vault_documents(user_phone: str = None, is_business: bool = None):
    """
    Returns all memories where category = 'document', grouped by document_folder.
    """
    try:
        memories = database.get_all_memories(category="document", user_phone=user_phone)
        
        # Start with standard folders to keep them in output even if empty
        grouped = {
            "Government & Legal": [],
            "Business & Finance": [],
            "Academic & Coursework": [],
            "Personal": []
        }
        
        for m in memories:
            # Filter by business mode if specified
            if is_business is not None:
                if bool(m.get("is_business_related")) != is_business:
                    continue
                    
            folder = m.get("document_folder") or "Personal"
            if folder not in grouped:
                grouped[folder] = []
            grouped[folder].append(m)
            
        return JSONResponse({
            "status": "success",
            "documents": grouped
        })
    except Exception as e:
        print(f"[API] Error getting vault documents: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/vault/storage")
async def api_get_vault_storage(user_phone: str = None):
    """
    Returns the storage space usage of a user.
    """
    try:
        usage = database.get_storage_usage(user_phone)
        return JSONResponse(usage)
    except Exception as e:
        print(f"[API] Error getting vault storage usage: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


active_otps = {}

@app.post("/api/otp/send")
async def api_send_otp(request: Request):
    import random
    try:
        data = await request.json()
        phone = data.get("phone", "").strip()
        if not phone:
            return JSONResponse({"status": "error", "message": "Phone number is required."}, status_code=400)
            
        otp_code = f"{random.randint(100000, 999999)}"
        active_otps[phone] = otp_code
        
        print("\n" + "=" * 55)
        print(f"  [SECURITY VERIFICATION] OTP for {phone}: {otp_code}  ")
        print("=" * 55 + "\n", flush=True)
        
        return JSONResponse({
            "status": "success",
            "message": f"Verification code sent to {phone}",
            "code_debug_simulate": otp_code
        })
    except Exception as e:
        print(f"[API] Error sending OTP: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@app.post("/api/otp/verify")
async def api_verify_otp(request: Request):
    try:
        data = await request.json()
        phone = data.get("phone", "").strip()
        code = data.get("code", "").strip()
        
        if not phone or not code:
            return JSONResponse({"status": "error", "message": "Phone and code are required."}, status_code=400)
            
        saved_code = active_otps.get(phone)
        if saved_code and saved_code == code:
            active_otps.pop(phone, None)
            return JSONResponse({"status": "success"})
        else:
            return JSONResponse({"status": "error", "message": "Invalid or expired verification code."}, status_code=400)
    except Exception as e:
        print(f"[API] Error verifying OTP: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@app.get("/share-target")
async def api_share_target(title: str = "", text: str = "", url: str = ""):
    from fastapi.responses import RedirectResponse
    import urllib.parse
    
    parts = []
    if title:
        parts.append(title)
    if text:
        parts.append(text)
    if url:
        parts.append(url)
        
    shared_content = " ".join(parts).strip()
    encoded_content = urllib.parse.quote(shared_content)
    
    return RedirectResponse(url=f"/?share_text={encoded_content}")


@app.post("/api/vault/folders/create")
@app.post("/vault/folders/create")
async def api_convert_to_folder(request: Request):
    """
    Batch updates multiple memories to be categorized as 'document' and sets their document_folder.
    """
    try:
        data = await request.json()
        memory_ids = data.get("memory_ids", [])
        folder_name = data.get("folder_name", "").strip()
        
        if not folder_name:
            return JSONResponse({"error": "Folder name cannot be empty"}, status_code=400)
            
        print(f"[API] Converting memories {memory_ids} to folder '{folder_name}'")
        for mid in memory_ids:
            mem = database.get_memory(mid)
            if mem:
                entities = mem.get("entities") or {}
                entities["document_folder"] = folder_name
                
                database.update_memory(
                    memory_id=mid,
                    content=mem.get("content"),
                    summary=mem.get("summary"),
                    category="document",  # Force category to document to fit folder grouping
                    entities=entities,
                    tags=mem.get("tags"),
                    urgency=mem.get("urgency"),
                    is_business_related=mem.get("is_business_related"),
                    embedding=None,  # Keep existing embedding
                    language=mem.get("language"),
                    due_date=mem.get("due_date"),
                    reminder_status=mem.get("reminder_status"),
                    document_folder=folder_name
                )
        return JSONResponse({"status": "success", "message": f"Successfully created folder '{folder_name}'"})
    except Exception as e:
        print(f"[API] Error converting to folder: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)



@app.get("/api/vault/insights")
@app.get("/vault/insights")
async def api_get_vault_insights(user_phone: str = None, is_business: bool = None):
    """
    Returns aggregated metrics for the current user in the current month.
    """
    try:
        memories = database.get_all_memories(user_phone=user_phone)
        
        current_month = datetime.utcnow().strftime("%Y-%m")
        filtered = []
        for m in memories:
            created_at = m.get("created_at") or ""
            if not created_at.startswith(current_month):
                continue
                
            if is_business is not None:
                if bool(m.get("is_business_related")) != is_business:
                    continue
            filtered.append(m)
            
        total_this_month = len(filtered)
        
        categories = {}
        for m in filtered:
            cat = m.get("category") or "other"
            categories[cat] = categories.get(cat, 0) + 1
            
        tags_counts = {}
        for m in filtered:
            for t in m.get("tags") or []:
                tags_counts[t] = tags_counts.get(t, 0) + 1
        top_tag = max(tags_counts, key=tags_counts.get) if tags_counts else None
        
        complaint_tags_counts = {}
        for m in filtered:
            if m.get("category") == "business_customer_complaint":
                for t in m.get("tags") or []:
                    complaint_tags_counts[t] = complaint_tags_counts.get(t, 0) + 1
        top_complaint_tag = max(complaint_tags_counts, key=complaint_tags_counts.get) if complaint_tags_counts else None
        
        return JSONResponse({
            "status": "success",
            "total_this_month": total_this_month,
            "categories": categories,
            "top_tag": top_tag,
            "top_complaint_tag": top_complaint_tag
        })
    except Exception as e:
        print(f"[API] Error getting vault insights: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/reminders/due")
@app.get("/reminders/due")
async def api_get_due_reminders(user_phone: str = None):
    """
    Returns all memories for the current user where due_date <= now() AND reminder_status = 'pending',
    ordered by due_date ascending.
    """
    try:
        memories = database.get_all_memories(user_phone=user_phone)
        now_str = datetime.utcnow().isoformat() + "Z"
        
        due_reminders = []
        for m in memories:
            due_dt = m.get("due_date")
            status = m.get("reminder_status")
            if due_dt and status == "pending":
                is_due = False
                try:
                    due_clean = due_dt.replace("Z", "+00:00")
                    now_clean = now_str.replace("Z", "+00:00")
                    if "+" not in due_clean and "-" not in due_clean[10:]:
                        due_clean += "+00:00"
                    if "+" not in now_clean and "-" not in now_clean[10:]:
                        now_clean += "+00:00"
                        
                    due_parsed = datetime.fromisoformat(due_clean)
                    now_parsed = datetime.fromisoformat(now_clean)
                    is_due = due_parsed <= now_parsed
                except Exception as ex:
                    print(f"[API] Error parsing datetime {due_dt}: {ex}. Falling back to string comparison.")
                    is_due = due_dt <= now_str
                
                if is_due:
                    due_reminders.append(m)
                    
        # Order by due_date ascending
        due_reminders.sort(key=lambda x: x.get("due_date") or "")
        return JSONResponse({"reminders": due_reminders})
    except Exception as e:
        print(f"[API] Error fetching due reminders: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/api/reminders/{memory_id}/action")
@app.post("/reminders/{memory_id}/action")
async def api_reminder_action(memory_id: str, request: Request):
    """
    Handles Mark Done and Snooze actions for a specific reminder.
    """
    from datetime import timedelta
    try:
        data = await request.json()
        action = data.get("action") # "done" or "snooze"
        
        # Retrieve existing memory
        m = database.get_memory(memory_id)
        if not m:
            return JSONResponse({"error": "Memory not found"}, status_code=404)
            
        due_date = m.get("due_date")
        reminder_status = m.get("reminder_status")
        
        if action == "done":
            reminder_status = "done"
        elif action == "snooze":
            duration = data.get("duration", "1d")
            reminder_status = "pending"
            
            hours = 24
            if duration.endswith("h"):
                try:
                    hours = int(duration[:-1])
                except:
                    hours = 1
            elif duration.endswith("d"):
                try:
                    hours = int(duration[:-1]) * 24
                except:
                    hours = 24
            
            due_date = (datetime.utcnow() + timedelta(hours=hours)).isoformat() + "Z"
        else:
            return JSONResponse({"error": f"Invalid action '{action}'"}, status_code=400)
            
        # Update entities field
        entities = m.get("entities") or {}
        entities["due_date"] = due_date
        entities["reminder_status"] = reminder_status
        entities["updated_at"] = datetime.utcnow().isoformat() + "Z"
        
        updated = database.update_memory(
            memory_id=memory_id,
            content=m["content"],
            summary=m["summary"],
            category=m["category"],
            entities=entities,
            tags=m["tags"],
            urgency=m["urgency"],
            is_business_related=m["is_business_related"],
            embedding=None, # Keep existing embedding
            language=m.get("language"),
            user_phone=m.get("user_phone"),
            due_date=due_date,
            reminder_status=reminder_status
        )
        
        return JSONResponse({"status": "success", "memory": updated})
    except Exception as e:
        print(f"[API] Error executing action on reminder {memory_id}: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@app.get("/api/memories")
async def api_get_memories(category: str = None, user_phone: str = None):
    """Retrieve all saved memories, optionally filtered by category and user_phone."""
    memories = database.get_all_memories(category, user_phone=user_phone)
    return JSONResponse({"memories": memories})

@app.put("/api/memories/{memory_id}")
async def api_update_memory(memory_id: str, request: Request):
    """Updates an existing memory with manual edits."""
    import re
    try:
        data = await request.json()
        content = data.get("content", "")
        summary = data.get("summary", "")
        category = data.get("category", "")
        tags = data.get("tags", [])
        urgency = data.get("urgency", "none")
        is_business_related = data.get("is_business_related", False)
        language = data.get("language")
        due_date = data.get("due_date")
        reminder_status = data.get("reminder_status")
        
        # Regenerate semantic embedding for the new edited text content
        embedding = brain.generate_embedding(content) if content else None
        
        # Simple entity parser fallback for edited text
        entities = {
            "prices": re.findall(r"(?:Rs\.?|INR|\$|€|£)\s?\d+(?:\.\d+)?", content),
            "urls": re.findall(r"https?://[^\s]+", content),
            "phone_numbers": [p.strip() for p in re.findall(r"\+?\d[\d\s()\-]{7,}\d", content) if len(p.replace("-","").replace(" ","")) >= 10],
            "dates": [],
            "names": [],
            "locations": [],
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }
        if language:
            entities["language"] = language
        if due_date:
            entities["due_date"] = due_date
        if reminder_status:
            entities["reminder_status"] = reminder_status
            
        # Perform updates
        updated = database.update_memory(
            memory_id=memory_id,
            content=content,
            summary=summary,
            category=category,
            entities=entities,
            tags=tags,
            urgency=urgency,
            is_business_related=is_business_related,
            embedding=embedding,
            language=language,
            due_date=due_date,
            reminder_status=reminder_status
        )
        
        return JSONResponse({"status": "success", "memory": updated})
    except Exception as e:
        print(f"[API] Error updating memory {memory_id}: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

@app.delete("/api/memories/{memory_id}")
async def api_delete_memory(memory_id: str):
    """Deletes an existing memory by ID."""
    try:
        success = database.delete_memory(memory_id)
        if success:
            return JSONResponse({"status": "success"})
        else:
            return JSONResponse({"status": "error", "message": "Failed to delete from database."}, status_code=500)
    except Exception as e:
        print(f"[API] Error deleting memory {memory_id}: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@app.get("/api/search")
async def api_search_memories(q: str = "", user_phone: str = None):
    """Allows manual semantic/keyword searching from the dashboard search box, filtered by user_phone."""
    if not q:
        return JSONResponse({"results": []})
        
    query_embedding = brain.generate_embedding(q)
    results = database.search_memories(q, query_embedding, limit=5, user_phone=user_phone)
    return JSONResponse({"results": results})

@app.get("/api/status")
async def api_get_status():
    """Returns database configuration and connection status."""
    return JSONResponse({
        "groq_connected": bool(Config.GROQ_API_KEY),
        "gemini_connected": bool(Config.GEMINI_API_KEY),
        "database_type": "Supabase PostgreSQL" if Config.USE_SUPABASE else "Local SQLite fallback"
    })

# Mount the static files folder at root so relative styles/scripts resolve correctly
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    print("[Server] Starting FastAPI server on http://localhost:8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

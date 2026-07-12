import json
import re
import requests
from config import Config

# Initialize Groq client (conditional)
groq_client = None
if Config.GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=Config.GROQ_API_KEY)
    except Exception as e:
        print(f"[Brain] Failed to initialize Groq client: {e}")

def route_intent(message_text: str) -> dict:
    """
    Routes an incoming message to 'dump' or 'query'.
    Uses Groq LLM with a schema-based prompt, falls back to a rules-based parser if Groq fails.
    """
    if not Config.GROQ_API_KEY:
        print("[Brain] Groq API key missing. Using rules-based intent routing fallback.")
        return mock_route_intent(message_text)

    prompt = f"""You are the intent router for MemoDrop. Determine whether the following 
user message is:
(a) a DUMP — the user is saving new information for later (a link, note, 
    document reference, thought, reminder, business detail, etc.)
(b) a QUERY — the user is asking to retrieve something they previously saved

MESSAGE: {message_text}

Return only this JSON:

{{
  "intent": "dump" or "query",
  "confidence": "high | medium | low",
  "cleaned_query": "if intent is query, rewrite it as a clear search phrase stripped of filler words (e.g. 'what was that saree link' becomes 'saree link'). If intent is dump, return null. CRITICAL: Do NOT translate the query to English if it is in another language like Tamil or Hindi; preserve the rewritten search phrase in its original native language/script."
}}

Guidance:
- Questions, especially ones starting with what/where/when/who/show me/find/did I, 
  are almost always queries.
- Statements, forwarded links, forwarded documents, or declarative notes are almost 
  always dumps.
- If ambiguous, default to "dump" — losing a query is more annoying to fix than 
  losing a dump (a missed dump is silently lost, a missed query can just be re-asked)."""

    try:
        model = "llama-3.3-70b-versatile"
        try:
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                response_format={"type": "json_object"},
                temperature=0.0
            )
        except Exception:
            model = "llama-3.1-8b-instant"
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                response_format={"type": "json_object"},
                temperature=0.0
            )
            
        result = json.loads(response.choices[0].message.content)
        print(f"[Brain] Intent routed by {model}: {result['intent']} ({result['confidence']} confidence)")
        
        # Clean up and native script protection filter
        cleaned = result.get("cleaned_query")
        has_regional = any(
            '\u0b80' <= c <= '\u0bff' or  # Tamil
            '\u0900' <= c <= '\u097f' or  # Hindi
            '\u0d00' <= c <= '\u0d7f' or  # Malayalam
            '\u0c00' <= c <= '\u0c7f' or  # Telugu
            '\u0c80' <= c <= '\u0cff'     # Kannada
            for c in message_text
        )
        is_ascii = False
        if cleaned:
            try:
                cleaned.encode('ascii')
                is_ascii = True
            except UnicodeEncodeError:
                is_ascii = False
                
        if cleaned and has_regional and is_ascii:
            print(f"[Brain] LLM translated regional query to English. Resetting cleaned_query to original text: '{message_text.encode('ascii', errors='replace').decode()}'")
            temp = message_text.strip().replace("?", "").replace(".", "").replace("!", "")
            # Remove common Tamil question words/suffixes
            for suffix in [" என்ன", " எவ்வளவு", " எங்கே", " எப்போது", " யார்"]:
                if temp.endswith(suffix):
                    temp = temp[:-len(suffix)].strip()
            # Remove common Hindi question words
            for word in [" क्या है", " क्या", " कब", " कहाँ", " कैसे"]:
                if temp.endswith(word):
                    temp = temp[:-len(word)].strip()
            # Remove common Malayalam question words
            for word in [" എന്താണ്", " എവിടെയാണ്", " എത്രയാണ്", " എപ്പോൾ", " എപ്പോഴാണ്"]:
                if temp.endswith(word):
                    temp = temp[:-len(word)].strip()
            # Remove common Telugu question words
            for word in [" ఏమిటి", " ఎక్కడ", " ఎంత", " ఎప్పుడు"]:
                if temp.endswith(word):
                    temp = temp[:-len(word)].strip()
            # Remove common Kannada question words
            for word in [" ಏನು", " ఎల్లి", " ఎష్టు", " యావత్తు"]:
                if temp.endswith(word):
                    temp = temp[:-len(word)].strip()
            result["cleaned_query"] = temp
            
        return result
    except Exception as e:
        print(f"[Brain] Groq intent routing call failed: {e}. Falling back to rules-based routing.")
        return mock_route_intent(message_text)

def process_dump(message_text: str, media_type: str = "text", timestamp: str = None) -> dict:
    """
    Analyzes a dump message to categorize it, summarize it, extract entities, tags, urgency and business association.
    Uses Groq LLM, falls back to rules-based parser on failure.
    """
    if not timestamp:
        from datetime import datetime
        timestamp = datetime.utcnow().isoformat() + "Z"

    if not Config.GROQ_API_KEY:
        return mock_process_dump(message_text, media_type, timestamp)

    prompt = f"""You are the processing engine for MemoDrop, a personal/business memory assistant. 
A user has sent a message to save for later retrieval. Analyze it and return 
structured data only — no explanation, no preamble.

Classify and extract information from the following content:

CONTENT: {message_text}
MEDIA_TYPE: {media_type}
TIMESTAMP: {timestamp}

Return a JSON object with exactly this structure:

{{
  "category": "one of: shopping_link | document | task_reminder | random_thought | idea | contact_info | business_supplier_quote | business_customer_complaint | business_order | business_inventory_note | other",
  "summary": "a single concise sentence (max 20 words) summarizing this entry in the SAME language as the CONTENT, written so it's scannable in a search results list",
  "tags": ["3-6 lowercase keyword tags in the SAME language as the CONTENT, relevant for search, e.g. topic, item name, person, place"],
  "entities": {{
    "dates": ["any dates or time references mentioned, in ISO format if determinable, else raw text"],
    "prices": ["any monetary amounts mentioned"],
    "urls": ["any links found in the content"],
    "names": ["any person or business names mentioned"],
    "phone_numbers": ["any phone numbers mentioned"],
    "locations": ["any place names mentioned"]
  }},
  "due_date": "an ISO 8601 UTC timestamp string (e.g. YYYY-MM-DDTHH:MM:SSZ) representing the extracted due date/time if a reminder, task, or deadline is mentioned in the CONTENT. Use the TIMESTAMP parameter to resolve relative expressions like 'tomorrow', 'Friday at 3pm' relative to the current time. If no specific date/time is mentioned or extractable, return null.",
  "reminder_status": "one of: pending | done | dismissed (default to 'pending' if it's a reminder or task, else return null)",
  "urgency": "one of: none | low | medium | high",
  "is_business_related": true or false,
  "language": "the ISO 639-1 code of the language of the CONTENT (e.g. 'ta' for Tamil, 'hi' for Hindi, 'en' for English)",
  "reply": "a confirmation reply to the user in the SAME language as the CONTENT, confirming that the note has been saved, summarizing it, listing category, attributes, and tags"
}}

Rules:
- If a field has no relevant data, return an empty array or null — never omit the key.
- Do not invent information not present in the content.
- Keep the summary strictly factual, no interpretation or opinion.
- Choose the single best-fitting category, even if the content could arguably fit two.
- Generate the summary, tags, and reply in the same native language as the CONTENT. Do not translate them to English.
- IMPORTANT Link Rules:
  - Classify as `shopping_link` ONLY if it is an e-commerce link, product page, online store, or shopping cart.
  - Classify general websites, agency links, search pages, blogs, articles, or corporate homepages (that are not shopping-oriented) as `other` or `random_thought`."""

    try:
        model = "llama-3.3-70b-versatile"
        try:
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                response_format={"type": "json_object"},
                temperature=0.0
            )
        except Exception:
            model = "llama-3.1-8b-instant"
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                response_format={"type": "json_object"},
                temperature=0.0
            )
            
        result = json.loads(response.choices[0].message.content)
        print(f"[Brain] Dump processed by {model}: Category={result.get('category')}")
        return result
    except Exception as e:
        print(f"[Brain] Groq dump processing call failed: {e}. Falling back to rules-based processing.")
        return mock_process_dump(message_text, media_type, timestamp)

def generate_embedding(text: str) -> list:
    """
    Generates a 768-dimension semantic vector embedding for the input text using Gemini API.
    Returns None if no API key is set or the API request fails.
    """
    if not Config.GEMINI_API_KEY:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={Config.GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "model": "models/text-embedding-004",
        "content": {"parts": [{"text": text}]}
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        response.raise_for_status()
        embedding_values = response.json()["embedding"]["values"]
        return embedding_values
    except Exception as e:
        print(f"[Brain] Gemini embedding API call failed: {e}. Continuing without embeddings.")
        return None

# --- MOCK FALLBACKS (Ensure system always runs offline/without API keys) ---

def mock_route_intent(message_text: str) -> dict:
    """Rules-based intent router fallback."""
    text = message_text.lower().strip()
    
    query_patterns = [
        r"^what\s", r"^where\s", r"^when\s", r"^who\s", r"^how\s", 
        r"^show\s+me", r"^find\s", r"^search\s", r"^did\s+i", r"^retrieve\s", 
        r"^get\s", r"\?$"
    ]
    
    is_query = any(re.search(pattern, text) for pattern in query_patterns)
    
    if is_query:
        cleaned = text.replace("?", "")
        cleaned = re.sub(r"^(what was that|what did|show me|find|get|search for|retrieve)\s+", "", cleaned)
        cleaned = re.sub(r"^(i saved|i dump|samed|saved|saved)\s+", "", cleaned)
        cleaned = cleaned.strip()
        
        return {
            "intent": "query",
            "confidence": "medium",
            "cleaned_query": cleaned or text
        }
    else:
        return {
            "intent": "dump",
            "confidence": "high",
            "cleaned_query": None
        }

def mock_process_dump(message_text: str, media_type: str = "text", timestamp: str = None) -> dict:
    """Regex-based metadata extractor and categorizer fallback using the new schema."""
    text = message_text.lower()
    
    category = "random_thought"
    tags = ["dump", "note"]
    is_business = False
    
    if "http" in text or "www." in text or ".com" in text:
        # Check if it has shopping-related keywords, otherwise classify as 'other'
        shopping_keywords = ["myntra", "amazon", "shop", "store", "product", "buy", "cart", "item", "saree", "price"]
        if any(kw in text for kw in shopping_keywords):
            category = "shopping_link"
            tags = ["shopping", "link", "product"]
        else:
            category = "other"
            tags = ["link", "web", "url"]
    elif any(word in text for word in ["invoice", "pdf", "docx", "excel", "file", "document", "attachment"]):
        category = "document"
        tags = ["file", "doc", "reference"]
    elif any(word in text for word in ["remind", "reminder", "remainder", "todo", "appointment", "deadline", "task", "meeting"]):
        category = "task_reminder"
        tags = ["task", "todo", "reminder"]
    elif any(word in text for word in ["quote", "price", "rate", "cost", "supplier", "fabric", "material"]):
        category = "business_supplier_quote"
        tags = ["business", "quote", "supplier", "sme"]
        is_business = True
    elif any(word in text for word in ["complaint", "broken", "delayed", "defect", "refund", "bad", "shattered"]):
        category = "business_customer_complaint"
        tags = ["business", "complaint", "customer", "sme"]
        is_business = True
    elif any(word in text for word in ["order", "purchase", "bought", "customer #", "order #"]):
        category = "business_order"
        tags = ["business", "order", "purchase", "customer"]
        is_business = True
    elif any(word in text for word in ["stock", "inventory", "warehouse", "qty", "quantity", "box", "boxes"]):
        category = "business_inventory_note"
        tags = ["business", "inventory", "stock", "qty"]
        is_business = True
    elif any(word in text for word in ["idea", "concept", "brainstorm", "innovate", "thought", "project idea"]):
        category = "idea"
        tags = ["idea", "concept", "thought"]
    elif any(word in text for word in ["phone", "email", "@", "address", "number", "contact"]):
        category = "contact_info"
        tags = ["contact", "info"]

    # 2. Entity Extraction
    prices = re.findall(r"(?:Rs\.?|INR|\$|€|£)\s?\d+(?:\.\d+)?", message_text)
    urls = re.findall(r"https?://[^\s]+", message_text)
    phone_numbers = re.findall(r"\+?\d[\d\s()\-]{7,}\d", message_text)
    phone_numbers = [p.strip() for p in phone_numbers if len(p.replace("-","").replace(" ","")) >= 10]
    
    # Due Date and Reminder Status Extraction
    due_date = None
    reminder_status = None
    
    # Try to extract explicit "due at YYYY-MM-DDTHH:MM" format
    match_dt = re.search(r"due at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2})", message_text)
    if match_dt:
        due_date = match_dt.group(1) + ":00Z"
        category = "task_reminder"
        reminder_status = "pending"
    else:
        # Also support standard YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM formats
        match_std = re.search(r"(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2})", message_text)
        if match_std:
            dt_str = match_std.group(1).replace(" ", "T")
            due_date = dt_str + ":00Z"
            category = "task_reminder"
            reminder_status = "pending"
            
    if category == "task_reminder":
        reminder_status = reminder_status or "pending"
    
    # Dates
    dates = []
    if timestamp:
        dates.append(timestamp)
    date_keywords = ["today", "tomorrow", "yesterday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "next week", "next month"]
    for kw in date_keywords:
        if kw in text:
            dates.append(kw)
            
    # Urgency
    urgency = "none"
    if any(w in text for w in ["urgent", "asap", "emergency", "immediately", "deadline"]):
        urgency = "high"
    elif any(w in text for w in ["soon", "important", "todo", "friday"]):
        urgency = "medium"

    # Simple summary
    words = message_text.split()
    summary = " ".join(words[:12]) + ("..." if len(words) > 12 else "")

    # Character-based language detector fallback
    language = "en"
    # Simple check for Tamil script characters
    if any(char in message_text for char in "அஆஇஈஉஊஎஏஐஒஓஔகஙசஞடணதநபமயரலவழளறன"):
        language = "ta"
    # Simple check for Devanagari (Hindi) script characters
    elif any(char in message_text for char in "अआइईउऊऋअआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह"):
        language = "hi"
        
    tag_str = " ".join([f"#{t}" for t in tags])
    pretty_cat = category.replace("business_", "").replace("_", " ").capitalize()
    
    if language == "ta":
        reply = f"📥 *MemoDrop-இல் சேமிக்கப்பட்டது!*\n\n*பிரிவு:* {pretty_cat}\n*சுருக்கம்:* {summary}\n*குறிச்சொற்கள்:* {tag_str}\n\nமீண்டும் பெற எப்போது வேண்டுமானாலும் கேளுங்கள்!"
    elif language == "hi":
        reply = f"📥 *MemoDrop में सहेजा गया!*\n\n*श्रेणी:* {pretty_cat}\n*सारांश:* {summary}\n*टैग:* {tag_str}\n\nइसे कभी भी पुनः प्राप्त करने के लिए कहें!"
    else:
        reply = f"📥 *Saved to MemoDrop!*\n\n*Category:* {pretty_cat}\n*Summary:* {summary}\n*Urgency:* {urgency.capitalize()}\n*Tags:* {tag_str}\n\nAsk me to retrieve it anytime!"

    return {
        "category": category,
        "summary": summary,
        "entities": {
            "dates": dates,
            "prices": prices,
            "urls": urls,
            "names": [],
            "locations": [],
            "phone_numbers": phone_numbers
        },
        "tags": tags,
        "due_date": due_date,
        "reminder_status": reminder_status,
        "urgency": urgency,
        "is_business_related": is_business,
        "language": language,
        "reply": reply
    }

def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    """
    Transcribes an audio file bytes using Groq Whisper.
    Auto-detects language (multilingual support).
    """
    if not groq_client:
        raise ValueError("Groq client not initialized (API key missing).")
    
    try:
        transcription = groq_client.audio.transcriptions.create(
            file=(filename, audio_bytes),
            model="whisper-large-v3"
        )
        return transcription.text
    except Exception as e:
        print(f"[Brain] Groq Whisper transcription call failed: {e}")
        raise e

def generate_query_response(query_text: str, search_results: list) -> str:
    """
    Generates a natural language search results response in the same language as the query.
    """
    if not groq_client or not search_results:
        return ""
        
    context = ""
    for i, match in enumerate(search_results, 1):
        context += f"Match {i}:\n"
        context += f"Content: {match.get('content')}\n"
        context += f"Category: {match.get('category')}\n"
        context += f"Summary: {match.get('summary')}\n"
        context += f"Urgency: {match.get('urgency')}\n\n"
        
    prompt = f"""You are the query responder for MemoDrop. A user has asked a question to recall their memories.
We found the following matching memories in the database:

MATCHING MEMORIES:
{context}

USER QUESTION: {query_text}

Generate a friendly response listing these matches. 
RULES:
1. Write the response in the SAME language as the USER QUESTION (e.g. Tamil, Hindi, English).
2. Summarize or list the matches clearly, displaying their content, category, and urgency.
3. If the user question is in Tamil, write all the helper text/intro/outro in Tamil. If in Hindi, write in Hindi.
4. Keep the original content of the match in its original script.
5. Keep it concise (max 150 words).

RESPONSE:"""

    try:
        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.2
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[Brain] Error generating query response: {e}")
        return ""

def generate_no_results_response(query_text: str) -> str:
    """
    Generates a 'no results found' response in the same language as the query.
    """
    if not groq_client:
        return f"❌ No memories found matching \"{query_text}\". Try rephrasing!"
        
    prompt = f"""You are MemoDrop. A user has asked a question to search their memories, but we found no matches in the database.
USER QUESTION: {query_text}

Write a polite 'No memories found matching [query]. Try rephrasing!' message.
RULES:
1. Write it in the SAME language as the USER QUESTION (e.g. Tamil, Hindi, English).
2. Keep it to a single sentence.

RESPONSE:"""
    try:
        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.2
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[Brain] Error generating no-results response: {e}")
        return f"❌ No memories found matching \"{query_text}\". Try rephrasing!"


def compare_quotes(query: str, quotes: list) -> dict:
    """
    Uses Groq LLM to compare a list of quote memories based on a user comparison query.
    Extracts structured fields (supplier, item, price, date) for each quote,
    and returns comparison results as JSON.
    """
    if not Config.GROQ_API_KEY or not quotes:
        return mock_compare_quotes(query, quotes)
        
    # Serialize matched quotes for the LLM
    context = ""
    for i, q in enumerate(quotes, 1):
        context += f"Quote {i}:\n"
        context += f"ID: {q.get('id')}\n"
        context += f"Content: {q.get('content')}\n"
        context += f"Summary: {q.get('summary')}\n"
        context += f"Date Saved: {q.get('created_at')}\n"
        ent = q.get("entities") or {}
        context += f"Entities: {json.dumps(ent)}\n\n"

    prompt = f"""You are the Business Intelligence Quote Comparator for MemoDrop.
A user is asking a price comparison or cheapest quote query. We have retrieved these matching quote memories from their database:

MATCHED QUOTES:
{context}

USER QUERY: {query}

Extract the details (Supplier, Item Description, Price, Date) from each quote, compare them, and return a JSON object with this exact structure:

{{
  "cheapest_supplier": "the name of the supplier that offered the lowest price for the item(s) queried",
  "cheapest_price": "the price that the cheapest supplier offered",
  "comparison_summary": "a single sentence or short paragraph comparing the quotes, mentioning who was cheapest and what other options were, written in the same language as the USER QUERY (e.g. English, Hindi, Tamil)",
  "table_data": [
    {{
      "supplier": "extracted supplier/company name",
      "item": "extracted item description (e.g. Cotton Roll Type A)",
      "price": "extracted price amount (e.g. Rs 120 / meter)",
      "date": "the date the quote was saved or offered (in YYYY-MM-DD format)"
    }}
  ]
}}

Rules:
- For each matched quote in the context, extract exactly one row in the 'table_data' array.
- Make sure to write the 'comparison_summary' in the same language as the USER QUERY (Tamil, Hindi, English, etc.).
- Ensure all prices are extracted accurately.
- Return ONLY the raw JSON object - no preamble, no markdown formatting (do not wrap in ```json), no postscript."""

    try:
        model = "llama-3.3-70b-versatile"
        try:
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                response_format={"type": "json_object"},
                temperature=0.0
            )
        except Exception:
            model = "llama-3.1-8b-instant"
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                response_format={"type": "json_object"},
                temperature=0.0
            )
            
        result = json.loads(response.choices[0].message.content)
        print(f"[Brain] Compare processed successfully by {model}.")
        return result
    except Exception as e:
        print(f"[Brain] Groq comparison call failed: {e}. Falling back to mock offline comparator.")
        return mock_compare_quotes(query, quotes)


def mock_compare_quotes(query: str, quotes: list) -> dict:
    """Mock rules-based comparator fallback when Groq is unavailable."""
    table_data = []
    
    for q in quotes:
        content = q.get("content", "")
        summary = q.get("summary", "")
        created_at = q.get("created_at", "")
        date_str = created_at[:10] if created_at else datetime.utcnow().strftime("%Y-%m-%d")
        
        supplier = "Unknown"
        item = summary or "Fabric Quote"
        price = "N/A"
        
        # Check if it was saved via Biz Quote form
        # format: "Business Quote Form: Supplier: {supplier}, Item: {item}, Price: {price}, Quantity: {qty}."
        match_form = re.search(r"Supplier:\s*(.*?),\s*Item:\s*(.*?),\s*Price:\s*(.*?),\s*Quantity:", content)
        if match_form:
            supplier = match_form.group(1).strip()
            item = match_form.group(2).strip()
            price = match_form.group(3).strip()
        else:
            # Try parsing from general text
            # Price
            match_price = re.search(r"(?:Rs\.?|INR|\$|€|£)\s?\d+(?:\.\d+)?", content)
            if match_price:
                price = match_price.group(0)
            
            # Supplier Name
            ent = q.get("entities") or {}
            names = ent.get("names") or []
            if names:
                supplier = names[0]
            elif "ramesh" in content.lower():
                supplier = "Ramesh Mills"
            else:
                match_supplier = re.search(r"([A-Za-z0-9\s]+)\s+(?:offered|quoted|supplier)", content)
                if match_supplier:
                    supplier = match_supplier.group(1).strip()
                    
        table_data.append({
            "supplier": supplier,
            "item": item,
            "price": price,
            "date": date_str,
            "raw_price": price
        })
        
    # Find cheapest
    cheapest_supplier = "N/A"
    cheapest_price = "N/A"
    min_val = float('inf')
    
    for item_row in table_data:
        p_str = item_row["raw_price"]
        # Extract digits
        digits = re.findall(r"\d+", p_str)
        if digits:
            try:
                val = float(digits[0])
                if val < min_val:
                    min_val = val
                    cheapest_supplier = item_row["supplier"]
                    cheapest_price = item_row["price"]
            except:
                pass
        # Clean temporary key
        del item_row["raw_price"]
        
    if cheapest_supplier != "N/A":
        comparison_summary = f"Cheapest quote is from {cheapest_supplier} at {cheapest_price}. A detailed comparison of all matching quotes is shown in the table below."
    else:
        comparison_summary = "Here is the comparison table of your saved quote records matching your query."
        
    return {
        "cheapest_supplier": cheapest_supplier,
        "cheapest_price": cheapest_price,
        "comparison_summary": comparison_summary,
        "table_data": table_data
    }


def classify_document_folder(text: str, filename: str = None) -> str:
    """
    Classifies document text sample using Groq LLM.
    Returns one of: 'Government & Legal', 'Business & Finance', 'Academic & Coursework', 'Personal'.
    """
    folders = ["Government & Legal", "Business & Finance", "Academic & Coursework", "Personal"]
    
    # Prepend filename to the text for robust classification (especially for scanned/image-only files)
    text_to_analyze = f"Filename: {filename or ''}\nContent: {text or ''}".strip()
    
    text_sample = text_to_analyze[:2000]
    if not text_sample or text_sample.lower().strip() in ["filename:", "filename: content:"]:
        return "Personal"
        
    if not Config.GROQ_API_KEY or not groq_client:
        print("[Brain] Groq API key missing. Using mock document folder classification.")
        return mock_classify_document_folder(text_sample)
        
    prompt = f"""You are a document classifier. Categorize the document based on its extracted text sample below.
Return exactly one category name from this list:
- Government & Legal (certificates, government forms, legal notices, tax documents, ID proofs)
- Business & Finance (invoices, supplier quotes, contracts, financial statements)
- Academic & Coursework (assignments, notes, research papers, certificates from university)
- Personal (anything that doesn't clearly fit above)

Rule: You must return ONLY the exact category name and nothing else. No explanation, no formatting.

TEXT SAMPLE:
{text_sample}
"""

    try:
        model = "llama-3.3-70b-versatile"
        try:
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                temperature=0.0
            )
        except Exception:
            model = "llama-3.1-8b-instant"
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                temperature=0.0
            )
            
        result = response.choices[0].message.content.strip()
        result = result.replace('"', '').replace("'", "").strip()
        
        for f in folders:
            if result.lower() == f.lower() or f.lower() in result.lower():
                return f
                
        return "Personal"
    except Exception as e:
        print(f"[Brain] Groq classification failed: {e}. Falling back to rule-based fallback.")
        return mock_classify_document_folder(text_sample)


def mock_classify_document_folder(text: str) -> str:
    """Rule-based mock classifier if Groq is unavailable."""
    text_lower = text.lower()
    
    gov_keywords = ["passport", "license", "certificate", "tax", "pan card", "aadhaar", "legal", "notice", "government", "voter id", "stamp duty"]
    if any(k in text_lower for k in gov_keywords):
        return "Government & Legal"
        
    biz_keywords = ["invoice", "receipt", "quote", "supplier", "purchase order", "po ", "statement", "contract", "agreement", "finance", "bill of", "payment"]
    if any(k in text_lower for k in biz_keywords):
        return "Business & Finance"
        
    acad_keywords = ["assignment", "coursework", "university", "college", "school", "lecture", "homework", "thesis", "research paper", "professor", "syllabus"]
    if any(k in text_lower for k in acad_keywords):
        return "Academic & Coursework"
        
    return "Personal"



import os
import sys
import json
from config import Config
import database
import brain

def run_tests():
    print("="*60)
    print("           MemoDrop Pipeline Validation Test")
    print("="*60)
    
    # 1. Config Validation
    print("\n[Step 1] Loading Configuration...")
    print(f"  GROQ_API_KEY: {'[SET]' if Config.GROQ_API_KEY else '[MISSING]'}")
    print(f"  GEMINI_API_KEY: {'[SET]' if Config.GEMINI_API_KEY else '[MISSING] (Embeddings fallback will be used)'}")
    print(f"  Database Mode: {'Supabase pgvector' if Config.USE_SUPABASE else 'SQLite Local Fallback'}")
    
    # 2. Database Initialization
    print("\n[Step 2] Initializing Storage...")
    try:
        database.init_db()
        print("  Database successfully initialized and migrated!")
    except Exception as e:
        print(f"  ERROR initializing database: {e}")
        sys.exit(1)
        
    # 3. Intent Routing Test
    print("\n[Step 3] Testing Intent Router...")
    test_messages = [
        ("Fabric Supplier cotton roll offer is Rs. 150/meter.", "dump"),
        ("what was the cotton roll quote?", "query"),
        ("Ramesh's order was broken, please refund.", "dump"),
        ("where was that saree link?", "query")
    ]
    
    router_success = True
    for msg, expected_intent in test_messages:
        print(f"  Analyzing: \"{msg}\"")
        try:
            result = brain.route_intent(msg)
            routed_intent = result.get("intent")
            print(f"    -> Routed to: {routed_intent} (Expected: {expected_intent})")
            if routed_intent != expected_intent:
                print(f"    WARNING: Mismatch! Routed as {routed_intent} but expected {expected_intent}")
                router_success = False
        except Exception as e:
            print(f"    ERROR: {e}")
            router_success = False
            
    if router_success:
        print("  Intent router tests completed successfully!")
        
    # 4. Dump Processing Test
    print("\n[Step 4] Testing Metadata & Entity Extraction...")
    dump_text = "Fabric Supplier offered cotton roll at Rs 120 per meter. Contact: 9876543210. Valid till next month."
    print(f"  Processing dump: \"{dump_text}\"")
    try:
        proc_result = brain.process_dump(dump_text, "text")
        print("  Extracted Structure:")
        print(json.dumps(proc_result, indent=4))
        
        category = proc_result.get("category")
        prices = proc_result.get("entities", {}).get("prices", [])
        phone_numbers = proc_result.get("entities", {}).get("phone_numbers", [])
        urgency = proc_result.get("urgency")
        is_biz = proc_result.get("is_business_related")
        
        print(f"    Category: {category} (Expected: business_supplier_quote)")
        print(f"    Prices: {prices} (Expected to contain 'Rs 120 per meter')")
        print(f"    Phone: {phone_numbers} (Expected to contain '9876543210')")
        print(f"    Urgency: {urgency} (Expected: none or low/medium/high)")
        print(f"    Is Business Related: {is_biz} (Expected: True)")
    except Exception as e:
        print(f"  ERROR processing dump: {e}")
        
    # 5. Database Save & Search Test
    print("\n[Step 5] Testing Storage and Retrieval (Search)...")
    try:
        # Generate dummy embedding (or real if API key exists)
        embedding = brain.generate_embedding(dump_text)
        
        # Save record
        print("  Saving mock memory record...")
        saved = database.add_memory(
            content=dump_text,
            summary=proc_result.get("summary", "Cotton roll quote"),
            intent="dump",
            category=proc_result.get("category", "business_supplier_quote"),
            entities=proc_result.get("entities", {}),
            tags=proc_result.get("tags", []),
            urgency=proc_result.get("urgency", "none"),
            is_business_related=proc_result.get("is_business_related", False),
            embedding=embedding
        )
        print(f"    Saved record ID: {saved.get('id')}")
        
        # Search record
        search_query = "cotton roll quote"
        print(f"  Searching for: \"{search_query}\"")
        
        query_embedding = brain.generate_embedding(search_query)
        results = database.search_memories(search_query, query_embedding, limit=3)
        
        print(f"  Search Results (Found {len(results)} matches):")
        for i, res in enumerate(results, 1):
            print(f"    {i}. [{res.get('category')}] {res.get('summary')}")
            print(f"       Content: \"{res.get('content')}\"")
            print(f"       Urgency: {res.get('urgency')}")
            print(f"       Business Related: {res.get('is_business_related')}")
            print(f"       Score/Similarity: {res.get('similarity')}")
            
    except Exception as e:
        print(f"  ERROR in storage/retrieval test: {e}")
        
    print("\n" + "="*60)
    print("            Validation Tests Completed!")
    print("="*60)

if __name__ == "__main__":
    run_tests()

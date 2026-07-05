import json
from config import Config
from supabase import create_client

def test_insert():
    print("="*60)
    print("         Supabase Connection & Insert Diagnostic")
    print("="*60)
    
    print(f"\n[1] Checking Config...")
    print(f"  URL: {Config.SUPABASE_URL}")
    print(f"  Key: {Config.SUPABASE_KEY[:10]}...{Config.SUPABASE_KEY[-10:] if Config.SUPABASE_KEY else ''}")
    
    if not Config.SUPABASE_URL or not Config.SUPABASE_KEY:
        print("ERROR: Supabase credentials missing in .env!")
        return

    try:
        print("\n[2] Connecting to Supabase...")
        client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
        print("  Successfully connected client!")
        
        # Build a test payload
        payload = {
            "content": "Test diagnostic quote from supplier.",
            "summary": "Test Quote",
            "intent": "dump",
            "category": "business_supplier_quote",
            "entities": {"prices": ["$100"]},
            "tags": ["test", "diagnostic"],
            "urgency": "low",
            "is_business_related": True
        }
        
        print("\n[3] Attempting database insert...")
        response = client.table("memories").insert(payload).execute()
        
        print("\n[SUCCESS] Insert completed successfully!")
        print("Response Data:")
        print(json.dumps(response.data, indent=2))
        
    except Exception as e:
        print("\n[FAILED] Insert failed with the following error:")
        print("-"*60)
        import traceback
        traceback.print_exc()
        print("-"*60)
        
    print("\n" + "="*60)

if __name__ == "__main__":
    test_insert()

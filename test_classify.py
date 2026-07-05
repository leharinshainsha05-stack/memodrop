import json
import brain
from config import Config

def test_link():
    url = "https://www.ciaoenergy.com/?utm_source=extension&utm_medium=click&utm_campaign=muzli"
    print("="*60)
    print("         MemoDrop Link Classification Test")
    print("="*60)
    print(f"Content: \"{url}\"")
    print(f"GROQ_API_KEY configured: {bool(Config.GROQ_API_KEY)}")
    
    # Run through the brain processor
    res = brain.process_dump(url, "text")
    print("\nExtraction Result:")
    print(json.dumps(res, indent=4))
    print("="*60)

if __name__ == "__main__":
    test_link()

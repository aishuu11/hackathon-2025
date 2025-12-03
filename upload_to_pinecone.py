import json
from pinecone import Pinecone

# ========= CONFIG =========
PINECONE_API_KEY = "pcsk_7RiVsb_EHC6WWgemh8MLnFaLzQMALcnF92RbPoCPNJAgbFRb648MqtWPvTRg31VcpXSa68"

# copy EXACTLY from the Pinecone UI (what you sent me)
INDEX_HOST = "https://nutrition-myths-386z0ub.svc.aped-4627-b74a.pinecone.io"

JSON_PATH = "nutrition_bot/nutrition_myths_dataset.json"
NAMESPACE = "default"

# If your field map during index creation is NOT 'text',
# change this to that name (e.g. "chunk_text").
EMBED_FIELD = "chunk_text"
# ==========================

# 1. Init Pinecone client and index
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(host=INDEX_HOST)

# 2. Load our myths dataset
with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

records = []

for item in data:
    combined_text = (
        f"Myth: {item['myth']}\n"
        f"Fact: {item['fact']}\n"
        f"Explanation: {item['explanation']}"
    )

    record = {
        "_id": item["id"],               # record id
        EMBED_FIELD: combined_text,      # this is what gets embedded
        # metadata we can use later
        "myth": item["myth"],
        "fact": item["fact"],
        "explanation": item["explanation"],
        "category": item.get("category"),
        "tags": item.get("tags"),
        "source_title": item.get("source_title"),
        "source_url": item.get("source_url"),
        "source_type": item.get("source_type"),
        "year": item.get("year"),
    }

    records.append(record)

# 3. Upload in batches
BATCH_SIZE = 50

for i in range(0, len(records), BATCH_SIZE):
    batch = records[i : i + BATCH_SIZE]
    index.upsert_records(NAMESPACE, batch)
    print(f"Uploaded {i + len(batch)}/{len(records)}")

print("✅ DONE – all myths uploaded to Pinecone!")

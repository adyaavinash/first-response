import re
import faiss
import numpy as np
import subprocess
import os
from sentence_transformers import SentenceTransformer
from utils.translation_service import translate_text
from ration_service import ration_all

embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

MODEL_NAME = os.getenv("OLLAMA_MODEL", "gpt-oss:20b")
MAIN_TIMEOUT = 600

INDEX_DIR = "../data/first_aid/faiss_index"
index = faiss.read_index(os.path.join(INDEX_DIR, "faiss.index"))
docs = np.load(os.path.join(INDEX_DIR, "docs.npy"), allow_pickle=True)

# --- Retrieval ---
def retrieve(query, k=3):
    q_embed = embedder.encode([query], convert_to_numpy=True)
    D, I = index.search(q_embed, k)
    return [docs[i] for i in I[0]]

# --- Run Ollama ---
def query_ollama(prompt, model=MODEL_NAME):
    try:
        result = subprocess.run(
            ["ollama", "run", model],
            input=prompt,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=MAIN_TIMEOUT
        )

        if result.returncode != 0:
            stderr = (result.stderr or "").strip()
            return f"⚠ Ollama returned non-zero exit code: {stderr}"

        output = (result.stdout or "").strip()
        return output or "⚠ No output from model."

    except subprocess.TimeoutExpired:
        return None
    except Exception as e:
        return f"⚠ Ollama exception: {e}"

# --- Clean answers ---
def clean_answer(answer_text: str) -> str:
    """
    Remove reasoning sections and keep only final steps/checklist.
    """
    # Keep only from first numbered step onwards
    match = re.search(r"(\n|^)\s*1[\.\)-]", answer_text)
    if match:
        answer_text = answer_text[match.start():]

    bad_patterns = [
        r"(?i)thinking.*",
        r"(?i)we must.*",
        r"(?i)the user wants.*",
        r"(?i)context.*",
        r"(?i)done thinking.*",
        r"(?i)let's.*"
    ]

    lines = []
    for line in answer_text.splitlines():
        if any(re.match(pat, line.strip()) for pat in bad_patterns):
            continue
        lines.append(line.strip())

    return "\n".join([l for l in lines if l])

def enforce_steps_only(answer_text: str) -> str:
    """
    Extra filter to ensure no reasoning slips through.
    """
    cleaned = clean_answer(answer_text)
    parts = cleaned.split("\n")
    final = []
    for line in parts:
        if any(x in line.lower() for x in ["thinking", "context", "user wants", "we must"]):
            continue
        final.append(line)
    return "\n".join(final[:20])  # cap length

# --- Table formatter ---
def format_as_table(answer_text: str):
    table_data = []

    if "stop bleeding" in answer_text.lower():
        table_data.append({
            "Action": "Stop bleeding",
            "How to do it": "Apply firm pressure with clean cloth/gauze",
            "What to avoid": "Removing shrapnel"
        })

    if "clean" in answer_text.lower() or "wash" in answer_text.lower():
        table_data.append({
            "Action": "Clean wound",
            "How to do it": "Wash skin gently, cover with gauze",
            "What to avoid": "Ointments, antiseptic sprays, ice"
        })

    if "elevate" in answer_text.lower():
        table_data.append({
            "Action": "Elevate limb",
            "How to do it": "Raise limb above body",
            "What to avoid": "None"
        })

    if "monitor" in answer_text.lower():
        table_data.append({
            "Action": "Monitor",
            "How to do it": "Watch for fever, swelling, pain",
            "What to avoid": "Delaying referral"
        })

    if "breath" in answer_text.lower() or "chest" in answer_text.lower():
        table_data.append({
            "Action": "Breathing/CPR",
            "How to do it": "Mouth-to-mouth, chest compressions",
            "What to avoid": "None"
        })

    return table_data

# --- Main pipeline ---
def ask_first_aid(question, target_lang="en"):
    try:
        q_en = translate_text(question, src=target_lang, dest="en")

        context_docs = retrieve(q_en, k=1)
        if not context_docs or all(d.strip() == "" for d in context_docs):
            return {
                "text": "⚠ No relevant info found in manuals. Please consult emergency guides.",
                "table": []
            }

        context = context_docs[0][:600]

        prompt = f"""
You are a humanitarian survival assistant.
Use ONLY the following context from WHO/Red Cross manuals to answer.

⚠️ IMPORTANT:
- Do NOT include your reasoning or thinking steps in the response.
- Write only the final, user-friendly first aid instructions.
- Use simple, clear steps that a stressed person in the field can follow.

Context:
{context}

User's question: {q_en}

Answer in {target_lang}, in simple numbered steps:
"""
        answer_en = query_ollama(prompt)
        answer_en = enforce_steps_only(answer_en)

        if not answer_en:
            return {
                "text": "⚠ The AI could not generate an answer. Please consult Red Cross first aid basics.",
                "table": []
            }

        answer_final = translate_text(answer_en, src="en", dest=target_lang)

        return {
            "text": answer_final,
            "table": format_as_table(answer_final)
        }

    except Exception as e:
        return {
            "text": f"⚠ Error in processing: {str(e)}",
            "table": []
        }

def explain_rationing(resources, people, days, target_lang="en"):
    ration_summary = []
    if "water_l" in resources:
        ration_summary.append(f"Water: {resources['water_l']} liters total")
    if "food_items" in resources:
        ration_summary.append(f"Food items: {resources['food_items']}")
    if "food_kcal" in resources:
        ration_summary.append(f"Food (calories): {resources['food_kcal']} kcal total")
    if "medicine_units" in resources:
        ration_summary.append(f"Medicine: {resources['medicine_units']} units")
    summary_text = "\n".join(ration_summary)

    prompt = f"""
You are a humanitarian survival assistant.
The following resources are available for {people} people over {days} days:

{summary_text}

⚠️ IMPORTANT:
- If only food items are listed, estimate approximate calories yourself (e.g., rice, rotis, lentils).
- Always calculate and suggest **per-person-per-day portions**.
- Keep the output in ≤6 short numbered steps, clear and friendly.
- Use simple, practical words (for stressed civilians).
- If resources are not enough, clearly say so and advise prioritizing children, elderly, and injured.

Answer in {target_lang}.
"""

    answer = query_ollama(prompt)
    return clean_answer(answer)







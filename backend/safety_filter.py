import re

#Blocked categories
BLOCKED_KEYWORDS = [
    # Weapons / violence
    "bomb", "explosive", "gun", "rifle", "pistol", "grenade", "missile",
    "molotov", "armament", "rocket", "how to build arms",
    "kill", "murder", "assassinate",

    # Harmful substances
    "poison", "toxic", "cyanide", "anthrax", "chemical weapon", "nerve gas",

    # Hacking / malware
    "ddos", "virus", "malware", "hack database", "backdoor", "keylogger"
]

def is_safe_query(query: str) -> bool:
    """
    Returns False if the query contains unsafe keywords.
    """
    q = query.lower()
    for word in BLOCKED_KEYWORDS:
        if re.search(rf"\b{re.escape(word)}\b", q):
            return False
    return True

def safety_check(query: str) -> dict:
    """
    Run safety filter on user queries.
    """
    if not is_safe_query(query):
        return {
            "safe": False,
            "message": "⚠️ This query is blocked for safety reasons. Please ask only survival, health, or aid-related questions."
        }
    return {"safe": True}

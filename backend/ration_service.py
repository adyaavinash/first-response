def ration_water(total_liters, people, days):
    """
    Simple water rationing logic.
    """
    daily = total_liters / (people * days)
    status = "⚠ Critical" if daily < 2 else "✅ Adequate"
    return {
        "resource": "Water",
        "per_person_per_day": round(daily, 2),
        "days": days,
        "status": status,
        "guideline": "Aim for 2.5–3L/day. Use sparingly if below."
    }


def ration_food(total_kcal, people, days):
    """
    Old food rationing logic (still useful if kcal known).
    """
    daily = total_kcal / (people * days)
    status = "⚠ Critical" if daily < 1800 else "✅ Adequate"
    return {
        "resource": "Food",
        "per_person_per_day": round(daily),
        "days": days,
        "status": status,
        "guideline": "Aim for ~2100 kcal/day. Prioritize children, elderly, injured."
    }


def ration_medicine(total_units, people, days):
    """
    Simple medicine rationing logic.
    """
    daily = total_units / (people * days)
    status = "⚠ Critical" if daily < 1 else "✅ Adequate"
    return {
        "resource": "Medicine",
        "per_person_per_day": round(daily, 1),
        "days": days,
        "status": status,
        "guideline": "Ensure priority for most vulnerable if supply limited."
    }


def ration_all(resources, people, days):
    """
    Generalized rationing that supports multiple resource types.
    - water_l: in liters
    - food_kcal: numeric calories (if known)
    - food_items: raw food descriptions (LLM will handle conversion later)
    - medicine_units: count of medicine doses/units
    """
    results = []

    if "water_l" in resources:
        results.append(ration_water(resources["water_l"], people, days))

    if "food_kcal" in resources:
        results.append(ration_food(resources["food_kcal"], people, days))

    if "food_items" in resources:
        results.append({
            "resource": "Food",
            "items": resources["food_items"],   
            "days": days,
            "status": "ℹ Needs Estimation",
            "guideline": "Food items will be interpreted and converted to kcal by the AI."
        })

    if "medicine_units" in resources:
        results.append(ration_medicine(resources["medicine_units"], people, days))

    return results




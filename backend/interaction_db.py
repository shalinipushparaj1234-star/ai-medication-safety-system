"""
DEMO / SAMPLE drug interaction data only.
This is NOT a real medical database and must never be used for real
clinical decisions. It exists purely to demonstrate the workflow.
"""

# key: frozenset of two medicine names (case-insensitive, stored lowercase)
# value: dict with risk level and explanation
INTERACTION_DB = {
    frozenset({"warfarin", "aspirin"}): {
        "risk": "HIGH",
        "description": "Combined use significantly increases the risk of bleeding.",
    },
    frozenset({"warfarin", "ibuprofen"}): {
        "risk": "HIGH",
        "description": "NSAIDs with warfarin increase bleeding risk.",
    },
    frozenset({"metformin", "alcohol"}): {
        "risk": "MEDIUM",
        "description": "May increase risk of lactic acidosis and low blood sugar.",
    },
    frozenset({"lisinopril", "potassium chloride"}): {
        "risk": "HIGH",
        "description": "Risk of dangerously high potassium levels (hyperkalemia).",
    },
    frozenset({"simvastatin", "clarithromycin"}): {
        "risk": "HIGH",
        "description": "Increased risk of muscle toxicity (rhabdomyolysis).",
    },
    frozenset({"sertraline", "tramadol"}): {
        "risk": "HIGH",
        "description": "Combined use raises risk of serotonin syndrome.",
    },
    frozenset({"amoxicillin", "methotrexate"}): {
        "risk": "MEDIUM",
        "description": "May increase methotrexate levels and toxicity.",
    },
    frozenset({"omeprazole", "clopidogrel"}): {
        "risk": "MEDIUM",
        "description": "May reduce the antiplatelet effect of clopidogrel.",
    },
    frozenset({"paracetamol", "warfarin"}): {
        "risk": "LOW",
        "description": "Occasional use is generally safe; frequent high-dose use may mildly increase INR.",
    },
    frozenset({"ibuprofen", "lisinopril"}): {
        "risk": "MEDIUM",
        "description": "NSAIDs may reduce the blood-pressure-lowering effect and affect kidney function.",
    },
    frozenset({"metformin", "ibuprofen"}): {
        "risk": "LOW",
        "description": "Occasional NSAID use has a mild potential effect on kidney function in some patients.",
    },
}

# Demo list of medicines the system "knows about", used for the add-prescription
# suggestion dropdown in the frontend.
KNOWN_MEDICINES = sorted(
    {"Warfarin", "Aspirin", "Ibuprofen", "Metformin", "Alcohol (use disclosed by patient)",
     "Lisinopril", "Potassium Chloride", "Simvastatin", "Clarithromycin",
     "Sertraline", "Tramadol", "Amoxicillin", "Methotrexate", "Omeprazole",
     "Clopidogrel", "Paracetamol"}
)


def check_pairwise_interactions(medicine_names):
    """
    medicine_names: list of strings (as entered by doctors, mixed case ok)
    returns list of dicts: {medicine_a, medicine_b, risk, description}
    """
    normalized = [m.strip().lower() for m in medicine_names if m and m.strip()]
    unique_meds = list(dict.fromkeys(normalized))  # preserve order, dedupe
    hits = []

    for i in range(len(unique_meds)):
        for j in range(i + 1, len(unique_meds)):
            pair = frozenset({unique_meds[i], unique_meds[j]})
            if pair in INTERACTION_DB:
                info = INTERACTION_DB[pair]
                hits.append({
                    "medicine_a": unique_meds[i].title(),
                    "medicine_b": unique_meds[j].title(),
                    "risk": info["risk"],
                    "description": info["description"],
                })
    return hits


def find_duplicates(medicine_names):
    """Flag the same medicine prescribed more than once (possibly by different doctors)."""
    seen = {}
    duplicates = []
    for m in medicine_names:
        key = m.strip().lower()
        if not key:
            continue
        seen[key] = seen.get(key, 0) + 1
    for name, count in seen.items():
        if count > 1:
            duplicates.append(name.title())
    return duplicates
"""
Mock AI agents for the medication safety workflow.

These are rule-based "mock" agents so the project runs fully offline,
with no external LLM API required. Each agent returns a plain-text
report. A real deployment could swap these functions for LLM calls
while keeping the same interfaces.

IMPORTANT SAFETY PRINCIPLE:
These agents only ANALYSE and RECOMMEND. Nothing here changes,
stops, or prescribes medication. A human doctor/pharmacist must
approve or reject the recommendation (see main.py review endpoint).
"""

from interaction_db import check_pairwise_interactions, find_duplicates

RISK_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}


def overall_risk_from_hits(interaction_hits, has_allergy_conflict):
    if has_allergy_conflict:
        return "HIGH"
    if not interaction_hits:
        return "LOW"
    highest = max(interaction_hits, key=lambda h: RISK_ORDER[h["risk"]])
    return highest["risk"]


def check_allergy_conflicts(medicine_names, allergies_str):
    """Very simple demo check: flags a medicine if its name matches a listed allergy."""
    allergies = [a.strip().lower() for a in allergies_str.split(",") if a.strip()]
    conflicts = []
    for med in medicine_names:
        for allergy in allergies:
            if allergy and allergy in med.lower():
                conflicts.append({"medicine": med, "allergy": allergy})
    return conflicts


def guardian_agent(patient, prescriptions):
    """Guardian/Medication Safety Agent: scans consolidated profile for risks."""
    medicine_names = [p.medicine_name for p in prescriptions]
    interaction_hits = check_pairwise_interactions(medicine_names)
    duplicates = find_duplicates(medicine_names)
    allergy_conflicts = check_allergy_conflicts(medicine_names, patient.allergies or "")

    lines = []
    lines.append(f"Scanned {len(medicine_names)} medicine(s) across "
                  f"{len({p.doctor_name for p in prescriptions})} prescriber(s).")

    if interaction_hits:
        lines.append(f"Detected {len(interaction_hits)} potential drug-drug interaction(s):")
        for h in interaction_hits:
            lines.append(f"  - [{h['risk']}] {h['medicine_a']} + {h['medicine_b']}: {h['description']}")
    else:
        lines.append("No known drug-drug interactions found in the demo interaction database.")

    if duplicates:
        lines.append(f"Duplicate medication(s) detected across prescriptions: {', '.join(duplicates)}.")

    if allergy_conflicts:
        lines.append("Possible allergy conflict(s) detected:")
        for c in allergy_conflicts:
            lines.append(f"  - {c['medicine']} conflicts with declared allergy '{c['allergy']}'.")

    report = "\n".join(lines)
    risk = overall_risk_from_hits(interaction_hits, bool(allergy_conflicts))
    if duplicates and risk == "LOW":
        risk = "MEDIUM"

    return {
        "report": report,
        "interaction_hits": interaction_hits,
        "duplicates": duplicates,
        "allergy_conflicts": allergy_conflicts,
        "risk": risk,
    }


def physician_agent(patient, guardian_result):
    """Physician Agent: reviews clinical context (age, conditions) around the detected risk."""
    lines = []
    conditions = [c.strip() for c in (patient.conditions or "").split(",") if c.strip()]

    if guardian_result["risk"] == "LOW" and not guardian_result["interaction_hits"]:
        lines.append("From a clinical-context standpoint, no immediate concerns are raised by the "
                      "current medication combination.")
    else:
        lines.append(f"Reviewing findings in the context of patient profile "
                      f"(age: {patient.age or 'unknown'}, gender: {patient.gender or 'unknown'}).")
        if conditions:
            lines.append(f"Relevant existing condition(s) on record: {', '.join(conditions)}. "
                          "These should be factored into any dosage or alternative-medicine decision.")
        else:
            lines.append("No pre-existing conditions on record; risk assessment is based on medication "
                          "profile alone.")

        for h in guardian_result["interaction_hits"]:
            if h["risk"] == "HIGH":
                lines.append(f"Clinical note: the {h['medicine_a']} + {h['medicine_b']} interaction is "
                              "clinically significant and warrants prompt review before the next dose.")
            elif h["risk"] == "MEDIUM":
                lines.append(f"Clinical note: the {h['medicine_a']} + {h['medicine_b']} interaction "
                              "should be monitored; consider spacing doses or lab monitoring.")

        if guardian_result["allergy_conflicts"]:
            lines.append("Allergy conflict(s) require immediate clarification with the patient before "
                          "continuing therapy.")

    lines.append("Recommendation: route to Pharmacist/Medical Review Agent for alternative and "
                  "dosage-related considerations, then to a human doctor for final approval.")
    return "\n".join(lines)


def pharmacist_agent(patient, guardian_result):
    """Pharmacist/Medical Review Agent: comments on safety, alternatives, dosage considerations."""
    lines = []
    if not guardian_result["interaction_hits"] and not guardian_result["duplicates"] \
            and not guardian_result["allergy_conflicts"]:
        lines.append("No pharmacist-level concerns identified. Standard dispensing guidance applies.")
    else:
        if guardian_result["interaction_hits"]:
            lines.append("Suggested pharmacist considerations:")
            for h in guardian_result["interaction_hits"]:
                if h["risk"] == "HIGH":
                    lines.append(f"  - Consider an alternative to one of ({h['medicine_a']}, "
                                  f"{h['medicine_b']}), or ensure close monitoring if both are clinically necessary.")
                elif h["risk"] == "MEDIUM":
                    lines.append(f"  - Consider dose adjustment or timing separation for "
                                  f"{h['medicine_a']} and {h['medicine_b']}.")
                else:
                    lines.append(f"  - Low-risk combination ({h['medicine_a']} + {h['medicine_b']}); "
                                  "advise patient on symptoms to watch for.")
        if guardian_result["duplicates"]:
            lines.append(f"  - Confirm with prescribers whether duplicate therapy of "
                          f"{', '.join(guardian_result['duplicates'])} is intentional (e.g., dose split) "
                          "or a reconciliation error.")
        if guardian_result["allergy_conflicts"]:
            lines.append("  - Do NOT dispense conflicting medication until allergy status is confirmed "
                          "with the patient and prescriber.")

    lines.append("This is a demo/mock pharmacist assessment for prototype purposes only, based on a "
                  "sample interaction database - not a substitute for a licensed pharmacist review.")
    return "\n".join(lines)


def coordinator_agent(patient, guardian_result, physician_report, pharmacist_report):
    """Coordinator Agent: combines everything into one explainable recommendation."""
    risk = guardian_result["risk"]

    if risk == "HIGH":
        headline = ("HIGH RISK: one or more serious medication conflicts were detected. "
                     "Human doctor/pharmacist review is strongly recommended before continuing "
                     "or dispensing any of the flagged medicines.")
    elif risk == "MEDIUM":
        headline = ("MEDIUM RISK: potential medication concerns were detected that should be "
                     "reviewed and possibly adjusted (dosage/timing/alternative) by a clinician.")
    else:
        headline = ("LOW RISK: no significant conflicts were detected in the demo interaction "
                     "database. Routine review is still advised as standard practice.")

    recommendation = (
        f"{headline}\n\n"
        f"Guardian Agent findings, Physician Agent clinical context, and Pharmacist Agent "
        f"safety/alternative considerations have been compiled below for human review.\n\n"
        f"IMPORTANT: This is an AI-generated recommendation only. No medication has been "
        f"automatically changed, stopped, or prescribed. Final action requires approval by an "
        f"authorized doctor or pharmacist."
    )
    return recommendation, risk
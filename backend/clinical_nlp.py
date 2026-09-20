import re
import os
import json
import httpx
from typing import Optional, Dict, Any

def heuristic_parse_patient_voice(transcript: str, age: Optional[int] = None, gender: Optional[str] = None) -> Dict[str, Any]:
    """
    Robust heuristic NLP parser for colloquial Indian patient complaints in Hindi, Hinglish, and English.
    Translates raw patient colloquial speech into standardized clinical OPD terms.
    """
    clean = transcript.strip()
    lower = clean.lower()

    # 1. Extract duration if present (support English, Hinglish & Devanagari)
    duration = ""
    dur_match = re.search(r'(\d+|do|teen|char|panch|ek|two|three|four|five|एक|दो|तीन|चार|पाँच|1|2|3|4|5)\s*(?:din|दिन|days?|mahine|महीने|months?|hafte|हफ्ते|weeks?)', lower)
    if dur_match:
        dur_raw = dur_match.group(0)
        dur_norm = dur_raw.replace("do", "2").replace("दो", "2").replace("teen", "3").replace("तीन", "3").replace("char", "4").replace("चार", "4").replace("panch", "5").replace("पाँच", "5").replace("ek", "1").replace("एक", "1").replace("din", "days").replace("दिन", "days")
        duration = f"x {dur_norm}"

    # 2. Symptom Mapping (Hindi, Hinglish, Colloquial English)
    detected_symptoms = []
    
    # Hair Fall / Dandruff / Scalp Issues (Trichology & Dermatology)
    has_hair_fall = any(k in lower for k in [
        "baal", "ball", "hair", "hairfall", "hair fall", "hair loss", "alopecia",
        "toot rahe", "toot raha", "toot rhe", "jhad rahe", "jhad raha", "jhad rhe",
        "jharna", "gir rahe", "gir raha", "बाल", "झड़ना", "टूटना"
    ]) and not any(k in lower for k in ["badan toot", "ang toot", "sharir toot"])
    
    has_dandruff = any(k in lower for k in [
        "dandruff", "rusi", "roosi", "रूसी", "डैंड्रफ", "flaking", "white flakes",
        "khujli in head", "scalp", "seborrhea"
    ])

    if has_hair_fall and has_dandruff:
        detected_symptoms.append(f"Excessive Hair Fall (Telogen Effluvium) with Severe Scalp Dandruff (Seborrheic Dermatitis) {duration}".strip())
    elif has_hair_fall:
        detected_symptoms.append(f"Excessive Hair Fall / Diffuse Shedding (Telogen Effluvium) {duration}".strip())
    elif has_dandruff:
        detected_symptoms.append(f"Scalp Pruritus & Dandruff (Seborrheic Dermatitis) {duration}".strip())

    # Fever / Pyrexia
    if any(k in lower for k in ["fever", "bukhar", "bukhaar", "tap", "ताप", "बुखार", "temperature", "garam"]):
        comp = f"Pyrexia / High Grade Fever {duration}".strip()
        detected_symptoms.append(comp)

    # Cold / Rhinorrhea / Sore Throat
    if any(k in lower for k in ["cold", "sardi", "jukham", "zukham", "जुकाम", "सर्दी", "rhinorrhea", "running nose", "chheenk", "sneezing"]):
        detected_symptoms.append("Cold & Rhinorrhea")
    if any(k in lower for k in ["gala", "gale", "sore throat", "throat pain", "kharash", "kharaash", "गले", "गला"]):
        detected_symptoms.append("Pharyngitis / Sore Throat")

    # Cough / Balgam
    if any(k in lower for k in ["cough", "khasi", "khansi", "खांसी", "balgam", "phlegm", "dhans"]):
        if any(k in lower for k in ["balgam", "productive", "wet", "mucus"]):
            detected_symptoms.append("Productive Cough with Expectoration")
        else:
            detected_symptoms.append("Cough (Irritant / Productive)")

    # Headache / Cephalalgia
    if any(k in lower for k in [
        "sar dard", "sardard", "sir dard", "सिरदर्द", "सर दर्द", "headache", "matha dard", "cephalea",
        "sar me", "sir me", "सर में", "सिर में"
    ]) and any(w in lower for w in ["dard", "दर्द", "headache", "sar", "sir"]):
        detected_symptoms.append("Severe Cephalalgia (Headache)")

    # Body pain / Myalgia (excluding hair toot rahe)
    if any(k in lower for k in ["body pain", "body ache", "badan dard", "badan me", "hath pair", "myalgia", "badan toot", "ang toot"]):
        detected_symptoms.append("Generalized Myalgia / Bodyache")

    # Skin / Dermatology / Allergy
    if any(k in lower for k in ["khujli", "itching", "rash", "daana", "daane", "chhate", "allergy", "fungal", "daaj", "daad", "ringworm", "खुजली", "चकत्ते"]) and not has_hair_fall and not has_dandruff:
        detected_symptoms.append("Pruritic Erythematous Skin Lesions / Dermatitis")

    # Orthopedic / Joint Pain
    if any(k in lower for k in ["ghutne", "ghutna", "joint pain", "jod dard", "kamar dard", "back pain", "sandhiwat", "arthritis", "घुटने", "कमर दर्द", "जोड़ों में दर्द", "gardan dard", "neck pain"]):
        detected_symptoms.append("Arthralgia / Mechanical Low Back Pain")

    # Abdominal / Gastric
    if any(k in lower for k in ["pet dard", "stomach ache", "stomach pain", "pet me", "पेट दर्द", "cramps", "gas", "acidity"]):
        detected_symptoms.append("Abdominal Colic / Epigastric Pain")
    if any(k in lower for k in ["vomiting", "ulti", "उल्टी", "nausea", "jee ghabrana"]):
        detected_symptoms.append("Nausea & Vomiting")
    if any(k in lower for k in ["loose motion", "dast", "दस्त", "diarrhea", "potty"]):
        detected_symptoms.append("Acute Diarrhea / Loose Stools")

    # Respiratory / Dyspnea
    if any(k in lower for k in ["saans", "saas", "breath", "dum", "shortness of breath", "chhati", "chest pain"]):
        detected_symptoms.append("Dyspnea / Chest Tightness")

    # Weakness / Dizziness
    if any(k in lower for k in ["kamzori", "weakness", "chakkar", "कमजोरी", "fatigue", "lethargy"]):
        detected_symptoms.append("General Asthenia & Fatigue")

    # Chills / Shivering
    if any(k in lower for k in ["thand", "chills", "shivering", "kaanp"]):
        detected_symptoms.append("Chills & Rigors")

    # Fallback if no specific keyword triggered
    if not detected_symptoms:
        detected_symptoms.append(clean[:100])

    chief_complaints_str = ", ".join(detected_symptoms)

    # 3. Determine Working Diagnosis
    has_fever = any("Fever" in s or "Pyrexia" in s for s in detected_symptoms)
    has_resp = any("Cough" in s or "Cold" in s or "Sore Throat" in s or "Rhinorrhea" in s or "Dyspnea" in s for s in detected_symptoms)
    has_gi = any("Abdominal" in s or "Diarrhea" in s or "Vomiting" in s for s in detected_symptoms)
    has_hair = has_hair_fall or has_dandruff or any("Hair" in s or "Dandruff" in s for s in detected_symptoms)
    has_skin = any("Dermatitis" in s or "Lesions" in s for s in detected_symptoms)
    has_joint = any("Arthralgia" in s or "Back Pain" in s for s in detected_symptoms)

    if has_hair:
        if has_hair_fall and has_dandruff:
            dx = "Telogen Effluvium with Seborrheic Dermatitis of Scalp (Dandruff & Hair Fall)"
        elif has_hair_fall:
            dx = "Telogen Effluvium / Diffuse Hair Loss (Suspected Nutritional / Telogen Phase)"
        else:
            dx = "Seborrheic Dermatitis of Scalp (Severe Dandruff & Flaking)"
    elif has_skin:
        dx = "Allergic Contact Dermatitis / Superficial Fungal Infection"
    elif has_joint:
        dx = "Degenerative Osteoarthritis / Mechanical Lumbago"
    elif has_fever and has_resp:
        dx = "Acute Upper Respiratory Tract Infection (URTI) with Febrile Illness"
    elif has_resp:
        dx = "Acute Bronchitis / Rhinopharyngitis"
    elif has_gi:
        dx = "Acute Gastroenteritis / Gastrointestinal Infection"
    elif has_fever:
        dx = "Acute Febrile Illness (Suspected Viral Pyrexia)"
    else:
        dx = "Symptomatic Acute Consultation"

    # 4. Medication Recommendations (Standard Indian OPD Protocols)
    meds = []
    
    if has_hair:
        # Trichology / Dermatology Plan (NO antacids!)
        if has_dandruff or "Dandruff" in chief_complaints_str:
            meds.append(f"{len(meds)+1}. Scalpe+ / Nizral Shampoo (Ketoconazole 2% + ZPTO) — Apply to wet scalp, massage gently and leave for 5 minutes before rinsing. Use 2-3 times a week for 4 weeks")
        if has_hair_fall or "Hair" in chief_complaints_str:
            meds.append(f"{len(meds)+1}. Tab Keraglo-Eva / Tab Follihair (Biotin 10mg + Amino Acids + Zinc + Multivitamins) — 1 Tablet Daily after breakfast (OD) for 60 Days")
        if "khujli" in lower or "itching" in lower:
            meds.append(f"{len(meds)+1}. Tab Levocetirizine 5mg — 1 Tablet At Bedtime (HS) SOS for 5 Days for scalp itching")

    elif has_skin:
        meds.append(f"{len(meds)+1}. Tab Levocetirizine 5mg — Once Daily (OD), At Bedtime (HS) for 7 Days")
        meds.append(f"{len(meds)+1}. Luliconazole 1% Cream (Lulifin) — Apply thinly to affected areas Twice Daily (BD) for 2 Weeks")

    elif has_joint:
        meds.append(f"{len(meds)+1}. Tab ZeroDol-P (Aceclofenac 100mg + Paracetamol 325mg) — Twice Daily (BD), After Meals for 5 Days")
        meds.append(f"{len(meds)+1}. Tab Pan 40mg (Pantoprazole) — Once Daily (OD), Before Breakfast for 5 Days (Gastroprotection with NSAID)")
        meds.append(f"{len(meds)+1}. Tab Shelcal 500 (Calcium 500mg + Vitamin D3) — Once Daily (OD), After Dinner for 30 Days")

    else:
        # General Medical OPD
        if has_fever or "Headache" in chief_complaints_str or "Bodyache" in chief_complaints_str:
            meds.append(f"{len(meds)+1}. Tab Dolo 650mg (Paracetamol) — Thrice Daily (TID), After Meals for 3 Days (SOS if Temp > 99.5°F)")
        
        if has_resp:
            meds.append(f"{len(meds)+1}. Tab Montair-LC (Montelukast + Levocetirizine) — Once Daily (OD), At Bedtime (HS) for 5 Days")
            meds.append(f"{len(meds)+1}. Syp Ascoril-D / Grilinctus — 10 ml Thrice Daily (TID), After Food for 5 Days")

        if has_gi:
            meds.append(f"{len(meds)+1}. Tab Norflox-TZ (Norfloxacin + Tinidazole) — Twice Daily (BD), After Meals for 5 Days")
            meds.append(f"{len(meds)+1}. Tab Pan-D (Pantoprazole + Domperidone) — Once Daily (OD), Empty Stomach in Morning for 5 Days")
            meds.append(f"{len(meds)+1}. Electral ORS Sachet — Dissolve 1 sachet in 1 Litre boiled cooled water, sip frequently")

        # Prescribe PPI only if gastric discomfort or explicitly symptomatic
        if ("acidity" in lower or "gas" in lower or "pet dard" in lower or "heartburn" in lower) and not has_gi:
            meds.append(f"{len(meds)+1}. Tab Pan 40mg (Pantoprazole) — Once Daily (OD), Empty Stomach in Morning for 5 Days")

    # 5. Diagnostic Tests
    tests = []
    if has_hair:
        tests.append("1. Serum Ferritin & Iron Studies (Total Iron Binding Capacity - TIBC)")
        tests.append("2. Thyroid Profile (TSH, Free T3, Free T4)")
        tests.append("3. Vitamin D3 & Vitamin B12 Levels")
        tests.append("4. Complete Blood Count (CBC) with Peripheral Smear")
    elif has_skin:
        tests.append("1. Skin Scraping for KOH Mount (Fungal screen)")
        tests.append("2. Random Blood Sugar (RBS)")
    elif has_joint:
        tests.append("1. Digital X-Ray of Affected Joint / Lumbar Spine AP & Lat")
        tests.append("2. Serum Uric Acid & Vitamin D3")
    else:
        if has_fever:
            tests.append("1. Complete Blood Count (CBC) with Platelet Count")
            if "2 days" in duration or "3 days" in duration or "4 days" in duration or "5 days" in duration:
                tests.append("2. Dengue NS1 Antigen & Serology (If fever persists > 48h)")
        if has_resp and ("Cough" in chief_complaints_str or "Chest" in chief_complaints_str):
            tests.append(f"{len(tests)+1}. Chest X-Ray PA View (If chest congestion persists)")
        if has_gi:
            tests.append(f"{len(tests)+1}. Stool Routine & Microscopy")

    if not tests:
        tests.append("1. Complete Blood Count (CBC)")

    # 6. Advice & Supportive Care
    if has_hair:
        advice = [
            "1. Wash scalp with Ketoconazole 2% shampoo 2-3 times weekly; leave lather for 5 minutes before rinsing with lukewarm water",
            "2. Avoid vigorous fingernail scratching of scalp, hot water baths, and tight tying of hair",
            "3. Consume a high-protein, nutrient-dense diet (sprouts, dal, paneer, eggs, seeds, and leafy greens) with 2.5-3L water daily",
            "4. Avoid harsh chemical styling products, hair dryers, or heavy scented oils until active shedding subsides"
        ]
        follow_up = "Review in OPD / Dermatology after 4 weeks, or earlier if scalp erythema, flaking, or shedding worsens"
    elif has_skin:
        advice = [
            "1. Keep affected skin clean and dry; strictly avoid over-the-counter steroid creams",
            "2. Wear loose, breathable cotton clothes; avoid synthetic fabrics",
            "3. Wash clothes and towels in hot water; avoid sharing personal items",
            "4. Avoid scratching to prevent secondary bacterial infection"
        ]
        follow_up = "Review in Dermatology OPD after 2 weeks"
    elif has_joint:
        advice = [
            "1. Hot fermentation on affected joints twice daily for 15 minutes",
            "2. Avoid squatting on floor, cross-legged sitting, and heavy lifting",
            "3. Daily gentle quadriceps / back strengthening physiotherapy exercises as tolerated",
            "4. Maintain healthy body weight to reduce joint load"
        ]
        follow_up = "Review in Orthopedics OPD after 2 weeks with X-Ray reports"
    elif has_gi:
        advice = [
            "1. Drink plenty of ORS solution, boiled cooled water, and clear coconut water to prevent dehydration",
            "2. Consume light, bland meals (khichdi, curd, toast); strictly avoid spicy, oily, or raw street food",
            "3. Adequate bed rest; continue prescribed medications without skipping doses",
            "4. Seek immediate emergency care if high fever, severe dehydration, or persistent vomiting occurs"
        ]
        follow_up = "Review in OPD after 2-3 days, or immediately if symptoms worsen"
    else:
        advice = [
            "1. Drink plenty of warm water and clear fluids; maintain high hydration",
            "2. Warm saline gargles and steam inhalation twice daily (if throat/chest congested)",
            "3. Complete bed rest for 2-3 days; avoid cold, refrigerated, or oily foods",
            "4. Sponge with lukewarm water if body temperature rises above 101°F"
        ]
        follow_up = "Review in OPD after 3 days, or immediately if fever > 102°F, breathlessness, or persistent vomiting occurs"

    has_devanagari = bool(re.search(r'[\u0900-\u097F]', clean)) or any(k in lower for k in ["hai", "tha", "ho", "raha", "mere", "mujhe", "pichle", "dard", "bukhar", "khasi", "zukham", "sardi", "din", "se", "aur", "baal", "ball", "toot"])
    detected_lang = "Hindi (हिंदी / Hinglish)" if has_devanagari else "English"

    return {
        "chief_complaints": chief_complaints_str,
        "diagnosis": dx,
        "medicines_list": "\n".join(meds),
        "tests_list": "\n".join(tests),
        "advice": "\n".join(advice),
        "follow_up_date": follow_up,
        "patient_verbatim": f"मरीज़ का मूल कथन: \"{clean}\"",
        "detected_language": detected_lang,
        "source": "heuristic"
    }


async def parse_consultation_ai(
    transcript: str,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    mode: str = "patient_voice"
) -> Dict[str, Any]:
    """
    Extracts structured clinical OPD prescription fields from natural conversational speech.
    Uses Groq LLM when available, falling back gracefully to heuristic Indian clinical rules.
    """
    clean_transcript = transcript.strip()
    if not clean_transcript:
        return heuristic_parse_patient_voice("")

    api_key = os.getenv("GROQ_API_KEY")

    if api_key:
        prompt = f"""You are an expert Indian clinical prescribing assistant in a busy multi-specialty hospital OPD.
An Indian OPD patient (or attending doctor) has spoken their natural medical complaints in colloquial Hindi, Hinglish, or English:
\"{clean_transcript}\"

Patient Demographics:
- Age: {age or 'Not specified'}
- Gender: {gender or 'Not specified'}

Note on Indian colloquial Hinglish phonetics:
- "ball" / "baal" refers to Hair (बाल / Kesh). "ball toot rahe / jhad rahe" = excessive hair fall / breakage (Telogen Effluvium).
- "dandruff" / "rusi" = seborrheic dermatitis / scalp flakes.
- "pet dard / kharab" = abdominal colic / gastroenteritis.
- "gala" = pharynx / sore throat.
- "sar / sir" = cephalalgia / headache.

TASK:
Accurately analyze the patient's complaints and convert them into standard Indian OPD clinical records without requiring the doctor to re-type:
1. "chief_complaints": Clinical English medical terminology with duration (e.g., "Excessive Hair Loss (Telogen Effluvium), Severe Scalp Dandruff (Seborrheic Dermatitis)" or "Pyrexia (High fever) x 2 days, Cold & Rhinorrhea")
2. "diagnosis": Likely working clinical diagnosis (e.g., "Telogen Effluvium with Seborrheic Dermatitis of Scalp" or "Acute Upper Respiratory Tract Infection (URTI)")
3. "medicines_list": Numbered list with appropriate Indian brand/generic medicines, exact dosage, timing, and duration tailored specifically to the patient's condition. (For example, for hair loss & dandruff: Ketoconazole 2% Shampoo 2-3 times a week, Biotin 10mg + Zinc tablet once daily; DO NOT prescribe antacids/Pantoprazole unless gastrointestinal complaints or NSAIDs are present).
4. "tests_list": Numbered list of essential diagnostic tests (e.g., Serum Ferritin, Thyroid Profile TSH, Vitamin D3/B12, CBC).
5. "advice": Numbered clinical lifestyle, diet, and hygiene advice tailored to the diagnosis.
6. "follow_up_date": Specific follow-up timeframe (e.g., "Review in OPD after 4 weeks").
7. "patient_verbatim": Format as: "मरीज़ का मूल कथन: \\"{clean_transcript}\\""

Return ONLY a valid JSON object matching:
{{
  "chief_complaints": "...",
  "diagnosis": "...",
  "medicines_list": "...",
  "tests_list": "...",
  "advice": "...",
  "follow_up_date": "...",
  "patient_verbatim": "..."
}}"""

        preferred_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        # List of models to try in order of priority starting with user's configured model
        candidate_models = [preferred_model, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "groq/compound-mini"]
        models_to_try = []
        for m in candidate_models:
            if m and m not in models_to_try:
                models_to_try.append(m)

        for model in models_to_try:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                        json={
                            "model": model,
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": 0.1,
                            "response_format": {"type": "json_object"}
                        }
                    )
                    if res.status_code == 200:
                        data = json.loads(res.json()["choices"][0]["message"]["content"])
                        return {
                            "chief_complaints": data.get("chief_complaints"),
                            "diagnosis": data.get("diagnosis"),
                            "medicines_list": data.get("medicines_list"),
                            "tests_list": data.get("tests_list"),
                            "advice": data.get("advice"),
                            "follow_up_date": data.get("follow_up_date"),
                            "patient_verbatim": data.get("patient_verbatim") or f"मरीज़ का मूल कथन: \"{clean_transcript}\"",
                            "detected_language": "Hindi (हिंदी / Hinglish)" if any(k in clean_transcript.lower() for k in ["hai", "tha", "ho", "raha", "mere", "mujhe", "pichle", "dard", "bukhar", "ball", "baal", "toot"]) else "English",
                            "source": "ai",
                            "model_used": model
                        }
                    else:
                        print(f"Groq model {model} returned {res.status_code}: {res.text[:80]}, trying next candidate...")
            except Exception as e:
                print(f"Groq {model} error: {e}")

    # Seamless heuristic fallback
    return heuristic_parse_patient_voice(clean_transcript, age=age, gender=gender)


#!/usr/bin/env python3
"""
COMMUNITY SHIELD (ประชาอารักษ์) — LoRA Dataset Generator
Wat Thewarat Kunchorn Community Disaster Resilience System
Generates domain-specific instruction tuning dataset for Chao Phraya flood triage.
"""

import json
import random
import os

OUTPUT_DIR = "/Volumes/MAC/Thai_Community/ml/data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

HOUSEHOLDS = [
    {"id": "A-012", "name": "ยายสมจิตร รัตนประสิทธิ์", "age": 82, "status": "bedridden", "needs": "ถังออกซิเจนและเปลสนาม", "baseline_elev": 0.55},
    {"id": "A-008", "name": "คุณตาประสิทธิ์ สุขเจริญ", "age": 79, "status": "wheelchair", "needs": "รถเข็นและคนช่วยพยุง", "baseline_elev": 0.65},
    {"id": "A-002", "name": "คุณป้ามาลี วงศ์สวัสดิ์", "age": 68, "status": "elderly", "needs": "ยาโรคหัวใจและสัมภาระจำเป็น", "baseline_elev": 0.75},
    {"id": "B-005", "name": "ครอบครัวมีสุข", "age": 45, "status": "normal", "needs": "ถุงยังชีพและกระสอบทราย", "baseline_elev": 0.85},
    {"id": "C-011", "name": "ลุงสมหมาย ใจดี", "age": 64, "status": "normal", "needs": "เครื่องสูบน้ำขนาดเล็ก", "baseline_elev": 0.90}
]

ROUTES = [
    {"name": "Plan A (สะพานไม้หลักริมน้ำ)", "safe_level": 0.50, "type": "wooden_boardwalk"},
    {"name": "Plan B (สะพานไม้ยกสูงเชื่อมซอย 2)", "safe_level": 0.70, "type": "elevated_boardwalk"},
    {"name": "Plan C (ดอนพระอุโบสถวัดเทวราชกุญชร)", "safe_level": 1.40, "type": "high_ground_evacuation"}
]

def generate_sample(sample_id):
    # Simulate variable water conditions
    water_level = round(random.uniform(0.20, 1.15), 2)
    rate_of_rise = round(random.uniform(0.10, 0.45), 2)
    rssi = random.randint(-95, -65)
    snr = round(random.uniform(4.0, 14.0), 1)
    battery = round(random.uniform(3.30, 3.65), 2)
    
    # Target household
    target_hh = random.choice(HOUSEHOLDS)
    oxygen_minutes = max(10, int(120 - (water_level * 80) + random.randint(-15, 15))) if target_hh["status"] == "bedridden" else None
    
    # Calculate time to breach (1.00m MSL threshold)
    if water_level < 1.00:
        time_to_breach = int(((1.00 - water_level) / rate_of_rise) * 60)
    else:
        time_to_breach = 0
        
    # Check route viability
    is_boardwalk_submerged = water_level >= 0.70
    
    # Determine risk level & plan
    if water_level >= 0.85 or (oxygen_minutes and oxygen_minutes <= 45) or is_boardwalk_submerged:
        risk_level = "CRITICAL"
        recommended_plan = "Plan C (ดอนพระอุโบสถวัดเทวราชกุญชร)"
    elif water_level >= 0.55 or rate_of_rise >= 0.25:
        risk_level = "WARNING"
        recommended_plan = "Plan B (สะพานไม้ยกสูงเชื่อมซอย 2)"
    else:
        risk_level = "NORMAL"
        recommended_plan = "Plan A (สะพานไม้หลักริมน้ำ)"
        
    prompt = (
        f"<telemetry>\n"
        f"Node: GW-THEWARAT-BELF-01 | Freq: 923.4 MHz (AS923-TH)\n"
        f"Water Level: +{water_level:.2f} m MSL | Rate of Rise: +{rate_of_rise:.2f} m/h\n"
        f"RF Link: RSSI {rssi} dBm | SNR +{snr:.1f} dB | Battery {battery:.2f}V\n"
        f"Target Vulnerable Household: {target_hh['id']} ({target_hh['name']}, {target_hh['status']})\n"
        f"Special Requirements: {target_hh['needs']}\n"
        + (f"Oxygen Supply: {oxygen_minutes} min remaining\n" if oxygen_minutes else "")
        + f"Current Boardwalk State: {'จมน้ำแล้ว (+15 ถึง +45 ซม.)' if is_boardwalk_submerged else 'พ้นน้ำ (ปลอดภัย)'}\n"
        f"</telemetry>\n\n"
        f"<instruction>\n"
        f"วิเคราะห์ข้อมูลโทรมาตร LoRaWAN และสถานการณ์กลุ่มเปราะบางเพื่อประเมินความเสี่ยงและสั่งการอพยพเร่งด่วนตามกรอบ Chain-of-Thought\n"
        f"</instruction>"
    )
    
    cot_reasoning = (
        f"[Step 1: LoRa Telemetry Ingestion]\n"
        f"ระดับน้ำตรวจวัดล่าสุด +{water_level:.2f} ม. รทก. อัตราการเพิ่ม +{rate_of_rise:.2f} ม./ชม. แบตเตอรี่โหนด {battery:.2f}V พร้อมโซลาร์ชาร์จ\n"
        f"[Step 2: RF Link Margin Assessment]\n"
        f"ค่า RSSI {rssi} dBm และ SNR +{snr:.1f} dB ยืนยันการเชื่อมต่อ LoRa AS923 ระหว่างท่าน้ำและหอระฆังมี Link Margin เพียงพอ ไม่มีแพ็กเก็ตสูญหาย\n"
        f"[Step 3: Hydrological Extrapolation]\n"
        f"คำนวณเวลาก่อนน้ำล้นคันกั้นน้ำ 1.00 ม.: {time_to_breach} นาที (แนวโน้มน้ำทะเลหนุนสอดคล้องข้อมูลกรมอุทกศาสตร์)\n"
        f"[Step 4: Vulnerability & Route Correlation]\n"
        f"ครัวเรือน {target_hh['id']} ({target_hh['name']}) จัดอยู่ในกลุ่ม {target_hh['status']} "
        + (f"มีออกซิเจนคงเหลือ {oxygen_minutes} นาที ซึ่งน้อยกว่า/ใกล้เคียงเวลาน้ำล้นตลิ่ง " if oxygen_minutes else "")
        + f"เส้นทางสะพานไม้ {'ไม่สามารถใช้งานได้เนื่องจากจมน้ำ' if is_boardwalk_submerged else 'ยังคงใช้สัญจรได้'}\n"
        f"[Step 5: Triage Decision & Action Orders]\n"
        f"ประเมินระดับความเสี่ยง: {risk_level} | บังคับใช้แผน: {recommended_plan} | สั่งการระดมทีมกู้ภัยชุมชนเข้าช่วยเหลือทันที"
    )
    
    response = {
        "thought_chain": cot_reasoning,
        "risk_level": risk_level,
        "water_level_m": water_level,
        "rate_of_rise_m_h": rate_of_rise,
        "estimated_time_to_breach_min": time_to_breach,
        "recommended_plan": recommended_plan,
        "target_household": target_hh['id'],
        "actions": [
            f"ส่งทีมกู้ภัยเข้าประจำบ้าน {target_hh['id']} ทันที",
            f"อพยพตาม {recommended_plan}",
            "บรอดคาสต์แจ้งเตือนผ่านเสียงตามสายวัดเทวราชกุญชรและ LINE Community Alert"
        ]
    }
    
    return {
        "id": f"scen_{sample_id:04d}",
        "prompt": prompt,
        "completion": json.dumps(response, ensure_ascii=False)
    }

def main():
    print("🚀 Generating Chao Phraya Community LoRA Dataset...")
    samples = [generate_sample(i) for i in range(1, 1201)]
    
    # Split 85% train, 15% validation
    split_idx = int(len(samples) * 0.85)
    train_samples = samples[:split_idx]
    val_samples = samples[split_idx:]
    
    train_path = os.path.join(OUTPUT_DIR, "train.jsonl")
    val_path = os.path.join(OUTPUT_DIR, "val.jsonl")
    
    with open(train_path, "w", encoding="utf-8") as f:
        for s in train_samples:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
            
    with open(val_path, "w", encoding="utf-8") as f:
        for s in val_samples:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
            
    print(f"✅ Generated {len(train_samples)} training samples ➔ {train_path}")
    print(f"✅ Generated {len(val_samples)} validation samples ➔ {val_path}")

if __name__ == "__main__":
    main()

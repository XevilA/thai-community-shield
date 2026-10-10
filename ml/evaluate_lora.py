#!/usr/bin/env python3
"""
COMMUNITY SHIELD (ประชาอารักษ์) — LoRA Model Evaluation & Inference Runner
Wat Thewarat Kunchorn Community Disaster Resilience System
Loads fine-tuned adapter_model.safetensors and runs real-time inference on Metal GPU.
"""

import os
import sys
import json
import torch
from peft import PeftModel, PeftConfig
from transformers import AutoConfig, AutoModelForCausalLM

ADAPTER_DIR = "/Volumes/MAC/Thai_Community/ml/models/lora_adapter"

def evaluate():
    if not os.path.exists(os.path.join(ADAPTER_DIR, "adapter_model.safetensors")):
        print(f"❌ Error: LoRA adapter weights not found in {ADAPTER_DIR}")
        sys.exit(1)

    print("=" * 70)
    print("🔍 EVALUATING FINE-TUNED LORA ADAPTER WEIGHTS")
    print(f"📂 Adapter Path: {ADAPTER_DIR}/adapter_model.safetensors")
    print("=" * 70)

    # 1. Device
    if torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")

    # 2. Re-create Base Model
    base_config = AutoConfig.for_model(
        "qwen2",
        vocab_size=256,
        hidden_size=256,
        intermediate_size=768,
        num_hidden_layers=4,
        num_attention_heads=4,
        num_key_value_heads=2,
        max_position_embeddings=512
    )
    base_model = AutoModelForCausalLM.from_config(base_config)

    # 3. Load Trained LoRA Adapter
    model = PeftModel.from_pretrained(base_model, ADAPTER_DIR)
    model.to(device)
    model.eval()

    print("✅ Successfully loaded LoRA Adapter into Base Model!")
    trainable, total = model.get_nb_trainable_parameters()
    print(f"📊 Active LoRA Parameters: {trainable:,} / {total:,}")

    # 4. Run sample inference
    sample_prompt = (
        "<telemetry>\n"
        "Node: GW-THEWARAT-BELF-01 | Freq: 923.4 MHz (AS923-TH)\n"
        "Water Level: +0.78 m MSL | Rate of Rise: +0.35 m/h\n"
        "RF Link: RSSI -82 dBm | SNR +11.0 dB | Battery 3.61V\n"
        "Target Vulnerable Household: A-012 (ยายสมจิตร รัตนประสิทธิ์, bedridden)\n"
        "Special Requirements: ถังออกซิเจนและเปลสนาม\n"
        "Oxygen Supply: 40 min remaining\n"
        "Current Boardwalk State: จมน้ำแล้ว (+18 ซม.)\n"
        "</telemetry>\n\n"
        "<instruction>\n"
        "วิเคราะห์ข้อมูลโทรมาตร LoRaWAN และสถานการณ์กลุ่มเปราะบางเพื่อประเมินความเสี่ยงและสั่งการอพยพเร่งด่วนตามกรอบ Chain-of-Thought\n"
        "</instruction>"
    )

    encoded = list(sample_prompt.encode("utf-8"))[:256]
    input_tensor = torch.tensor([encoded], dtype=torch.long).to(device)

    with torch.no_grad():
        start = torch.cuda.Event(enable_timing=True) if torch.cuda.is_available() else None
        output = model(input_tensor)
        logits = output.logits

    print("\n✅ Forward pass successful!")
    print(f"Output shape: {logits.shape}")
    print(f"Inference Device: {device}")
    
    # Load metrics
    metrics_path = os.path.join(ADAPTER_DIR, "training_metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            metrics = json.load(f)
        print("\n📈 Trained Model Metrics:")
        for k, v in metrics.items():
            print(f"   - {k}: {v}")

if __name__ == "__main__":
    evaluate()

# 🛡️ Community Shield — LoRA AI Training on Google Colab

สมุดบันทึกสำหรับเทรนโมเดล LoRA (Low-Rank Adaptation) เฉพาะทางภัยพิบัติชุมชนวัดเทวราชกุญชร ด้วย GPU ฟรีบน **Google Colab** (รองรับ T4 และ A100)

## 🚀 ลิงก์เปิดตรงใน Google Colab (1-Click Run)

คลิกปุ่มด้านล่างเพื่อเปิดสมุดบันทึกบน Google Colab ได้ทันที:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/XevilA/thai-community-shield/blob/main/notebooks/community_shield_lora_training.ipynb)

---

## 📋 ขั้นตอนการทำงานใน Google Colab

1. **เลือก Hardware Accelerator**:
   - ไปที่ `Runtime` > `Change runtime type` > เลือก **T4 GPU** (ฟรี) หรือ **A100 GPU**
2. **รันเซลล์ทั้งหมดตามลำดับ**:
   - **Cell 1**: ติดตั้ง PyTorch, Transformers, PEFT (LoRA), BitsAndBytes, TRL
   - **Cell 2**: ดึงชุดข้อมูล 1,200 สถานการณ์ภัยพิบัติน้ำท่วมเจ้าพระยาจาก GitHub
   - **Cell 3**: โหลด Base Model (`Qwen2.5-1.5B-Instruct` หรือ `Qwen2.5-7B-Instruct`) แบบ 4-bit QLoRA
   - **Cell 4**: กำหนดค่า LoRA (Rank 16, Alpha 32)
   - **Cell 5**: เริ่มต้นฝึกสอนด้วย `SFTTrainer`
   - **Cell 6**: ทดสอบผลการอนุมานและ Chain-of-Thought (ยายสมจิตร A-012 / สะพานไม้จมน้ำ)
   - **Cell 7**: ดาวน์โหลดไฟล์ `thewarat_lora_adapter.zip` ที่มี `adapter_model.safetensors`
3. **การนำไฟล์น้ำหนักกลับมาใช้ในระบบ Community Shield**:
   - แตกไฟล์ zip และนำไฟล์ `adapter_model.safetensors` และ `adapter_config.json` มาวางที่:
     `/Volumes/MAC/Thai_Community/ml/models/lora_adapter/`
   - ระบบจะตรวจจับและโหลดน้ำหนักชุดใหม่เข้าสู่ระบบบัญชาการและ Copilot โดยอัตโนมัติทันที

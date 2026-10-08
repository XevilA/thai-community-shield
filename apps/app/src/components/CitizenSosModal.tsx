import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';

interface CitizenSosModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSos: (text: string, location: string) => void;
}

export const CitizenSosModal: React.FC<CitizenSosModalProps> = ({
  visible,
  onClose,
  onSubmitSos,
}) => {
  const [reportText, setReportText] = useState(
    'มีผู้สูงอายุในบ้านลื่นล้ม และน้ำในคลองเริ่มดันเข้าท่อระบายน้ำหน้าบ้าน ต้องการคนช่วย'
  );
  const [location, setLocation] = useState('ชุมชนวัดเทวราชกุญชร ซอย 2 ตลิ่งริมน้ำ');
  const [isRecording, setIsRecording] = useState(false);

  const handleToggleRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setReportText('น้ำจากเจ้าพระยาดันเข้าท่อระบายน้ำแล้วค่ะ หน้าบ้านน้ำท่วมสูงประมาณเข่า');
      }, 2500);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>🚨 แจ้งเหตุฉุกเฉิน / Community Voice</Text>
              <Text style={styles.modalSubtitle}>สำหรับประชาชนและผู้นำชุมชน • ส่งตรงถึงศูนย์บัญชาการ</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Voice Record Button Simulation */}
          <TouchableOpacity
            style={[styles.recordBox, isRecording && styles.recordBoxActive]}
            onPress={handleToggleRecord}
          >
            <Text style={styles.recordEmoji}>{isRecording ? '🔴' : '🎙️'}</Text>
            <Text style={styles.recordText}>
              {isRecording
                ? 'กำลังฟังเสียงและสกัดข้อความอัตโนมัติ...'
                : 'กดที่นี่เพื่อพูดด้วยเสียง (AI Voice Structuring)'}
            </Text>
            <Text style={styles.recordSub}>AI จะแปลงเสียงภาษาไทยเป็นข้อมูลหมวดหมู่และพิกัดทันที</Text>
          </TouchableOpacity>

          {/* Location Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>สถานที่ / พิกัดจุดเกิดเหตุ:</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="ระบุชื่อบ้าน หรือซอยในชุมชน..."
              placeholderTextColor="#64748B"
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>รายละเอียดเหตุการณ์:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              value={reportText}
              onChangeText={setReportText}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => {
              onSubmitSos(reportText, location);
              onClose();
            }}
          >
            <Text style={styles.submitBtnText}>🚨 ยืนยันแจ้งเหตุฉุกเฉิน</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  recordBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderStyle: 'dashed',
  },
  recordBoxActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  recordEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  recordText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  recordSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

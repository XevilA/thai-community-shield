import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';

interface FieldReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitReport: (depthCm: number, isBridgeSubmerged: boolean, notes: string) => void;
}

export const FieldReportModal: React.FC<FieldReportModalProps> = ({
  visible,
  onClose,
  onSubmitReport,
}) => {
  const [depthCm, setDepthCm] = useState('45');
  const [isBridgeSubmerged, setIsBridgeSubmerged] = useState(true);
  const [notes, setNotes] = useState('สะพานไม้ชั่วคราวทางแยก 2 จมน้ำลึกเกิน 40 ซม. คานเริ่มลอย ต้องอ้อมเส้นทางอื่น');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>📸 ส่งรายงานสภาพหน้างาน (Field Report)</Text>
              <Text style={styles.modalSubtitle}>ทีม Community Team 02 • พิกัดบ้าน A-012</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Photo Preview Simulation */}
          <View style={styles.photoContainer}>
            <Text style={styles.photoEmoji}>🌊</Text>
            <Text style={styles.photoText}>[จำลองภาพถ่ายจากกล้องมือถือ]</Text>
            <Text style={styles.photoSub}>ตรวจพบคราบน้ำและระดับน้ำเอ่อล้นสะพานไม้</Text>
          </View>

          {/* Water Depth Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ระดับน้ำจริงที่วัดได้ (เซนติเมตร):</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={depthCm}
              onChangeText={setDepthCm}
            />
          </View>

          {/* Boardwalk Submerged Switch */}
          <TouchableOpacity
            style={[styles.switchCard, isBridgeSubmerged && styles.switchCardActive]}
            onPress={() => setIsBridgeSubmerged(!isBridgeSubmerged)}
          >
            <View style={[styles.checkbox, isBridgeSubmerged && styles.checkboxChecked]}>
              {isBridgeSubmerged && <Text style={styles.checkIcon}>✓</Text>}
            </View>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>⚠️ ตรวจพบสะพานไม้ทางแยก 2 ชำรุด/จมน้ำ</Text>
              <Text style={styles.switchSubtitle}>
                การเปิดตัวเลือกนี้จะส่งสัญญาณให้ศูนย์บัญชาการคำนวณเส้นทางใหม่ (Dynamic Replanning) ทันที
              </Text>
            </View>
          </TouchableOpacity>

          {/* Notes Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>รายละเอียดเพิ่มเติม:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => {
              onSubmitReport(Number(depthCm) || 45, isBridgeSubmerged, notes);
              onClose();
            }}
          >
            <Text style={styles.submitBtnText}>✓ ส่งข้อมูลกลับศูนย์บัญชาการ</Text>
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
  photoContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  photoEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  photoText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  photoSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
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
  switchCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
    gap: 10,
  },
  switchCardActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  switchSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  submitBtn: {
    backgroundColor: '#0284C7',
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

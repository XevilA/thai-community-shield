import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ResponseTask } from '@community-shield/shared';

interface MobileFieldTaskViewProps {
  task: ResponseTask | null;
  onUpdateStatus: (newStatus: any) => void;
  onOpenReportModal: () => void;
}

export const MobileFieldTaskView: React.FC<MobileFieldTaskViewProps> = ({
  task,
  onUpdateStatus,
  onOpenReportModal,
}) => {
  if (!task) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={styles.emptyTitle}>ไม่มีงานมอบหมายในขณะนี้</Text>
        <Text style={styles.emptySubtitle}>
          ระบบกำลังเฝ้าระวังระดับน้ำ เมื่อศูนย์บัญชาการอนุมัติแผนงาน ใบงานจะปรากฏที่นี่ทันที
        </Text>
      </View>
    );
  }

  const steps = [
    { key: 'accepted', label: 'รับงาน' },
    { key: 'traveling', label: 'เดินทาง' },
    { key: 'arrived', label: 'ถึงพื้นที่' },
    { key: 'reported', label: 'รายงาน' },
    { key: 'closed', label: 'ส่งต่อสำเร็จ' },
  ];

  const getStepIndex = (st: string) => {
    return steps.findIndex((s) => s.key === st);
  };

  const currentStepIdx = getStepIndex(task.status);

  return (
    <ScrollView style={styles.container}>
      {/* Offline-First Banner */}
      <View style={styles.offlineBanner}>
        <Text style={styles.offlineDot}>●</Text>
        <Text style={styles.offlineText}>
          ระบบ Offline-First พร้อมทำงาน: ข้อมูลและ GPS จะถูกบันทึกในเครื่องแม้อินเทอร์เน็ตหลุด
        </Text>
      </View>

      {/* Main Task Card */}
      <View style={styles.taskCard}>
        <View style={styles.cardHeader}>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>🔴 CRITICAL TASK</Text>
          </View>
          <Text style={styles.taskCode}>{task.code}</Text>
        </View>

        <Text style={styles.taskTitle}>{task.titleTh}</Text>
        <Text style={styles.taskMission}>{task.missionObjectiveTh}</Text>

        {/* Patient / Target Information */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ผู้ประสบภัย:</Text>
            <Text style={styles.infoValue}>นางสมจิตร (ยายสมจิตร อายุ 82 ปี, ผู้ป่วยติดเตียง)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>เงื่อนไขวิกฤต:</Text>
            <Text style={[styles.infoValue, styles.infoValueRed]}>
              🫁 ออกซิเจนสำรองเหลือประมาณ 90 นาที
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>จุดรับผู้ป่วย:</Text>
            <Text style={styles.infoValue}>บ้าน A-012 (ตรอกหลังตลาด)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>จุดส่งต่อ:</Text>
            <Text style={[styles.infoValue, styles.infoValueBlue]}>
              {task.destinationPoint} (รอต่อรถ EMS)
            </Text>
          </View>
        </View>

        {/* Progress Stepper */}
        <View style={styles.stepperRow}>
          {steps.map((step, idx) => {
            const isDone = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <View key={step.key} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isDone && styles.stepCircleDone,
                    isCurrent && styles.stepCircleCurrent,
                  ]}
                >
                  <Text style={[styles.stepNum, isDone && styles.stepNumDone]}>{idx + 1}</Text>
                </View>
                <Text style={[styles.stepLabel, isDone && styles.stepLabelDone]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Action Buttons based on lifecycle */}
        <View style={styles.actionButtonsCol}>
          {task.status === 'accepted' && (
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => onUpdateStatus('traveling')}
            >
              <Text style={styles.actionBtnText}>🚶 เริ่มออกเดินทางสู่บ้าน A-012</Text>
            </TouchableOpacity>
          )}

          {task.status === 'traveling' && (
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => onUpdateStatus('arrived')}
            >
              <Text style={styles.actionBtnText}>📍 ยืนยันถึงหน้าบ้าน A-012 แล้ว</Text>
            </TouchableOpacity>
          )}

          {(task.status === 'arrived' || task.status === 'inspecting') && (
            <TouchableOpacity style={styles.actionBtnAlert} onPress={onOpenReportModal}>
              <Text style={styles.actionBtnText}>
                📸 ถ่ายภาพ & รายงานระดับน้ำจริง (พบสะพานไม้จม)
              </Text>
            </TouchableOpacity>
          )}

          {task.status === 'reported' && (
            <TouchableOpacity
              style={styles.actionBtnSuccess}
              onPress={() => onUpdateStatus('closed')}
            >
              <Text style={styles.actionBtnText}>
                ✓ เคลื่อนย้ายผ่านเส้นทางเลี่ยงส่งต่อ EMS สำเร็จ
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0F172A',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  offlineDot: {
    color: '#10B981',
    fontSize: 12,
  },
  offlineText: {
    color: '#D1FAE5',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  taskCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  priorityText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  taskCode: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  taskTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  taskMission: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  infoValue: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  infoValueRed: {
    color: '#F87171',
  },
  infoValueBlue: {
    color: '#38BDF8',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: {
    backgroundColor: '#0284C7',
  },
  stepCircleCurrent: {
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  stepNum: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  stepNumDone: {
    color: '#FFFFFF',
  },
  stepLabel: {
    color: '#64748B',
    fontSize: 10,
  },
  stepLabelDone: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  actionButtonsCol: {
    gap: 10,
  },
  actionBtnPrimary: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnAlert: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnSuccess: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    margin: 16,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

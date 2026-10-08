import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HOUSE_A012_RESCUE_PLANS, RescuePlan, ResponseTask } from '@community-shield/shared';

interface DecisionPanelProps {
  activeTask: ResponseTask | null;
  onApprovePlan: (plan: RescuePlan) => void;
  isPlanApproved: boolean;
}

export const DecisionPanel: React.FC<DecisionPanelProps> = ({
  activeTask,
  onApprovePlan,
  isPlanApproved,
}) => {
  return (
    <View style={styles.card}>
      {/* Incident Header */}
      <View style={styles.incidentBanner}>
        <View style={styles.alertIconBadge}>
          <Text style={styles.alertIcon}>!</Text>
        </View>

        <View style={styles.incidentInfo}>
          <View style={styles.incidentTop}>
            <Text style={styles.incidentTag}>CRITICAL INCIDENT — บ้าน A-012</Text>
            <View style={styles.oxygenBadge}>
              <Text style={styles.oxygenText}>ออกซิเจนเหลือ ≈ 90 นาที</Text>
            </View>
          </View>
          <Text style={styles.incidentTitle}>
            ผู้ป่วยติดเตียง (ยายสมจิตร 82 ปี) ทางเดินน้ำท่วมขัง 35 ซม. รถพยาบาลเข้าไม่ถึง
          </Text>
          <Text style={styles.incidentDesc}>
            AI ประเมินข้อจำกัดการเข้าถึงและเปรียบเทียบ 3 แผนการช่วยเหลือเพื่อให้ผู้บัญชาการพิจารณาอนุมัติ
          </Text>
        </View>
      </View>

      {/* If already approved, show active dispatch status */}
      {isPlanApproved && activeTask ? (
        <View style={styles.approvedBanner}>
          <View style={styles.approvedHeader}>
            <Text style={styles.approvedTitle}>แผน B ได้รับการอนุมัติแล้ว (HUMAN-IN-THE-LOOP)</Text>
            <View style={styles.taskTag}>
              <Text style={styles.taskTagText}>{activeTask.code}</Text>
            </View>
          </View>
          <Text style={styles.approvedSubtext}>
            มอบหมายงาน: {activeTask.assignedTeam} • ปลายทาง: {activeTask.destinationPoint}
          </Text>
          <Text style={styles.statusLabel}>
            สถานะปัจจุบัน:{' '}
            <Text style={styles.statusValue}>
              {activeTask.status === 'accepted'
                ? 'รับงานแล้ว (กำลังเดินทาง)'
                : activeTask.status === 'arrived'
                ? 'ถึงพื้นที่แล้ว'
                : activeTask.status === 'reported'
                ? 'ส่งรายงานสภาพหน้างานแล้ว'
                : 'เสร็จสิ้น'}
            </Text>
          </Text>
        </View>
      ) : null}

      {/* 3 AI Plans Comparison */}
      <View style={styles.plansContainer}>
        {HOUSE_A012_RESCUE_PLANS.map((plan) => {
          const isRecommended = plan.recommended;

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                isRecommended && styles.planCardRecommended,
                isPlanApproved && plan.id === 'PLAN_B' && styles.planCardActiveApproved,
              ]}
            >
              {/* Plan Header */}
              <View style={styles.planHeader}>
                <View style={styles.planTitleCol}>
                  <View style={styles.planBadgeRow}>
                    <Text style={[styles.planBadge, isRecommended && styles.planBadgeRec]}>
                      {plan.planType}
                    </Text>
                    {isRecommended && (
                      <View style={styles.recTag}>
                        <Text style={styles.recTagText}>แนะนำสูงสุด</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.planTitle}>{plan.titleTh}</Text>
                  <Text style={styles.planSubtitle}>{plan.subtitleTh}</Text>
                </View>

                <View style={styles.scoreCol}>
                  <Text style={styles.scoreLabel}>ความเป็นไปได้</Text>
                  <Text
                    style={[
                      styles.scoreValue,
                      isRecommended ? styles.scoreValueHigh : styles.scoreValueLow,
                    ]}
                  >
                    {plan.feasibilityScore}%
                  </Text>
                </View>
              </View>

              {/* Pros & Cons */}
              <View style={styles.prosConsBox}>
                <View style={styles.listCol}>
                  <Text style={styles.prosHeader}>ข้อดี:</Text>
                  {plan.prosTh.map((pro, i) => (
                    <Text key={i} style={styles.proItem}>
                      + {pro}
                    </Text>
                  ))}
                </View>

                <View style={styles.listCol}>
                  <Text style={styles.consHeader}>ข้อจำกัด / ความเสี่ยง:</Text>
                  {plan.consTh.map((con, i) => (
                    <Text key={i} style={styles.conItem}>
                      - {con}
                    </Text>
                  ))}
                </View>
              </View>

              {/* Warnings / Notes */}
              {plan.constraintWarningsTh.map((warn, i) => (
                <Text
                  key={i}
                  style={[styles.warnText, isRecommended ? styles.passText : styles.failText]}
                >
                  {warn}
                </Text>
              ))}

              {/* Approval Button for Recommended Plan */}
              {isRecommended && !isPlanApproved && (
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => onApprovePlan(plan)}
                >
                  <Text style={styles.approveButtonText}>
                    ✓ อนุมัติแผน B (ออกใบงาน TASK #A-012 ให้ทีม 02)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  incidentBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  alertIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIcon: {
    fontSize: 22,
  },
  incidentInfo: {
    flex: 1,
  },
  incidentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  incidentTag: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  oxygenBadge: {
    backgroundColor: '#991B1B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  oxygenText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  incidentTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  incidentDesc: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  approvedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  approvedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approvedTitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  taskTag: {
    backgroundColor: '#065F46',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  approvedSubtext: {
    color: '#E2E8F0',
    fontSize: 12,
    marginTop: 4,
  },
  statusLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },
  statusValue: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  planCardRecommended: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
  },
  planCardActiveApproved: {
    borderColor: '#10B981',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitleCol: {
    flex: 1,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  planBadge: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  planBadgeRec: {
    color: '#38BDF8',
  },
  recTag: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  planTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  planSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    color: '#64748B',
    fontSize: 9,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  scoreValueHigh: {
    color: '#10B981',
  },
  scoreValueLow: {
    color: '#EF4444',
  },
  prosConsBox: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  listCol: {
    flex: 1,
  },
  prosHeader: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  consHeader: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  proItem: {
    color: '#CBD5E1',
    fontSize: 10,
    lineHeight: 14,
  },
  conItem: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 14,
  },
  warnText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  passText: {
    color: '#38BDF8',
  },
  failText: {
    color: '#F87171',
  },
  approveButton: {
    backgroundColor: '#0284C7',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

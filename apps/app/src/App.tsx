import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  useWindowDimensions,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import {
  SIMULATION_TIMELINE_STEPS,
  INITIAL_HOUSEHOLDS,
  INITIAL_PREPARATION_CHECKLIST,
  HOUSE_A012_RESCUE_PLANS,
  RescuePlan,
  ResponseTask,
  Household,
  generateAiExplanation,
  INITIAL_SENSOR_READINGS,
  AREA_RISK_MAP,
  HOUSEHOLD_ACCESS_MAP,
} from '@community-shield/shared';

import { Header } from './components/Header';
import { TimelineControls } from './components/TimelineControls';
import { Community3DViewer } from './components/Community3DViewer';
import { WaterLevelChart } from './components/WaterLevelChart';
import { PreparationWindowCard } from './components/PreparationWindowCard';
import { HouseholdsBoard } from './components/HouseholdsBoard';
import { DecisionPanel } from './components/DecisionPanel';
import { MobileFieldTaskView } from './components/MobileFieldTaskView';
import { FieldReportModal } from './components/FieldReportModal';
import { CitizenSosModal } from './components/CitizenSosModal';
import { ReplanningBanner } from './components/ReplanningBanner';

export default function App() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 960;

  // Global State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeMode, setActiveMode] = useState<'command' | 'mobile'>('command');
  const [households, setHouseholds] = useState<Household[]>(INITIAL_HOUSEHOLDS);
  const [checklist, setChecklist] = useState(INITIAL_PREPARATION_CHECKLIST);

  const [isPlanApproved, setIsPlanApproved] = useState(false);
  const [activeTask, setActiveTask] = useState<ResponseTask | null>(null);
  const [isReplanningActive, setIsReplanningActive] = useState(false);
  const [replanningReason, setReplanningReason] = useState('');

  // Modals
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isSosModalVisible, setIsSosModalVisible] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<Household | null>(null);

  const currentStep = SIMULATION_TIMELINE_STEPS[currentStepIndex];

  // Timeline Step Change Handler
  const handleSelectStep = (index: number) => {
    setCurrentStepIndex(index);
    const step = SIMULATION_TIMELINE_STEPS[index];

    // State sync according to scenario timeline
    if (step.timeLabel >= '20:20') {
      // House A-012 turns critical
      setHouseholds((prev) =>
        prev.map((h) =>
          h.id === 'house-012' ? { ...h, accessStatus: 'critical_help_needed' } : h
        )
      );
    }
    if (step.timeLabel >= '20:23') {
      setIsPlanApproved(true);
      if (!activeTask) {
        setActiveTask({
          id: 'task-a012',
          code: 'TASK #A-012',
          incidentId: 'inc-001',
          priority: 'critical',
          titleTh: 'เคลื่อนย้ายผู้ป่วยติดเตียงบ้าน A-012 (ยายสมจิตร)',
          missionObjectiveTh:
            'ใช้เปลสนามเดินเท้าบนสะพานไม้ยกสูง นำผู้ป่วยและถังออกซิเจนสำรองมายังจุดส่งต่อการแพทย์ Medical Point B',
          targetHouseholdId: 'house-012',
          assignedTeam: 'Community Team 02',
          destinationPoint: 'จุดส่งต่อการแพทย์ B (หน้าวัดเทวราชกุญชร)',
          status: step.timeLabel >= '20:32' ? 'closed' : step.timeLabel >= '20:30' ? 'reported' : 'accepted',
          createdAt: '20:23',
          acceptedAt: '20:24',
        });
      }
    }
    if (step.timeLabel >= '20:32') {
      setIsReplanningActive(true);
      setReplanningReason(
        'สะพานไม้ทางแยก 2 จมน้ำลึก 48 ซม. ระบบสลับใช้ทางเดินเลี่ยงผ่านหน้าศูนย์ชุมชน ส่งต่อ รพ.วชิรพยาบาล สำเร็จ'
      );
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < SIMULATION_TIMELINE_STEPS.length - 1) {
      handleSelectStep(currentStepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      handleSelectStep(currentStepIndex - 1);
    }
  };

  // Toggle Checklist
  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  // Human-in-the-loop Approval of Plan B
  const handleApprovePlan = (plan: RescuePlan) => {
    setIsPlanApproved(true);
    const newTask: ResponseTask = {
      id: 'task-a012',
      code: 'TASK #A-012',
      incidentId: 'inc-001',
      priority: 'critical',
      titleTh: 'เคลื่อนย้ายผู้ป่วยติดเตียงบ้าน A-012 (ยายสมจิตร)',
      missionObjectiveTh:
        'ใช้เปลสนามเดินเท้าบนสะพานไม้ยกสูง นำผู้ป่วยและถังออกซิเจนสำรองมายังจุดส่งต่อการแพทย์ Medical Point B',
      targetHouseholdId: 'house-012',
      assignedTeam: 'Community Team 02',
      destinationPoint: 'จุดส่งต่อการแพทย์ B (หน้าวัดเทวราชกุญชร)',
      status: 'accepted',
      createdAt: '20:23',
      acceptedAt: '20:24',
    };
    setActiveTask(newTask);
  };

  // Task Status Update from Field
  const handleUpdateTaskStatus = (newStatus: any) => {
    if (activeTask) {
      setActiveTask({ ...activeTask, status: newStatus });
    }
  };

  // Field Report Submission
  const handleSubmitFieldReport = (
    depthCm: number,
    isBridgeSubmerged: boolean,
    notes: string
  ) => {
    if (activeTask) {
      setActiveTask({ ...activeTask, status: 'reported' });
    }
    if (isBridgeSubmerged) {
      setIsReplanningActive(true);
      setReplanningReason(
        `ได้รับรายงานน้ำลึก ${depthCm} ซม. สะพานไม้ทางแยกหลักจมน้ำ: ${notes}`
      );
      // Advance timeline to dynamic replanning step (20:32)
      setCurrentStepIndex(7);
    }
  };

  // Citizen SOS Submission
  const handleSubmitSos = (text: string, location: string) => {
    alert(`ศูนย์บัญชาการได้รับแจ้งเหตุแล้ว:\n"${text}"\nพิกัด: ${location}\nAI กำลังจัดส่งทีมตรวจสอบ`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#0F172A" />

      {/* Top Main Navigation Header */}
      <Header
        currentSimTime={currentStep.timeLabel}
        activeMode={activeMode}
        onToggleMode={setActiveMode}
        isReplanningActive={isReplanningActive}
        onOpenSosModal={() => setIsSosModalVisible(true)}
      />

      {/* Dynamic Replanning Banner if Triggered */}
      {isReplanningActive && <ReplanningBanner reasonTh={replanningReason} />}

      {/* Timeline Controls & Scenario Step Scrubber */}
      <TimelineControls
        currentIndex={currentStepIndex}
        onSelectIndex={handleSelectStep}
        onNext={handleNextStep}
        onPrev={handlePrevStep}
      />

      {/* Body Content */}
      <View style={styles.body}>
        {activeMode === 'mobile' ? (
          // MOBILE FIELD RESPONDER VIEW
          <MobileFieldTaskView
            task={activeTask}
            onUpdateStatus={handleUpdateTaskStatus}
            onOpenReportModal={() => setIsReportModalVisible(true)}
          />
        ) : (
          // DESKTOP COMMAND CENTER DASHBOARD
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={[styles.mainLayout, isLargeScreen ? styles.rowLayout : styles.colLayout]}>
              {/* Left Column: 3D Simulation & Water Level Chart */}
              <View style={[styles.leftColumn, isLargeScreen && { flex: 1.1 }]}>
                {/* 3D Community Interactive Viewport */}
                <Community3DViewer
                  waterLevelMeters={currentStep.waterLevelMeters}
                  alleyWaterDepthCm={currentStep.alleyWaterDepthCm}
                  activeStepTime={currentStep.timeLabel}
                  onSelectHouse={(hId) => {
                    const found = households.find((h) => h.id === hId);
                    if (found) setSelectedHouse(found);
                  }}
                  selectedHouseId={selectedHouse?.id || null}
                  isReplanningActive={isReplanningActive}
                />

                {/* Dual-Line Water Level & Forecast Chart */}
                <WaterLevelChart currentWaterLevel={currentStep.waterLevelMeters} />

                {/* 16 Households Dual Status Grid */}
                <HouseholdsBoard
                  households={households}
                  selectedHouseId={selectedHouse?.id || null}
                  onSelectHouse={setSelectedHouse}
                />
              </View>

              {/* Right Column: Decision Support, Preparation Window & AI Plans */}
              <View style={[styles.rightColumn, isLargeScreen && { flex: 0.9 }]}>
                {/* Preparation Window Countdown & Checklist */}
                <PreparationWindowCard
                  currentSimTime={currentStep.timeLabel}
                  remainingMinutes={Math.max(0, 120 - currentStepIndex * 15)}
                  checklist={checklist}
                  onToggleChecklist={handleToggleChecklist}
                />

                {/* AI 3-Plan Recommendation & Officer Approval Panel */}
                <DecisionPanel
                  activeTask={activeTask}
                  onApprovePlan={handleApprovePlan}
                  isPlanApproved={isPlanApproved}
                />
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Field Report Modal */}
      <FieldReportModal
        visible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        onSubmitReport={handleSubmitFieldReport}
      />

      {/* Citizen SOS Modal */}
      <CitizenSosModal
        visible={isSosModalVisible}
        onClose={() => setIsSosModalVisible(false)}
        onSubmitSos={handleSubmitSos}
      />

      {/* House Detail Modal with AI Explainability */}
      {selectedHouse && (
        <Modal visible={!!selectedHouse} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.houseModalContent}>
              <View style={styles.houseModalHeader}>
                <View>
                  <Text style={styles.houseModalCode}>{selectedHouse.code}</Text>
                  <Text style={styles.houseModalTitle}>{selectedHouse.title}</Text>
                  <Text style={styles.houseModalAddress}>{selectedHouse.address}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedHouse(null)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.houseDetailsGrid}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>โซนพื้นที่:</Text>
                  <Text style={styles.detailVal}>{selectedHouse.zone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>ระดับพื้นบ้าน:</Text>
                  <Text style={styles.detailVal}>{selectedHouse.floorElevationMeters} ม.</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>ช่องทางดิจิทัล:</Text>
                  <Text style={styles.detailVal}>
                    {selectedHouse.digitalAccess === 'no_phone_offline'
                      ? '📵 ไม่มีมือถือ (ตรวจทางกายภาพ)'
                      : '📱 ออนไลน์'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>ผู้อยู่อาศัย:</Text>
                  <Text style={styles.detailVal}>
                    {selectedHouse.residents.map((r) => `${r.name} (${r.age} ปี)`).join(', ')}
                  </Text>
                </View>
              </View>

              {/* AI Explainability Rationale */}
              <View style={styles.explainabilityBox}>
                <Text style={styles.explainHeader}>🧠 AI Explainability (คำอธิบายเหตุผล):</Text>
                <Text style={styles.explainText}>
                  {generateAiExplanation(
                    selectedHouse,
                    INITIAL_SENSOR_READINGS[2],
                    selectedHouse.code === 'A-012'
                  )}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeHouseBtn}
                onPress={() => setSelectedHouse(null)}
              >
                <Text style={styles.closeHouseBtnText}>ปิดหน้าต่าง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A1120',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  mainLayout: {
    gap: 16,
  },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  colLayout: {
    flexDirection: 'column',
  },
  leftColumn: {
    gap: 16,
  },
  rightColumn: {
    gap: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  houseModalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderColor: '#334155',
  },
  houseModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  houseModalCode: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  houseModalTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  houseModalAddress: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  houseDetailsGrid: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailKey: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  detailVal: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  explainabilityBox: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  explainHeader: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  explainText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
  },
  closeHouseBtn: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeHouseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

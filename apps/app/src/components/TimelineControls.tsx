import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SIMULATION_TIMELINE_STEPS } from '@community-shield/shared';

interface TimelineControlsProps {
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentIndex,
  onSelectIndex,
  onNext,
  onPrev,
}) => {
  const currentStep = SIMULATION_TIMELINE_STEPS[currentIndex];

  return (
    <View style={styles.container}>
      {/* Current Step Title & Navigation Buttons */}
      <View style={styles.topRow}>
        <View style={styles.stepInfo}>
          <Text style={styles.stepIndexLabel}>
            SCENARIO STEP {currentIndex + 1} OF {SIMULATION_TIMELINE_STEPS.length}
          </Text>
          <Text style={styles.stepTitle}>
            {currentStep.timeLabel} น. — {currentStep.titleTh}
          </Text>
          <Text style={styles.stepDesc}>{currentStep.descriptionTh}</Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
            disabled={currentIndex === 0}
            onPress={onPrev}
          >
            <Text style={styles.navBtnText}>ก่อนหน้า</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navBtn,
              styles.navBtnPrimary,
              currentIndex === SIMULATION_TIMELINE_STEPS.length - 1 && styles.navBtnDisabled,
            ]}
            disabled={currentIndex === SIMULATION_TIMELINE_STEPS.length - 1}
            onPress={onNext}
          >
            <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>ถัดไป</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Timeline Scrubber Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrubberScroll}>
        {SIMULATION_TIMELINE_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isPassed = index < currentIndex;
          const isCritical = step.timeLabel >= '20:20';

          return (
            <TouchableOpacity
              key={step.timeLabel}
              style={[
                styles.stepTab,
                isActive && styles.stepTabActive,
                isCritical && styles.stepTabCritical,
              ]}
              onPress={() => onSelectIndex(index)}
            >
              <View style={styles.stepTabHeader}>
                <View
                  style={[
                    styles.stepDot,
                    isPassed && styles.stepDotPassed,
                    isActive && styles.stepDotActive,
                    isCritical && styles.stepDotCritical,
                  ]}
                />
                <Text style={[styles.stepTimeText, isActive && styles.stepTimeTextActive]}>
                  {step.timeLabel}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[styles.stepSnippetText, isActive && styles.stepSnippetTextActive]}
              >
                {step.titleTh}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  stepInfo: {
    flex: 1,
    minWidth: 260,
  },
  stepIndexLabel: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  stepTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepDesc: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  navBtnPrimary: {
    backgroundColor: '#0284C7',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  navBtnTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrubberScroll: {
    gap: 8,
    paddingTop: 4,
  },
  stepTab: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 120,
  },
  stepTabActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#1E293B',
  },
  stepTabCritical: {
    borderColor: '#EF4444',
  },
  stepTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  stepDotPassed: {
    backgroundColor: '#10B981',
  },
  stepDotActive: {
    backgroundColor: '#38BDF8',
  },
  stepDotCritical: {
    backgroundColor: '#EF4444',
  },
  stepTimeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  stepTimeTextActive: {
    color: '#38BDF8',
  },
  stepSnippetText: {
    color: '#64748B',
    fontSize: 11,
  },
  stepSnippetTextActive: {
    color: '#F1F5F9',
    fontWeight: '600',
  },
});

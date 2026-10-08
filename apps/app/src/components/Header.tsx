import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COMMUNITY_INFO } from '@community-shield/shared';

interface HeaderProps {
  currentSimTime: string;
  activeMode: 'command' | 'mobile';
  onToggleMode: (mode: 'command' | 'mobile') => void;
  isReplanningActive: boolean;
  onOpenSosModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSimTime,
  activeMode,
  onToggleMode,
  isReplanningActive,
  onOpenSosModal,
}) => {
  return (
    <View style={styles.container}>
      {/* Brand & Community Title */}
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>CS</Text>
        </View>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>COMMUNITY SHIELD</Text>
            <View style={styles.subtitleTag}>
              <Text style={styles.subtitleTagText}>ประชาอารักษ์</Text>
            </View>
          </View>
          <Text style={styles.communitySubtext}>
            {COMMUNITY_INFO.nameTh} • {COMMUNITY_INFO.districtTh}
          </Text>
        </View>
      </View>

      {/* Center: Live Simulation Time Badge */}
      <View style={styles.statusGroup}>
        <View style={[styles.timeBadge, isReplanningActive && styles.timeBadgeAlert]}>
          <View style={[styles.liveDot, isReplanningActive && styles.liveDotAlert]} />
          <Text style={styles.timeLabel}>เวลาจำลอง</Text>
          <Text style={styles.timeValue}>{currentSimTime} น.</Text>
        </View>
      </View>

      {/* Right: Actions & Mode Switcher */}
      <View style={styles.actionsGroup}>
        <TouchableOpacity style={styles.sosButton} onPress={onOpenSosModal}>
          <Text style={styles.sosButtonText}>แจ้งเหตุฉุกเฉิน</Text>
        </TouchableOpacity>

        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[styles.modeTab, activeMode === 'command' && styles.modeTabActive]}
            onPress={() => onToggleMode('command')}
          >
            <Text style={[styles.modeTabText, activeMode === 'command' && styles.modeTabTextActive]}>
              ศูนย์บัญชาการ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, activeMode === 'mobile' && styles.modeTabActive]}
            onPress={() => onToggleMode('mobile')}
          >
            <Text style={[styles.modeTabText, activeMode === 'mobile' && styles.modeTabTextActive]}>
              ทีมกู้ภัยภาคสนาม
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitleTag: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subtitleTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  communitySubtext: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  timeBadgeAlert: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveDotAlert: {
    backgroundColor: '#EF4444',
  },
  timeLabel: {
    color: '#94A3B8',
    fontSize: 11,
  },
  timeValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sosButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: '#0284C7',
  },
  modeTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

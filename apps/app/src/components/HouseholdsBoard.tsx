import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Household } from '@community-shield/shared';
import { AREA_RISK_MAP, HOUSEHOLD_ACCESS_MAP } from '@community-shield/shared';

interface HouseholdsBoardProps {
  households: Household[];
  selectedHouseId: string | null;
  onSelectHouse: (house: Household) => void;
}

export const HouseholdsBoard: React.FC<HouseholdsBoardProps> = ({
  households,
  selectedHouseId,
  onSelectHouse,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>ทะเบียน 16 หลังคาเรือน & สถานะคู่ (Dual Status)</Text>
          <Text style={styles.cardSubtitle}>
            แยกความเสี่ยงพื้นที่ (น้ำท่วม) กับสถานะการเข้าถึง/ช่วยเหลือของตัวบ้านอย่างชัดเจน
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{households.length} ครัวเรือน</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} nestedScrollEnabled>
        <View style={styles.grid}>
          {households.map((house) => {
            const isSelected = house.id === selectedHouseId;
            const isCritical = house.accessStatus === 'critical_help_needed';
            const isNoPhone = house.digitalAccess === 'no_phone_offline';
            const areaMeta = AREA_RISK_MAP[house.areaRiskLevel];
            const accessMeta = HOUSEHOLD_ACCESS_MAP[house.accessStatus];

            return (
              <TouchableOpacity
                key={house.id}
                style={[
                  styles.houseCard,
                  isSelected && styles.houseCardSelected,
                  isCritical && styles.houseCardCritical,
                ]}
                onPress={() => onSelectHouse(house)}
              >
                {/* Top Row: Code & Digital Badge */}
                <View style={styles.houseTopRow}>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeText}>{house.code}</Text>
                  </View>

                  {isNoPhone && (
                    <View style={styles.noPhoneBadge}>
                      <Text style={styles.noPhoneText}>📵 ไม่มีเน็ต/มือถือ</Text>
                    </View>
                  )}
                </View>

                {/* Title & Zone */}
                <Text style={styles.houseTitle} numberOfLines={1}>
                  {house.title}
                </Text>
                <Text style={styles.houseZone}>{house.zone}</Text>

                {/* Dual Status Badges */}
                <View style={styles.badgesContainer}>
                  {/* 1. Area Risk Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: areaMeta.badgeBg }]}>
                    <View style={[styles.statusDot, { backgroundColor: areaMeta.colorHex }]} />
                    <Text
                      numberOfLines={1}
                      style={[styles.statusLabel, { color: areaMeta.colorHex }]}
                    >
                      {areaMeta.labelTh}
                    </Text>
                  </View>

                  {/* 2. House Access Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: accessMeta.badgeBg }]}>
                    <View style={[styles.statusDot, { backgroundColor: accessMeta.colorHex }]} />
                    <Text
                      numberOfLines={1}
                      style={[styles.statusLabel, { color: accessMeta.colorHex }]}
                    >
                      {accessMeta.labelTh}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContainer: {
    maxHeight: 280,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  houseCard: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    width: '48%',
    minWidth: 180,
    flexGrow: 1,
  },
  houseCardSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  houseCardCritical: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  houseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  codeBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '800',
  },
  noPhoneBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#F59E0B',
  },
  noPhoneText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '700',
  },
  houseTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  houseZone: {
    color: '#64748B',
    fontSize: 10,
    marginBottom: 6,
  },
  badgesContainer: {
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PreparationChecklistItem } from '@community-shield/shared';

interface PreparationWindowCardProps {
  currentSimTime: string;
  remainingMinutes: number;
  checklist: PreparationChecklistItem[];
  onToggleChecklist: (id: string) => void;
}

export const PreparationWindowCard: React.FC<PreparationWindowCardProps> = ({
  currentSimTime,
  remainingMinutes,
  checklist,
  onToggleChecklist,
}) => {
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  const categories = [
    { key: 'people', label: 'กลุ่มเปราะบาง (People)', color: '#FF453A' },
    { key: 'area', label: 'สภาพพื้นที่ (Area)', color: '#FF9F0A' },
    { key: 'resource', label: 'ทรัพยากรกู้ชีพ (Resource)', color: '#0A84FF' },
    { key: 'plan', label: 'แผนปฏิบัติการ (Plan)', color: '#30D158' },
  ];

  return (
    <View style={styles.card}>
      {/* Top Banner: Time Remaining */}
      <View style={styles.countdownBanner}>
        <View style={styles.iconCircle}>
          <Text style={styles.clockIcon}>T</Text>
        </View>

        <View style={styles.countdownInfo}>
          <Text style={styles.bannerTag}>PREPARATION WINDOW (ช่วงเวลาเตรียมการ)</Text>
          <Text style={styles.timeRemainingText}>
            เหลือเวลาประมาณ {hours > 0 ? `${hours} ชม. ` : ''}
            {minutes > 0 ? `${minutes} นาที` : 'วิกฤต'}
          </Text>
          <Text style={styles.bannerSubtext}>
            คาดการณ์ระดับน้ำแตะ 1.00 ม. เวลา 22:00 น. จัดลำดับสิ่งที่ต้องตรวจสอบก่อนน้ำท่วมสูง
          </Text>
        </View>
      </View>

      {/* Checklist Sections */}
      <View style={styles.checklistGrid}>
        {categories.map((cat) => {
          const items = checklist.filter((c) => c.category === cat.key);

          return (
            <View key={cat.key} style={styles.categorySection}>
              <Text style={[styles.categoryHeader, { color: cat.color }]}>{cat.label}</Text>

              <View style={styles.itemsList}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.checkItem, item.completed && styles.checkItemCompleted]}
                    onPress={() => onToggleChecklist(item.id)}
                  >
                    <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                      {item.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>

                    <View style={styles.itemTextContainer}>
                      <Text
                        style={[
                          styles.itemTitle,
                          item.completed && styles.itemTitleCompleted,
                          item.priority === 'high' && !item.completed && styles.itemTitleHigh,
                        ]}
                      >
                        {item.titleTh}
                      </Text>
                      <Text style={styles.itemDesc}>{item.descriptionTh}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
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
  countdownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockIcon: {
    fontSize: 22,
  },
  countdownInfo: {
    flex: 1,
  },
  bannerTag: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timeRemainingText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  bannerSubtext: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  checklistGrid: {
    gap: 14,
  },
  categorySection: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  categoryHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  itemsList: {
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  checkItemCompleted: {
    opacity: 0.5,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
  },
  itemTitleHigh: {
    color: '#FCA5A5',
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  itemDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ReplanningBannerProps {
  reasonTh: string;
}

export const ReplanningBanner: React.FC<ReplanningBannerProps> = ({ reasonTh }) => {
  return (
    <View style={styles.banner}>
      <View style={styles.iconBadge}>
        <Text style={styles.iconText}>!</Text>
      </View>

      <View style={styles.textCol}>
        <View style={styles.headerRow}>
          <Text style={styles.tag}>DYNAMIC REPLANNING ACTIVE</Text>
          <Text style={styles.statusLive}>ปรับเปลี่ยนเส้นทางฉุกเฉิน</Text>
        </View>
        <Text style={styles.title}>
          ตรวจพบสะพานไม้ทางแยก 2 จมน้ำ 45 ซม. — ระบบสลับใช้เส้นทางเลี่ยงยกระดับอัตโนมัติ
        </Text>
        <Text style={styles.detail}>
          {reasonTh ||
            'ตรวจพบข้อมูล Field Report จากทีมกู้ภัย 02 ระบบได้ปรับเส้นทางเลี่ยงผ่านระเบียงหน้าศูนย์ชุมชน เพื่อส่งต่อผู้ป่วยสู่จุด B อย่างปลอดภัย'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  textCol: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  tag: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statusLive: {
    color: '#FCA5A5',
    fontSize: 10,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  detail: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});

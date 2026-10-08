import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { INITIAL_SENSOR_READINGS } from '@community-shield/shared';

interface WaterLevelChartProps {
  currentWaterLevel: number;
}

export const WaterLevelChart: React.FC<WaterLevelChartProps> = ({ currentWaterLevel }) => {
  // Coordinates mapping for SVG-like SVG or clean HTML5 visualizer
  const maxMeters = 1.2;
  const chartHeight = 160;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>กราฟระดับน้ำ & การพยากรณ์</Text>
          <Text style={styles.cardSubtitle}>
            🟢 ข้อมูลตรวจวัดจริง (Actual) vs 🟠 การคาดการณ์ (AI Forecast)
          </Text>
        </View>

        <View style={styles.rateBadge}>
          <Text style={styles.rateLabel}>อัตราการเพิ่ม</Text>
          <Text style={styles.rateValue}>+0.17 ม. / 30 นาที</Text>
        </View>
      </View>

      {/* Chart Canvas Area */}
      <View style={[styles.chartContainer, { height: chartHeight }]}>
        {/* Critical Threshold Line (1.00m) */}
        <View style={[styles.thresholdLine, { top: chartHeight * (1 - 1.0 / maxMeters) }]}>
          <Text style={styles.thresholdText}>⚠️ ระดับวิกฤต 1.00 ม.</Text>
        </View>

        {/* Warning Threshold Line (0.70m) */}
        <View style={[styles.warningLine, { top: chartHeight * (1 - 0.7 / maxMeters) }]}>
          <Text style={styles.warningText}>เฝ้าระวัง 0.70 ม.</Text>
        </View>

        {/* Columns & Data Points */}
        <View style={styles.barsRow}>
          {INITIAL_SENSOR_READINGS.map((reading, i) => {
            const isActual = reading.actualLevelMeters !== null;
            const value = isActual ? reading.actualLevelMeters! : reading.forecastLevelMeters!;
            const heightPercent = Math.min(100, Math.max(10, (value / maxMeters) * 100));

            return (
              <View key={reading.id} style={styles.timeColumn}>
                <View style={styles.columnBarContainer}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${heightPercent}%` },
                      isActual ? styles.barFillActual : styles.barFillForecast,
                    ]}
                  />
                  <Text
                    style={[
                      styles.valueTag,
                      isActual ? styles.valueTagActual : styles.valueTagForecast,
                    ]}
                  >
                    {value.toFixed(2)}m
                  </Text>
                </View>
                <Text style={styles.timeTag}>{reading.timestamp}</Text>
                <Text style={styles.typeTag}>{isActual ? 'จริง' : 'AI คาดการณ์'}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotActual]} />
          <Text style={styles.legendLabel}>Actual: ตรวจวัดจริงจากเซนเซอร์</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotForecast]} />
          <Text style={styles.legendLabel}>AI Forecast: คาดการณ์ตามแนวโน้มและฝน</Text>
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  rateBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: '#F97316',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'flex-end',
  },
  rateLabel: {
    color: '#F97316',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rateValue: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: '800',
  },
  chartContainer: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  thresholdLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderTopColor: '#EF4444',
    borderStyle: 'dashed',
    zIndex: 2,
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  thresholdText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#1E293B',
    paddingHorizontal: 4,
    marginTop: -8,
  },
  warningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#F59E0B',
    borderStyle: 'dotted',
    zIndex: 1,
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 10,
    backgroundColor: '#1E293B',
    paddingHorizontal: 4,
    marginTop: -7,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    zIndex: 3,
  },
  timeColumn: {
    alignItems: 'center',
    width: 60,
  },
  columnBarContainer: {
    height: 100,
    width: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barFillActual: {
    backgroundColor: '#10B981',
  },
  barFillForecast: {
    backgroundColor: '#F97316',
    borderTopWidth: 2,
    borderTopColor: '#FDBA74',
  },
  valueTag: {
    position: 'absolute',
    top: -18,
    fontSize: 10,
    fontWeight: '700',
  },
  valueTagActual: {
    color: '#10B981',
  },
  valueTagForecast: {
    color: '#F97316',
  },
  timeTag: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  typeTag: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 1,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActual: {
    backgroundColor: '#10B981',
  },
  dotForecast: {
    backgroundColor: '#F97316',
  },
  legendLabel: {
    color: '#94A3B8',
    fontSize: 11,
  },
});

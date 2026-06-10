import React from 'react';
import { StyleSheet, View, useColorScheme, ScrollView } from 'react-native';
import { Svg, Rect, Path, Line, Text as SvgText } from 'react-native-svg';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '../constants/theme';
import { CreatorAnalytics } from '../types';

interface AnalyticsViewProps {
  analytics: CreatorAnalytics;
}

export default function AnalyticsView({ analytics }: AnalyticsViewProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Mock revenue chart data (last 6 months)
  const monthlyRevenueData = [2100, 3400, 4800, 5200, 7100, analytics.monthlyRevenue];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  // Calculate SVG Line Path
  const width = 300;
  const height = 120;
  const padding = 20;
  const maxVal = Math.max(...monthlyRevenueData) * 1.1;

  const points = monthlyRevenueData.map((val, idx) => {
    const x = padding + (idx * (width - padding * 2)) / (monthlyRevenueData.length - 1);
    const y = height - padding - (val / maxVal) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Stat grid */}
      <View style={styles.grid}>
        <ThemedView type="backgroundElement" style={styles.statCard}>
          <ThemedText type="small" style={styles.statLabel}>Subscribers</ThemedText>
          <ThemedText type="title" style={styles.statValue}>
            {analytics.subscribersCount.toLocaleString()}
          </ThemedText>
          <ThemedText type="code" style={styles.statChange}>+12.4% this month</ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.statCard}>
          <ThemedText type="small" style={styles.statLabel}>Monthly Earnings</ThemedText>
          <ThemedText type="title" style={[styles.statValue, { color: '#4caf50' }]}>
            ${analytics.monthlyRevenue.toLocaleString()}
          </ThemedText>
          <ThemedText type="code" style={styles.statChange}>+8.2% vs last month</ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.statCard}>
          <ThemedText type="small" style={styles.statLabel}>Watch Time (Hrs)</ThemedText>
          <ThemedText type="title" style={styles.statValue}>
            {analytics.watchTimeHours.toLocaleString()}
          </ThemedText>
          <ThemedText type="code" style={styles.statChange}>+4,200 hrs today</ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.statCard}>
          <ThemedText type="small" style={styles.statLabel}>Total Video Views</ThemedText>
          <ThemedText type="title" style={styles.statValue}>
            {analytics.totalViews.toLocaleString()}
          </ThemedText>
          <ThemedText type="code" style={styles.statChange}>+248k this week</ThemedText>
        </ThemedView>
      </View>

      {/* SVG Line Graph for Revenue Trend */}
      <ThemedView type="backgroundElement" style={styles.chartContainer}>
        <ThemedText type="smallBold" style={styles.chartTitle}>Revenue Trend (USD)</ThemedText>
        
        <View style={styles.svgWrapper}>
          <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Grid Lines */}
            <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333333" strokeWidth="1" />
            <Line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#222222" strokeWidth="1" strokeDasharray="4" />
            
            {/* Line Path */}
            <Path d={pathD} fill="none" stroke="#e50914" strokeWidth="3" />
            
            {/* Data Dots & Label Texts */}
            {points.map((p, idx) => (
              <React.Fragment key={idx}>
                <Path 
                  d={`M ${p.x} ${p.y} m -4, 0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0`} 
                  fill="#ffffff" 
                  stroke="#e50914" 
                  strokeWidth="2" 
                />
                <SvgText 
                  x={p.x} 
                  y={height - 4} 
                  fill="#888888" 
                  fontSize="8" 
                  textAnchor="middle"
                >
                  {months[idx]}
                </SvgText>
                <SvgText 
                  x={p.x} 
                  y={p.y - 8} 
                  fill="#ffffff" 
                  fontSize="8" 
                  textAnchor="middle"
                >
                  ${Math.round(monthlyRevenueData[idx])}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </View>
      </ThemedView>

      {/* Video Performance Rankings */}
      <ThemedView type="backgroundElement" style={styles.performancesContainer}>
        <ThemedText type="smallBold" style={styles.chartTitle}>Top Performing Videos</ThemedText>
        {analytics.videoPerformance.map((perf, idx) => (
          <View key={perf.videoId} style={styles.perfRow}>
            <ThemedText type="code" style={styles.perfRank}>#{idx + 1}</ThemedText>
            <View style={styles.perfMeta}>
              <ThemedText type="smallBold" numberOfLines={1} style={styles.perfVideoTitle}>
                {perf.title}
              </ThemedText>
              <ThemedText type="code" style={styles.perfStats}>
                {perf.views.toLocaleString()} views • ${perf.earnings.toLocaleString()} earned
              </ThemedText>
            </View>
          </View>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: 4,
  },
  statLabel: {
    color: '#888888',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statChange: {
    fontSize: 9,
    color: '#888888',
  },
  chartContainer: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  chartTitle: {
    marginBottom: Spacing.one,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  performancesContainer: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  perfRank: {
    color: '#e50914',
    fontSize: 14,
    width: 28,
  },
  perfMeta: {
    flex: 1,
  },
  perfVideoTitle: {
    fontSize: 13,
  },
  perfStats: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
});

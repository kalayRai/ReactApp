// SkillDemandChart.tsx - Bar chart for skill demand visualization
// Uses react-native-chart-kit for cross-platform compatibility
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

interface SkillDemandChartProps {
  skills?: string[];
  demand?: number[];
}

const defaultSkills = ['Python', 'AI/ML', 'Data Science', 'Cloud', 'DevOps', 'Cybersecurity'];
const defaultDemand = [85, 92, 78, 70, 65, 60];

const SkillDemandChart: React.FC<SkillDemandChartProps> = ({
  skills = defaultSkills,
  demand = defaultDemand,
}) => {
  const chartConfig = {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backgroundGradientFrom: 'rgba(8, 24, 51, 0.9)',
    backgroundGradientTo: 'rgba(16, 42, 84, 0.9)',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(212, 164, 95, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      stroke: 'rgba(255, 255, 255, 0.1)',
    },
    barPercentage: 0.7,
  };

  const screenWidth = Dimensions.get('window').width - 60;

  const chartData = {
    labels: skills,
    datasets: [
      {
        data: demand,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>📊</Text>
        <Text style={styles.title}>Market Insights</Text>
      </View>
      <Text style={styles.subtitle}>Skill Demand in Current Market</Text>

      <BarChart
        data={chartData}
        width={screenWidth}
        height={220}
        yAxisLabel=""
        yAxisSuffix="%"
        chartConfig={chartConfig}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
        withInnerLines={true}
        yAxisInterval={1}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#d4a45f' }]} />
          <Text style={styles.legendText}>Demand Score (%)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d4a45f',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 15,
    marginLeft: 30,
  },
  chart: {
    marginVertical: 10,
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default SkillDemandChart;
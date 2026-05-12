// SkillProgressBar.tsx - Progress bar for individual skill
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface SkillProgressBarProps {
  skill: string;
  percentage: number;
}

const SkillProgressBar: React.FC<SkillProgressBarProps> = ({ skill, percentage }) => {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{skill}</Text>
        <Text style={styles.percentage}>{clampedPercentage}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clampedPercentage}%` }]} />
      </View>
    </View>
  );
};

interface SkillProgressListProps {
  skills: { [skill: string]: number };
}

export const SkillProgressList: React.FC<SkillProgressListProps> = ({ skills }) => {
  const entries = Object.entries(skills);

  return (
    <View style={styles.listContainer}>
      {entries.map(([skill, percentage]) => (
        <SkillProgressBar key={skill} skill={skill} percentage={percentage} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 13,
    color: 'white',
  },
  percentage: {
    fontSize: 13,
    color: '#d4a45f',
    fontWeight: '500',
  },
  progressTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#d4a45f',
    borderRadius: 10,
    height: '100%',
  },
  listContainer: {
    marginTop: 10,
  },
});

export default SkillProgressBar;
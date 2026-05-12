// StatCard.tsx - Individual stat display card
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface StatCardProps {
  icon: string; // emoji or icon name
  value: number | string;
  label: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, onPress }) => {
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
    margin: 2,
    flex: 1,
    minWidth: 100,
    height: 100,
  },
  icon: {
    fontSize: 32,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d4a45f',
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default StatCard;
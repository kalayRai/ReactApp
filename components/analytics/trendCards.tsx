// TrendCard.tsx - Card displaying trend list (skills or roles)
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

interface TrendItem {
  name?: string;
  role?: string;
  skill?: string;
  growth: string;
  avg_salary?: string;
}

interface TrendCardProps {
  title: string;
  icon: string;
  items: TrendItem[];
  type: 'skill' | 'role';
}

const TrendCard: React.FC<TrendCardProps> = ({ title, icon, items, type }) => {
  const renderItem = ({ item }: { item: TrendItem }) => {
    const name = item.name || item.role || item.skill || '';
    const isEmerging = item.growth?.includes('+') && parseInt(item.growth) > 100;

    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemName}>{name}</Text>
        <View style={[styles.growthBadge, isEmerging && styles.growthBadgeEmerging]}>
          {item.avg_salary && (
            <Text style={styles.salary}>{item.avg_salary}</Text>
          )}
          <Text style={[styles.growthText, isEmerging && styles.growthTextEmerging]}>
            {type === 'role' ? item.growth : 'Trending'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.name || item.role || item.skill}-${index}`}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    flex: 1,
    minWidth: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
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
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    flex: 1,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  growthBadgeEmerging: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  growthText: {
    fontSize: 12,
    color: '#4caf50',
  },
  growthTextEmerging: {
    color: '#ff9800',
  },
  salary: {
    fontSize: 12,
    color: '#d4a45f',
    marginRight: 8,
  },
});

export default TrendCard;
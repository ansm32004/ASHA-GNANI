import { tr } from '../../localisation/tr';
import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme';
import { VectorCategoryIcon } from '../illustrations/VectorCategoryIcon';

export const CategoryScroller = ({
  categories = [
    { id: 'all', label: 'All', vectorType: 'household' },
    { id: 'households', label: 'Households', vectorType: 'household' },
    { id: 'maternal', label: 'Maternal Care', vectorType: 'maternal' },
    { id: 'child', label: 'Child Health', vectorType: 'child' },
    { id: 'vaccination', label: 'Vaccination', vectorType: 'vaccin' },
    { id: 'nutrition', label: 'Nutrition', vectorType: 'nutrition' },
    { id: 'requests', label: 'Requests', vectorType: 'request' },
    { id: 'claims', label: 'Claims', vectorType: 'claim' }
  ],
  selectedId = 'all',
  onSelectCategory
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isSelected = selectedId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.8}
              style={[
                styles.pill,
                isSelected ? styles.pillActive : styles.pillInactive
              ]}
            >
              <View style={styles.iconWrap}>
                <VectorCategoryIcon category={cat.vectorType} size={18} />
              </View>
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextActive : styles.pillTextInactive
                ]}
              >
                {tr(cat.label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: 10,
    paddingVertical: 2
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1
  },
  pillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  pillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.primary
  },
  iconWrap: {
    marginRight: 6
  },
  pillText: {
    ...typography.caption,
    fontSize: 12
  },
  pillTextInactive: {
    color: '#515C75',
    fontWeight: '600'
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600'
  }
});

export default CategoryScroller;

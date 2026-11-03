import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, typography, radius } from '../../theme';
import { VectorCategoryIcon } from '../illustrations/VectorCategoryIcon';
import { StatusIndicator } from './StatusIndicator';

export const MinimalListRow = ({
  category = 'household',
  title,
  subtitle = null,
  meta = null,
  status = null,
  priority = null,
  onPress = null,
  rightAction = null,
  showDivider = true,
  isCompleted = false
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={[styles.row, showDivider && styles.divider]}
    >
      {/* Category Vector Icon */}
      <View style={styles.iconWrap}>
        <VectorCategoryIcon category={category} size={28} />
      </View>

      {/* Main Text Details */}
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isCompleted && styles.completedTitle]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {priority ? (
            <View style={styles.priorityWrap}>
              <StatusIndicator status={priority} isPriority />
            </View>
          ) : null}
        </View>

        {subtitle ? (
          <Text
            style={[styles.subtitle, isCompleted && styles.completedSubtitle]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}

        {meta ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaText} numberOfLines={1}>{meta}</Text>
            {status ? (
              <View style={styles.statusWrap}>
                <StatusIndicator status={status} />
              </View>
            ) : null}
          </View>
        ) : status ? (
          <View style={styles.metaRow}>
            <View style={styles.statusWrap}>
              <StatusIndicator status={status} />
            </View>
          </View>
        ) : null}
      </View>

      {/* Right action / Chevron */}
      {rightAction ? (
        <View style={styles.rightActionWrap}>{rightAction}</View>
      ) : onPress ? (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6 }}>
          <Path d="M9 18l6-6-6-6" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.listItemInternal,
    paddingHorizontal: spacing.listItemInternal,
    backgroundColor: '#FFFFFF',
    minHeight: spacing.minTouchTarget
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  iconWrap: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC'
  },
  textCol: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8
  },
  priorityWrap: {
    flexShrink: 0
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#94A3B8'
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 4
  },
  completedSubtitle: {
    color: '#94A3B8'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
    marginRight: 6
  },
  statusWrap: {
    flexShrink: 0
  },
  rightActionWrap: {
    marginLeft: 8
  }
});

export default MinimalListRow;

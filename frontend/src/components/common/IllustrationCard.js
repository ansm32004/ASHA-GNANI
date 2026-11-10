import { tr } from '../../localisation/tr';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../theme';
import { SchemeHeroIllustration } from '../illustrations/CategoryVectors';

export const IllustrationCard = ({
  badge = 'Health Scheme Update',
  title = 'Janani Suraksha Yojana (JSY)',
  description = 'Institutional delivery assistance for registered mothers in Rampur Kalan. ₹1,400 direct benefit to eligible rural mothers, with ₹600 ASHA accompaniment incentive.',
  actionText = 'View guidelines',
  onPressAction,
  illustration = null
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        <View style={styles.textCol}>
          <View style={styles.badgePill}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
              <Circle cx="12" cy="8" r="6" stroke="#0D9488" strokeWidth="2" fill="#CCFBF1" />
              <Path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5" stroke="#0D9488" strokeWidth="2" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.badgeText}>{tr(badge)}</Text>
          </View>
          <Text style={styles.titleText}>{tr(title)}</Text>
          <Text style={styles.descText}>{tr(description)}</Text>

          {onPressAction && (
            <TouchableOpacity
              onPress={onPressAction}
              activeOpacity={0.75}
              style={styles.actionBtn}
              accessibilityLabel={tr(actionText)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.actionText}>{tr(actionText)}</Text>
                <Ionicons name="chevron-forward" size={13} color="#0F766E" style={{ marginLeft: 2 }} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.illustrationWrap}>
          {illustration || <SchemeHeroIllustration width={80} height={72} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0FDFA',
    borderRadius: radius.card,
    padding: spacing.cardInternal,
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.06)'
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  textCol: {
    flex: 1,
    marginRight: 12
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  badgeText: {
    fontSize: 10,
    color: '#0F766E',
    fontWeight: '600',
  },
  titleText: {
    fontSize: 16,
    color: '#134E4A',
    fontWeight: '600',
    marginBottom: 4
  },
  descText: {
    fontSize: 13,
    color: '#3A4560',
    lineHeight: 18,
    marginBottom: 10
  },
  actionBtn: {
    minHeight: 36,
    justifyContent: 'center',
    alignSelf: 'flex-start'
  },
  actionText: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '600'
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4
  }
});

export default IllustrationCard;

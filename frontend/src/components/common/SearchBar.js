import { tr } from '../../localisation/tr';
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, typography, radius, shadows } from '../../theme';

export const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search households, beneficiaries, or tasks...',
  onClear,
  style = null
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchIcon}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="7" stroke="#98A2B8" strokeWidth="2.2" />
          <Path d="m20 20-3.5-3.5" stroke="#98A2B8" strokeWidth="2.2" strokeLinecap="round" />
        </Svg>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={tr(placeholder)}
        placeholderTextColor="#98A2B8"
        style={styles.input}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity
          onPress={onClear || (() => onChangeText(''))}
          style={styles.clearBtn}
          accessibilityLabel={tr('Clear search')}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="9" fill="#98A2B8" />
            <Path d="M15 9l-6 6M9 9l6 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    height: 52,
    paddingHorizontal: 18,
    marginHorizontal: spacing.screenHorizontal,
    marginVertical: 8,
    ...shadows.soft
  },
  searchIcon: {
    marginRight: 10
  },
  input: {
    ...typography.bodyMedium,
    flex: 1,
    color: colors.textPrimary,
    height: '100%',
    padding: 0
  },
  clearBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default SearchBar;

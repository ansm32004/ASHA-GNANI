import { tr } from '../../localisation/tr';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { useLanguageStore } from '../../store/languageStore';
import { SUPPORTED_LANGUAGES } from '../../localisation';
import { useTranslation } from 'react-i18next';

export const LanguageScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const isFromSettings = route?.params?.isFromSettings || false;
  const { uiLanguage, setUiLanguage, voiceLanguage, setVoiceLanguage } = useLanguageStore();
  const [selectedLang, setSelectedLang] = useState(uiLanguage);

  const handleSelectLanguage = (langCode) => {
    setSelectedLang(langCode);
    setUiLanguage(langCode);
    setVoiceLanguage(langCode);
  };

  const handleContinue = () => {
    if (isFromSettings) {
      navigation.goBack();
    } else {
      navigation.navigate('Login');
    }
  };

  const renderLanguageItem = ({ item }) => {
    const isSelected = selectedLang === item.code;
    return (
      <TouchableOpacity
        onPress={() => handleSelectLanguage(item.code)}
        activeOpacity={0.8}
        style={[styles.languageCard, isSelected && styles.selectedCard]}
      >
        <View style={styles.cardLeft}>
          <Text style={[styles.nativeName, isSelected && styles.selectedText]}>{tr(item.name)}</Text>
          <Text style={styles.englishName}>
            {tr(item.englishName)} • {tr(item.script)}
          </Text>
        </View>

        <View style={styles.cardRight}>
          {!item.isReady && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>{tr('Upcoming')}</Text>
            </View>
          )}
          <View style={[styles.radioCircle, isSelected && styles.selectedRadio]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={t('auth.selectLanguage') || 'Select Language'}
        subtitle={t('auth.languageSubtitle') || 'Choose your preferred working language'}
        showBack={isFromSettings}
        onBack={() => navigation.goBack()}
        showLanguageToggle={false}
      />

      <View style={styles.content}>
        <FlatList
          data={SUPPORTED_LANGUAGES}
          keyExtractor={(item) => item.code}
          renderItem={renderLanguageItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.bottomBar}>
          <AppButton
            title={isFromSettings ? t('common.save') || 'Save' : t('common.next') || 'Next'}
            onPress={handleContinue}
            size="large"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding
  },
  listContainer: {
    paddingVertical: spacing.sm
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.card,
    marginVertical: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.soft
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  cardLeft: {
    flex: 1
  },
  nativeName: {
    ...typography.heading3,
    color: colors.textPrimary
  },
  selectedText: {
    color: colors.primary,
    fontWeight: '600'
  },
  englishName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  comingSoonBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginRight: spacing.sm
  },
  comingSoonText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedRadio: {
    borderColor: colors.primary
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.ink
  },
  bottomBar: {
    paddingVertical: spacing.md
  }
});

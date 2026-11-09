import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

/**
 * Standardized semantic icon map for SAHAYIKA.
 * Guarantees uniform stroke weight, corner radii, and outlined healthcare design language.
 */
const ICON_MAP = {
  // Navigation & Core
  home: 'home-outline',
  'home-active': 'home',
  profile: 'person-outline',
  'profile-active': 'person',
  family: 'people-outline',
  'family-active': 'people',
  people: 'people-outline',
  tasks: 'checkbox-outline',
  'tasks-active': 'checkbox',
  assistant: 'sparkles-outline',
  'assistant-active': 'sparkles',
  reminders: 'calendar-outline',
  'reminders-active': 'calendar',

  // Healthcare & Clinical Domains
  health: 'medkit-outline',
  records: 'document-text-outline',
  maternal: 'female-outline',
  pregnant: 'female-outline',
  infant: 'happy-outline',
  child: 'happy-outline',
  vaccine: 'shield-checkmark-outline',
  medicine: 'medkit-outline',
  heart: 'heart-outline',
  bp: 'heart-outline',
  temperature: 'thermometer-outline',
  vitals: 'pulse-outline',

  // Actions & Controls
  mic: 'mic-outline',
  'mic-active': 'mic',
  audio: 'volume-high-outline',
  play: 'play-outline',
  pause: 'pause-outline',
  search: 'search-outline',
  calendar: 'calendar-outline',
  clock: 'time-outline',
  time: 'time-outline',
  location: 'location-outline',
  pin: 'location-outline',
  notifications: 'notifications-outline',
  settings: 'settings-outline',
  filter: 'filter-outline',
  refresh: 'sync-outline',
  sync: 'sync-outline',
  call: 'call-outline',
  phone: 'call-outline',
  chat: 'chatbubble-outline',
  add: 'add-outline',
  close: 'close-outline',
  arrow_right: 'chevron-forward-outline',
  chevron_right: 'chevron-forward',
  arrow_left: 'chevron-back-outline',
  chevron_left: 'chevron-back',
  eye: 'eye-outline',
  eye_off: 'eye-off-outline',

  // Status & Safety
  check: 'checkmark-circle-outline',
  completed: 'checkmark-circle',
  success: 'checkmark-circle-outline',
  warning: 'alert-circle-outline',
  alert: 'alert-circle-outline',
  high_risk: 'alert-circle',
  danger: 'alert-circle',
  sos: 'warning-outline',
  emergency: 'warning-outline',
  shield: 'shield-checkmark-outline',
  info: 'information-circle-outline',
  help: 'help-circle-outline'
};

/**
 * AppIcon Component
 * Centralizes all iconography with consistent outlined healthcare aesthetics.
 */
export const AppIcon = ({
  name = 'help',
  size = 20,
  color = colors.textPrimary,
  style = null
}) => {
  const iconKey = String(name || '').toLowerCase().trim();
  const resolvedName = ICON_MAP[iconKey] || (iconKey.includes('-') ? iconKey : `${iconKey}-outline`);

  return (
    <Ionicons
      name={resolvedName}
      size={size}
      color={color}
      style={style}
    />
  );
};

export default AppIcon;

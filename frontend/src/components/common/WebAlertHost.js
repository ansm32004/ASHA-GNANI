import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, radius, spacing, shadows } from '../../theme';
import { tr } from '../../localisation/tr';

// React Native Web's Alert.alert does nothing, so on the web confirmations and
// their button callbacks never ran. This shows them in an in-app dialog instead.
let pushAlert = null;
const pending = [];

export const installWebAlert = () => {
  if (Platform.OS !== 'web') return;
  Alert.alert = (title, message, buttons) => {
    const item = {
      title,
      message,
      buttons: Array.isArray(buttons) && buttons.length ? buttons : [{ text: 'OK' }]
    };
    if (pushAlert) pushAlert(item);
    else pending.push(item);
  };
};

export const WebAlertHost = () => {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    pushAlert = (item) => setQueue((q) => [...q, item]);
    if (pending.length) setQueue((q) => [...q, ...pending.splice(0)]);
    return () => {
      pushAlert = null;
    };
  }, []);

  const current = queue[0];
  if (!current) return null;

  const close = (button) => {
    setQueue((q) => q.slice(1));
    if (button && typeof button.onPress === 'function') button.onPress();
  };
  const cancelButton = current.buttons.find((b) => b.style === 'cancel');

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => close(cancelButton)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {current.title ? <Text style={styles.title}>{tr(current.title)}</Text> : null}
          {current.message ? <Text style={styles.message}>{tr(current.message)}</Text> : null}
          <View style={styles.actions}>
            {current.buttons.map((button, index) => {
              const isPrimary = index === current.buttons.length - 1 && button.style !== 'cancel';
              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  onPress={() => close(button)}
                  activeOpacity={0.85}
                  style={[styles.button, isPrimary ? styles.primary : styles.secondary]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isPrimary && styles.primaryText,
                      button.style === 'destructive' && styles.destructiveText
                    ]}
                  >
                    {tr(button.text || 'OK')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 32, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.floating
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary
  },
  message: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.sm
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primary: {
    backgroundColor: colors.ink
  },
  secondary: {
    backgroundColor: colors.surfaceSecondary
  },
  buttonText: {
    ...typography.button,
    color: colors.textPrimary
  },
  primaryText: {
    color: colors.textWhite
  },
  destructiveText: {
    color: colors.danger
  }
});

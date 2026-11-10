import { tr } from '../../localisation/tr';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme';
import { MinimalHeader } from '../../components/common/MinimalHeader';
import { MinimalListRow } from '../../components/common/MinimalListRow';
import { notificationApi } from '../../services/api/notificationApi';

export const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifs = async () => {
    setLoading(true);
    const list = await notificationApi.getNotifications();
    const safeList = Array.isArray(list) ? [...list] : [];
    safeList.sort((a, b) => {
      const isJustNowA = (a.timestamp || '').toLowerCase().includes('just now');
      const isJustNowB = (b.timestamp || '').toLowerCase().includes('just now');
      if (isJustNowA && !isJustNowB) return -1;
      if (!isJustNowA && isJustNowB) return 1;
      const timeA = new Date(a.created_at || 0).getTime() || 0;
      const timeB = new Date(b.created_at || 0).getTime() || 0;
      if (timeA && timeB) return timeB - timeA;
      return 0;
    });
    setNotifications(safeList);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkRead = async (id) => {
    await notificationApi.markAsRead(id);
    await loadNotifs();
  };

  const handleMarkAll = async () => {
    await notificationApi.markAllAsRead();
    await loadNotifs();
  };

  const handleNotifPress = async (item) => {
    await handleMarkRead(item.id);
    if (item.action_type === 'request' || (item.category || '').toLowerCase().includes('request')) {
      navigation.navigate('CommunityRequests');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MinimalHeader
        title="Notifications"
        subtitle="Reminders, requests & alerts"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={handleMarkAll} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>{tr('Mark all read')}</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <MinimalListRow
            category={item.category}
            title={item.title}
            subtitle={item.message}
            meta={`${tr(item.category)} • ${tr(item.timestamp)}`}
            priority={item.priority}
            showDivider={index < notifications.length - 1}
            onPress={() => handleNotifPress(item)}
            rightAction={
              !item.is_read ? <View style={styles.unreadDot} /> : null
            }
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight
  },
  markAllText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary
  },
  listContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.sm,
    paddingBottom: 110,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.ink
  }
});

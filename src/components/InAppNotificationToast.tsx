import React, { useEffect } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../theme/colors';

export interface ToastData {
  title: string;
  message: string;
  matchId?: string;
}

interface InAppNotificationToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  onPress?: () => void;
}

export const InAppNotificationToast: React.FC<InAppNotificationToastProps> = ({
  toast,
  onDismiss,
  onPress,
}) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (onPress) onPress();
          onDismiss();
        }}
        style={styles.toastCard}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🔔</Text>
        </View>
        <View style={styles.contentCol}>
          <Text style={styles.titleText}>{toast.title}</Text>
          <Text style={styles.messageText}>{toast.message}</Text>
          <Text style={styles.hintText}>Tocca per vedere i commenti e le reazioni 💬</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 48,
    left: 14,
    right: 14,
    zIndex: 99999,
  },
  toastCard: {
    backgroundColor: '#182438',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconEmoji: {
    fontSize: 20,
  },
  contentCol: {
    flex: 1,
  },
  titleText: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  hintText: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});

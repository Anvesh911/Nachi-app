// app/(tabs)/settings.tsx

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore, THEME_LIST, ThemeName, Typography, Spacing, Radius } from '../../src/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { Colors, themeName, setTheme } = useThemeStore();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: Colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 100 }}
    >
      <Text style={[Typography.displayM, { color: Colors.textPrimary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xxl }]}>
        Settings
      </Text>

      <Text style={[styles.section, { color: Colors.textMuted }]}>APPEARANCE</Text>

      {THEME_LIST.map((t) => (
        <TouchableOpacity
          key={t.name}
          style={[
            styles.row,
            {
              backgroundColor: Colors.surface,
              borderColor: themeName === t.name ? Colors.neonBlue : Colors.border,
            },
          ]}
          onPress={() => setTheme(t.name as ThemeName)}
          activeOpacity={0.7}
        >
          <Text style={styles.rowIcon}>{t.emoji}</Text>
          <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>{t.label}</Text>
          {themeName === t.name && (
            <Text style={{ color: Colors.neonBlue, fontFamily: 'Sora_700Bold', fontSize: 16 }}>✓</Text>
          )}
        </TouchableOpacity>
      ))}

      <Text style={[styles.section, { color: Colors.textMuted }]}>APP</Text>

      <View style={[styles.row, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
        <Text style={styles.rowIcon}>🌙</Text>
        <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>AnVy</Text>
        <Text style={{ color: Colors.textMuted, fontFamily: 'Sora_400Regular', fontSize: 12 }}>v1.0.0</Text>
      </View>

      <View style={[styles.row, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
        <Text style={styles.rowIcon}>🔒</Text>
        <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>Storage</Text>
        <Text style={{ color: Colors.textMuted, fontFamily: 'Sora_400Regular', fontSize: 12 }}>Offline · Private</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  section: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  rowIcon: { fontSize: 20 },
  rowLabel: { flex: 1, fontFamily: 'Sora_600SemiBold', fontSize: 14 },
});

import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { router } from 'expo-router';
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from 'expo-router/unstable-native-tabs';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../contexts/I18nContext';
import { usePrayerLogs, calculateTotalAyahs } from '../../hooks/useOfflineData';
import { getVerseStatus } from '../../utils/quranData';

type TabWithPlatformIcons = {
  name: string;
  label: string;
  iosIcon: { default: string; selected: string };
  androidIcon: { family: typeof Feather | typeof MaterialIcons; name: string };
};

type TabWithVectorIcon = {
  name: string;
  label: string;
  vectorIcon: { family: typeof Ionicons; name: 'calculator-outline' };
};

type Tab = TabWithPlatformIcons | TabWithVectorIcon;

function hasVectorIcon(tab: Tab): tab is TabWithVectorIcon {
  return 'vectorIcon' in tab;
}

export default function TabLayout() {
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const hasGlassEffect = isLiquidGlassAvailable();
  const { logs } = usePrayerLogs(1);

  const lastEntry = logs.length > 0 ? logs[0] : null;
  const statusColor = lastEntry
    ? getVerseStatus(calculateTotalAyahs(lastEntry.recitations)).color
    : '#ffffff';

  const tabs: Tab[] = [
    {
      name: 'index',
      label: t('nightPrayer'),
      iosIcon: { default: 'moon', selected: 'moon.fill' },
      androidIcon: { family: Feather, name: 'moon' },
    },
    {
      name: 'calculator',
      label: t('verseCalculator'),
      vectorIcon: { family: Ionicons, name: 'calculator-outline' },
    },
    {
      name: 'history',
      label: t('history'),
      iosIcon: { default: 'clock', selected: 'clock.fill' },
      androidIcon: { family: MaterialIcons, name: 'history' },
    },
    {
      name: 'settings',
      label: t('settings'),
      iosIcon: { default: 'gearshape', selected: 'gearshape.fill' },
      androidIcon: { family: Feather, name: 'settings' },
    },
  ];

  const orderedTabs = isRTL ? [...tabs].reverse() : tabs;

  const renderIcon = (tab: Tab) => {
    if (hasVectorIcon(tab)) {
      return (
        <Icon
          src={
            <VectorIcon
              family={tab.vectorIcon.family}
              name={tab.vectorIcon.name}
            />
          }
        />
      );
    }

    return Platform.select({
      ios: <Icon sf={tab.iosIcon as any} />,
      android: (
        <Icon
          src={
            <VectorIcon
              family={tab.androidIcon.family as typeof Feather}
              name={tab.androidIcon.name as any}
            />
          }
        />
      ),
    });
  };

  return (
    <View style={styles.container}>
      <NativeTabs
        labelStyle={{
          color: 'rgba(255, 255, 255, 0.7)', // Subtle unselected state
        }}
        // tintColor={statusColor}
        tintColor={'white'}
        backgroundColor="#0f0f0f"
        disableTransparentOnScrollEdge={true}
        disableIndicator={true}
      >
        {orderedTabs.map((tab) => (
          <NativeTabs.Trigger key={tab.name} name={tab.name}>
            <Label>{tab.label}</Label>
            {renderIcon(tab)}
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>

      {/* Floating Action Button */}
      {hasGlassEffect ? (
        <View
          style={[
            styles.glassWrapper,
            {
              bottom: insets.bottom + 60,
              right: isRTL ? undefined : 35,
              left: isRTL ? 35 : undefined,
              width: 64,
              height: 64,
            },
          ]}
          pointerEvents="box-none"
        >
          <GlassView
            style={styles.fabGlass}
            glassEffectStyle="regular"
            // glassEffectStyle="clear"
            // tintColor="rgba(140, 142, 239, 0.4)"
            isInteractive
          >
            <TouchableOpacity
              style={styles.fabContent}
              onPress={() => router.push('/add-prayer')}
              activeOpacity={0.9}
            >
              <Ionicons
                name="add"
                size={32}
                // color={statusColor}
                color={'#ffffff'}
              />
            </TouchableOpacity>
          </GlassView>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.fab,
            styles.fabModern,
            {
              bottom: insets.bottom + 70,
              right: isRTL ? undefined : 20,
              left: isRTL ? 20 : undefined,
              // borderColor: `${statusColor}40`,
              borderColor: `rgba(47, 47, 47, 0.7)`,
              backgroundColor: '#0f0f0f', // Matches Calculator surfaces
            },
          ]}
          onPress={() => router.push('/add-prayer')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.fabInnerGlow,
              { backgroundColor: `${statusColor}5` },
            ]}
          />
          <Ionicons
            name="add"
            size={32}
            // color={statusColor}
            color={'#rgba(255, 255, 255, 0.7)'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glassWrapper: {
    position: 'absolute',
    zIndex: 10,
  },
  fab: {
    position: 'absolute',
    width: 64,
    height: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  fabModern: {
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  fabInnerGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  fabGlass: {
    width: 60,
    height: 60,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  fabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});

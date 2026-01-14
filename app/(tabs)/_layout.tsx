import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { router } from 'expo-router';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../contexts/I18nContext';

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
      return <Icon src={<VectorIcon family={tab.vectorIcon.family} name={tab.vectorIcon.name} />} />;
    }

    return Platform.select({
      ios: <Icon sf={tab.iosIcon as any} />,
      android: <Icon src={<VectorIcon family={tab.androidIcon.family as typeof Feather} name={tab.androidIcon.name as any} />} />,
    });
  };

  return (
    <View style={styles.container}>
      <NativeTabs
        labelStyle={{
          color: 'white',
        }}
        tintColor='white'
        disableTransparentOnScrollEdge={false}
      >
        {orderedTabs.map((tab) => (
          <NativeTabs.Trigger key={tab.name} name={tab.name}>
            <Label>{tab.label}</Label>
            {renderIcon(tab)}
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 70,
            right: isRTL ? undefined : 20,
            left: isRTL ? 20 : undefined,
          },
        ]}
        onPress={() => router.push('/add-prayer')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

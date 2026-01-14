import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
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

  const tabs: Tab[] = [
    {
      name: 'index',
      label: t('nightPrayer'),
      iosIcon: { default: 'moon', selected: 'moon.fill' },
      androidIcon: { family: Feather, name: 'moon' },
    },
    {
      name: 'add',
      label: t('addPrayer'),
      iosIcon: { default: 'plus.circle', selected: 'plus.circle.fill' },
      androidIcon: { family: Feather, name: 'plus-circle' },
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
  );
}

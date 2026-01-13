import { Feather, MaterialIcons } from '@expo/vector-icons';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { useI18n } from '../../contexts/I18nContext';

export default function TabLayout() {
  const { t, isRTL } = useI18n();

  const tabs = [
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

  return (
    <NativeTabs
      labelStyle={{
        color: 'white',
      }}
      tintColor='white'
      // minimizeBehavior="onScrollDown"
      disableTransparentOnScrollEdge={false}  // Allows transparency
    >
      {orderedTabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <Label>{tab.label}</Label>
          {Platform.select({
            ios: <Icon sf={tab.iosIcon} />,
            android: <Icon src={<VectorIcon family={tab.androidIcon.family} name={tab.androidIcon.name} />} />,
          })}
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
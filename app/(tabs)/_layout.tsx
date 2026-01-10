import { Feather, MaterialIcons } from '@expo/vector-icons';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useI18n();

  // Dynamic colors for liquid glass on iOS
  const textColor = DynamicColorIOS({
    dark: 'white',
    light: 'black',
  });

  const tintColor = DynamicColorIOS({
    dark: 'white',
    light: theme.primary,
  });

  return (
    <NativeTabs
      labelStyle={{
        color: textColor,
      }}
      tintColor={tintColor}
    >
      <NativeTabs.Trigger name="index">
        <Label>{t('nightPrayer')}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'moon', selected: 'moon.fill' }} />,
          android: <Icon src={<VectorIcon family={Feather} name="moon" />} />,
        })}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="add">
        <Label>{t('addPrayer')}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} />,
          android: <Icon src={<VectorIcon family={Feather} name="plus-circle" />} />,
        })}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <Label>{t('history')}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'clock', selected: 'clock.fill' }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="history" />} />,
        })}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Label>{t('settings')}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />,
          android: <Icon src={<VectorIcon family={Feather} name="settings" />} />,
        })}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
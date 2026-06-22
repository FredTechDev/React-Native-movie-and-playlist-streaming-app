import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundSelected}
      labelStyle={{
        selected: { color: colors.text, fontWeight: '800', fontSize: 10 },
      }}
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon src={require('@/assets/images/tabIcons/home.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <Label>Explore</Label>
        <Icon src={require('@/assets/images/tabIcons/explore.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="reels">
        <Label>Reels</Label>
        <Icon src={require('@/assets/images/tabIcons/reels.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="creator">
        <Label>Creator</Label>
        <Icon src={require('@/assets/images/tabIcons/creator.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="downloads">
        <Label>Downloads</Label>
        <Icon src={require('@/assets/images/tabIcons/downloads.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon src={require('@/assets/images/tabIcons/profile.png')} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

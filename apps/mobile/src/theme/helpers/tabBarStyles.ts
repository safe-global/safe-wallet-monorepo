import { useTheme } from 'tamagui'
import { TextStyle } from 'react-native'

export interface TabBarStylesOptions {
  theme: ReturnType<typeof useTheme>
  tabBarItemWidth?: number
  tabBarIndicatorWidth?: number
  tabBarLabelFontSize?: number
  tabBarLabelFontWeight?: TextStyle['fontWeight']
  tabBarItemLeft?: number
}

export const getMaterialTopTabBarScreenOptions = ({
  theme,
  tabBarItemWidth = 104,
  tabBarIndicatorWidth = 78,
  tabBarLabelFontSize = 14,
  tabBarLabelFontWeight = '600',
  tabBarItemLeft = -6,
}: TabBarStylesOptions) => ({
  tabBarButtonTestID: 'tab-bar-buttons',
  tabBarStyle: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
  },
  tabBarItemStyle: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    width: tabBarItemWidth,
    alignSelf: 'center' as const,
    borderBottomWidth: 0,
    left: tabBarItemLeft,
  },
  tabBarIndicatorStyle: {
    backgroundColor: theme?.color?.get(),
    width: tabBarIndicatorWidth,
    marginLeft: 6,
    alignItems: 'center' as const,
  },
  tabBarLabelStyle: {
    color: theme?.color?.get(),
    fontSize: tabBarLabelFontSize,
    fontWeight: tabBarLabelFontWeight,
  } as TextStyle,
})

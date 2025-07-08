import { styled, Theme, ThemeName, YStack, YStackProps } from 'tamagui'

const StyledYStack = styled(YStack, {
  variants: {
    bordered: {
      true: {
        borderColor: '#303033',
        borderWidth: 1,
      },
      false: {
        backgroundColor: '$background',
      },
    },
    transparent: {
      true: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
    },
  } as const,
})

export const Container = (
  props: YStackProps & { bordered?: boolean; spaced?: boolean; transparent?: boolean; themeName?: ThemeName },
) => {
  const { children, bordered, themeName = 'container', spaced = true, ...rest } = props

  return (
    <Theme name={themeName}>
      <StyledYStack
        bordered={!!bordered}
        borderRadius={'$3'}
        paddingHorizontal={spaced ? '$4' : 0}
        paddingVertical={'$4'}
        {...rest}
      >
        {children}
      </StyledYStack>
    </Theme>
  )
}

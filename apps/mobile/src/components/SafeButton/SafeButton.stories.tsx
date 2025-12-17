import type { Meta, StoryObj } from '@storybook/react'
import { SafeButton } from '@/src/components/SafeButton'
import { action } from '@storybook/addon-actions'
import { YStack, Text, XStack, ScrollView } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import React from 'react'

const meta: Meta<typeof SafeButton> = {
  title: 'SafeButton',
  component: SafeButton,
  args: {
    onPress: action('onPress'),
  },
}

export default meta

type Story = StoryObj<typeof SafeButton>

export const Primary: Story = {
  render: (args) => {
    return <RenderScreen type={'primary'} args={args} />
  },
}

type RenderScreenProps = {
  type: 'primary' | 'secondary' | 'danger' | 'text'
  args: Meta['args']
}
const RenderScreen = ({ type, args }: RenderScreenProps) => {
  return (
    <ScrollView>
      <YStack paddingHorizontal={10} gap={10}>
        <Text>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
        <YStack gap={10} alignItems={'flex-start'}>
          <SafeButton {...args} {...{ [type]: true }}>
            Play
          </SafeButton>
          <Text>With Symbol</Text>
          <SafeButton {...args} {...{ [type]: true }} icon={<SafeFontIcon name={'plus'} />}>
            Play
          </SafeButton>
          <Text>Disabled</Text>
          <SafeButton {...args} {...{ [type]: true }} disabled>
            Play
          </SafeButton>
          <Text>Disabled with symbol</Text>
          <SafeButton {...args} {...{ [type]: true }} disabled icon={<SafeFontIcon name={'plus'} />}>
            Play
          </SafeButton>
        </YStack>
        <YStack gap={10}>
          <Text>Fullscreen</Text>
          <Text>{type.charAt(0).toUpperCase() + type.slice(1)} fullscreen in YStack</Text>
          <SafeButton {...args} {...{ [type]: true }}>
            Play
          </SafeButton>
          <Text>{type.charAt(0).toUpperCase() + type.slice(1)} fullscreen in XStack</Text>
          <XStack gap={10}>
            <SafeButton {...args} {...{ [type]: true }} flex={1}>
              Play
            </SafeButton>
          </XStack>
        </YStack>
        <Text>Small</Text>
        <YStack gap={10}>
          <Text>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          <YStack gap={10} alignItems={'flex-start'}>
            <SafeButton {...args} {...{ [type]: true }} size={'$sm'}>
              Play
            </SafeButton>
            <Text>With Symbol</Text>
            <SafeButton {...args} {...{ [type]: true }} icon={<SafeFontIcon name={'plus'} />} size={'$sm'}>
              Play
            </SafeButton>
            <Text>Disabled</Text>
            <SafeButton {...args} {...{ [type]: true }} disabled size={'$sm'}>
              Play
            </SafeButton>
            <Text>Disabled with symbol</Text>
            <SafeButton {...args} {...{ [type]: true }} disabled icon={<SafeFontIcon name={'plus'} />} size={'$sm'}>
              Play
            </SafeButton>
          </YStack>
          <YStack gap={10}>
            <Text>Fullscreen</Text>
            <Text>{type.charAt(0).toUpperCase() + type.slice(1)} fullscreen in YStack</Text>
            <SafeButton {...args} {...{ [type]: true }} size={'$sm'}>
              Play
            </SafeButton>
            <Text>{type.charAt(0).toUpperCase() + type.slice(1)} fullscreen in XStack</Text>
            <XStack gap={10}>
              <SafeButton {...args} {...{ [type]: true }} flex={1} size={'$sm'}>
                Play
              </SafeButton>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  )
}

export const Secondary: Story = {
  render: (args) => {
    return <RenderScreen type={'secondary'} args={args} />
  },
}

export const Danger: Story = {
  render: (args) => {
    return <RenderScreen type={'danger'} args={args} />
  },
}

export const OnlyText: Story = {
  render: (args) => {
    return <RenderScreen type={'text'} args={args} />
  },
}

export const Circle: Story = {
  render: (args) => {
    return (
      <ScrollView>
        <Text>Primary round</Text>
        <SafeButton {...args} primary circle icon={<SafeFontIcon name={'plus'} />} />
        <Text>Secondary round</Text>
        <SafeButton {...args} secondary circle icon={<SafeFontIcon name={'plus'} />} />
        <Text>Disabled</Text>
        <SafeButton {...args} circle disabled icon={<SafeFontIcon name={'plus'} />} />
      </ScrollView>
    )
  },
}

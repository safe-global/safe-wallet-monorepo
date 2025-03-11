import React from 'react'
import { SafeInput, SafeInputProps } from './SafeInput'
import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'tamagui'

const SafeInputMeta: Meta = {
  title: 'Components/SafeInput',
  component: SafeInput,
  decorators: [
    (Story) => (
      <View padding={16}>
        <Story />
      </View>
    ),
  ],
  args: {
    height: 52,
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    value: {
      control: 'text',
      description: 'Input value',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
    multiline: {
      control: 'boolean',
      description: 'Enable multiline input',
    },
    textAlign: {
      control: {
        type: 'select',
        options: ['left', 'center', 'right'],
      },
      description: 'Text alignment',
    },
  },
}

export default SafeInputMeta

type SafeInputStory = StoryObj<typeof SafeInput>

export const Default: SafeInputStory = (args: SafeInputProps) => <SafeInput {...args} />
Default.args = {
  placeholder: 'Enter text...',
  value: '',
}

export const WithError: SafeInputStory = (args: SafeInputProps) => <SafeInput {...args} />
WithError.args = {
  placeholder: 'Enter text...',
  value: 'Invalid input',
  error: 'This is an error message',
}

export const Multiline: SafeInputStory = (args: SafeInputProps) => <SafeInput {...args} />
Multiline.args = {
  placeholder: 'Enter multiple lines...',
  value: '',
  multiline: true,
  height: 100,
}

export const CenteredText: SafeInputStory = (args: SafeInputProps) => <SafeInput {...args} />
CenteredText.args = {
  placeholder: 'Centered text...',
  value: 'This text is centered',
  textAlign: 'center',
}

export const WithLongText: SafeInputStory = (args: SafeInputProps) => <SafeInput {...args} />
WithLongText.args = {
  placeholder: 'Enter text...',
  value: 'This is a very long text that should wrap to multiple lines when it exceeds the width of the input component',
  multiline: true,
  height: 100,
}

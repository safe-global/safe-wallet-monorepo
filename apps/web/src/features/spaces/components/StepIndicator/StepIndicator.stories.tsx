import type { Meta, StoryObj } from '@storybook/react'
import StepIndicator from '.'

const meta = {
  title: 'Pages/Onboarding/StepIndicator',
  component: StepIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StepIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Step1: Story = {
  args: {
    currentStep: 1,
    totalSteps: 4,
  },
}

export const Step2: Story = {
  args: {
    currentStep: 2,
    totalSteps: 4,
  },
}

export const Step3: Story = {
  args: {
    currentStep: 3,
    totalSteps: 4,
  },
}

export const Step4: Story = {
  args: {
    currentStep: 4,
    totalSteps: 4,
  },
}

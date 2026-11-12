import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { TrialPlanCard } from './TrialPlanParts'
import type { TrialSize } from './types'

const STARTER_SUBTITLE = 'Coordinate your team with a shared home for your Safes and transactions.'
const BUSINESS_SUBTITLE = 'Scale with control. Delegate daily operations with hands-on help.'

const SIZES: TrialSize[] = [
  {
    paymentLinkId: 'plink_2',
    seats: 2,
    planName: 'Starter',
    subtitle: STARTER_SUBTITLE,
    monthlyPrice: 189,
    currency: 'eur',
  },
  {
    paymentLinkId: 'plink_5',
    seats: 5,
    planName: 'Business',
    subtitle: BUSINESS_SUBTITLE,
    monthlyPrice: 669,
    currency: 'eur',
  },
  {
    paymentLinkId: 'plink_10',
    seats: 10,
    planName: 'Business',
    subtitle: BUSINESS_SUBTITLE,
    monthlyPrice: 999,
    currency: 'eur',
  },
  {
    paymentLinkId: 'plink_20',
    seats: 20,
    planName: 'Business',
    subtitle: BUSINESS_SUBTITLE,
    monthlyPrice: 1669,
    currency: 'eur',
  },
]

const Interactive = ({ initial }: { initial: TrialSize }) => {
  const [value, setValue] = useState(initial)
  return <TrialPlanCard sizes={SIZES} value={value} onChange={setValue} trialPeriodDays={30} />
}

const meta = {
  title: 'Features/Spaces/Plans/TrialPlanCard',
  component: Interactive,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Interactive>

export default meta
type Story = StoryObj<typeof meta>

export const Starter: Story = { args: { initial: SIZES[0] } }

export const Business10: Story = { args: { initial: SIZES[2] } }

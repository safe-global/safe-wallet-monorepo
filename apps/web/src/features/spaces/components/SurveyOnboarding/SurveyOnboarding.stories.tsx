import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse, delay } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import type { SurveyStateDto } from '@safe-global/store/gateway/AUTO_GENERATED/surveys'
import SurveyOnboarding from '.'

const SURVEY_STATE_URL = /\/v1\/spaces\/[\w-]+\/surveys\/[\w-]+\/state$/

const onboardingSurveyState: SurveyStateDto = {
  survey: {
    id: 1,
    slug: 'onboarding',
    version: 1,
    title: 'Space Onboarding Survey',
    subtitle: 'Per-Space onboarding questionnaire',
    surveyContent: {
      pages: [
        {
          id: 'use_cases',
          title: 'How will you use Safe?',
          subtitle: "Select all that apply. We'll tailor your setup.",
          multiSelect: true,
          options: [
            {
              key: 'operate_protocol',
              label: 'Operate a protocol',
              description: 'Contract admin, upgrades, and governance.',
              icon: 'terminal',
            },
            {
              key: 'distribute_tokens',
              label: 'Distribute tokens',
              description: 'Vesting schedules, grants, and incentives.',
              icon: 'gift',
            },
            {
              key: 'run_payments',
              label: 'Run payments',
              description: 'Payroll, vendors, and recurring payouts.',
              icon: 'cash',
            },
            {
              key: 'earn_yield',
              label: 'Earn yield',
              description: 'Stake, lend, and run DeFi strategies.',
              icon: 'sprout',
            },
            {
              key: 'trade_liquidity',
              label: 'Trade and provide liquidity',
              description: 'Frequent swaps and market-making.',
              icon: 'swap',
            },
            {
              key: 'hold_assets',
              label: 'Hold assets',
              description: 'Long-term custody with minimal movement.',
              icon: 'bank',
            },
          ],
        },
      ],
    },
  },
  surveyResponse: null,
}

const baseSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/welcome/survey',
  query: { spaceId: 'uuid-1' },
  shadcn: true,
  handlers: [http.get(SURVEY_STATE_URL, () => HttpResponse.json(onboardingSurveyState))],
})

const meta = {
  title: 'Features/Spaces/SurveyOnboarding',
  component: SurveyOnboarding,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...baseSetup.parameters,
  },
  decorators: [baseSetup.decorator],
} satisfies Meta<typeof SurveyOnboarding>

export default meta
type Story = StoryObj<typeof meta>

/** Survey loaded, no selections yet — the "first render" state. */
export const Default: Story = {}

/** Slow network — the spinner should be visible above the (empty) options grid. */
export const Loading: Story = {
  parameters: {
    ...createMockStory({
      scenario: 'efSafe',
      wallet: 'owner',
      features: { spaces: true },
      pathname: '/welcome/survey',
      query: { spaceId: 'uuid-1' },
      shadcn: true,
      handlers: [
        http.get(SURVEY_STATE_URL, async () => {
          await delay('infinite')
          return HttpResponse.json(onboardingSurveyState)
        }),
      ],
    }).parameters,
  },
}

/** Backend down — the destructive alert renders, no cards, no Finish action. */
export const Error: Story = {
  parameters: {
    ...createMockStory({
      scenario: 'efSafe',
      wallet: 'owner',
      features: { spaces: true },
      pathname: '/welcome/survey',
      query: { spaceId: 'uuid-1' },
      shadcn: true,
      handlers: [http.get(SURVEY_STATE_URL, () => HttpResponse.json({ message: 'kaboom' }, { status: 500 }))],
    }).parameters,
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import type { ReactElement } from 'react'
import { ArrowRight, Info, Lock } from 'lucide-react'
import { ProHighlight, highlightSafePro } from '@safe-global/views/components/common/ProHighlight'
import { Alert, AlertDescription, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'

type Plan = 'free' | 'starter' | 'business'
type Feature = 'proposers' | 'spendingLimits'

const FEATURE = {
  proposers: {
    heading: 'Proposers',
    intro:
      'Proposers can suggest transactions but cannot approve or execute them. Signers should review and approve transactions first.',
    name: 'proposers',
    Name: 'Proposers',
  },
  spendingLimits: {
    heading: 'Spending limits',
    intro:
      'You can set rules for specific beneficiaries to access funds from this Safe account without having to collect all signatures.',
    name: 'spending limits',
    Name: 'Spending limits',
  },
} as const

const FreeMessage = ({ feature }: { feature: Feature }) => (
  <Alert variant="subtle">
    <Lock />
    <AlertTitle>
      <Typography variant="paragraph-bold">
        {highlightSafePro(`Adding ${FEATURE[feature].name} requires Safe Pro`)}
      </Typography>
    </AlertTitle>
    <AlertDescription>
      <Typography>Existing ones stay active.</Typography>
      <Button size="action">Explore Safe Pro</Button>
    </AlertDescription>
  </Alert>
)

const StarterMessage = ({ feature }: { feature: Feature }) => (
  <Alert variant="subtle">
    <Lock />
    <AlertTitle>
      <Typography variant="paragraph-bold">
        Upgrade to <ProHighlight>Business</ProHighlight> for policies
      </Typography>
    </AlertTitle>
    <AlertDescription>
      <Typography>
        On Business, {FEATURE[feature].name} are policies you set up from your Workspace. Existing ones stay active.
      </Typography>
      <Button size="action">Upgrade to Business</Button>
    </AlertDescription>
  </Alert>
)

const BusinessMessage = ({ feature }: { feature: Feature }) => (
  <Alert variant="subtle">
    <Info />
    <AlertTitle>
      <Typography variant="paragraph-bold">{FEATURE[feature].Name} moved to Policies</Typography>
    </AlertTitle>
    <AlertDescription>
      <Typography>
        Add and manage {FEATURE[feature].name} for all your Safe accounts from your Workspace. Existing ones stay
        active.
      </Typography>
      <Button size="action">
        Go to Policies
        <ArrowRight className="size-4" />
      </Button>
    </AlertDescription>
  </Alert>
)

const MESSAGE: Record<Plan, (props: { feature: Feature }) => ReactElement> = {
  free: FreeMessage,
  starter: StarterMessage,
  business: BusinessMessage,
}

const SettingsSection = ({ plan, feature }: { plan: Plan; feature: Feature }) => {
  const Message = MESSAGE[plan]
  return (
    <div className="bg-card text-card-foreground max-w-[1000px] rounded-lg p-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row">
        <div className="lg:w-1/5 lg:shrink-0">
          <Typography variant="h4" className="font-bold">
            {FEATURE[feature].heading}
          </Typography>
        </div>
        <div className="flex flex-col gap-4 lg:min-w-0 lg:flex-1">
          <Typography>{FEATURE[feature].intro}</Typography>
          <Message feature={feature} />
        </div>
      </div>
    </div>
  )
}

const meta = {
  title: 'Prototypes/Settings message by plan',
  component: SettingsSection,
  args: { plan: 'starter', feature: 'proposers' },
  argTypes: {
    plan: { control: 'inline-radio', options: ['free', 'starter', 'business'] },
    feature: { control: 'inline-radio', options: ['proposers', 'spendingLimits'] },
  },
  parameters: { layout: 'padded' },
  tags: ['skip-visual-test'],
} satisfies Meta<typeof SettingsSection>

export default meta
type Story = StoryObj<typeof meta>

export const AllPlans: Story = {
  render: ({ feature }) => (
    <div className="flex flex-col gap-8">
      {(['free', 'starter', 'business'] as const).map((plan) => (
        <div key={plan} className="flex flex-col gap-2">
          <Typography variant="paragraph-small" color="muted">
            {plan === 'free' ? 'Not on Pro (live today)' : plan === 'starter' ? 'Starter plan' : 'Business plan'}
          </Typography>
          <SettingsSection plan={plan} feature={feature} />
        </div>
      ))}
    </div>
  ),
}

export const Free: Story = { args: { plan: 'free' } }
export const Starter: Story = { args: { plan: 'starter' } }
export const Business: Story = { args: { plan: 'business' } }

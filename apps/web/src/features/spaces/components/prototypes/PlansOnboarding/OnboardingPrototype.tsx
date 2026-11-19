import { useState, type ReactElement, type ReactNode } from 'react'
import { ArrowLeftRight, BarChart3, FileCode, Send, Shield, Sparkles, Plus } from 'lucide-react'
import OnboardingFooter from '@safe-global/views/components/common/OnboardingFooter'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Input } from '@safe-global/views/components/ui/input'
import { Link } from '@safe-global/views/components/ui/link'
import { Typography } from '@safe-global/views/components/ui/typography'
import SelectedCounter, { safeLimitTooltip } from '@safe-global/views/features/spaces/components/SelectedCounter'
import SurveyOptionCard from '@safe-global/views/features/spaces/components/SurveyOnboarding/SurveyOptionCard'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import { OnboardingLayout, SafeAppMockup, StepCounter } from '../../OnboardingLayout'
import MockStripeCheckout from './MockStripeCheckout'
import TrialPlanCard from './TrialPlanCard'
import { DEFAULT_SIZE, TRIAL_DAYS, type TrialSize } from './plans'

export type PrototypeStep = 'create' | 'plan' | 'safes' | 'invite' | 'survey'

const STEPS: PrototypeStep[] = ['create', 'plan', 'safes', 'invite', 'survey']

const OWNED_SAFES = [
  'Treasury',
  'Payroll',
  'Grants',
  'Operations',
  'Market making',
  'Vesting',
  'Reserves',
  'Ventures',
].map((name, index) => ({ name, address: `0x${(index + 1).toString(16).repeat(4)}…${(index + 10).toString(16)}f3` }))

const SURVEY_OPTIONS = [
  {
    key: 'operate_protocol',
    label: 'Operate a protocol',
    description: 'Contract admin, upgrades, and governance.',
    Icon: FileCode,
  },
  {
    key: 'distribute_tokens',
    label: 'Distribute tokens',
    description: 'Vesting schedules, grants, and incentives.',
    Icon: Sparkles,
  },
  { key: 'run_payments', label: 'Run payments', description: 'Payroll, vendors, and recurring payouts.', Icon: Send },
  { key: 'earn_yield', label: 'Earn yield', description: 'Stake, lend, and run DeFi strategies.', Icon: BarChart3 },
  {
    key: 'trade_liquidity',
    label: 'Trade and provide liquidity',
    description: 'Frequent swaps and market-making.',
    Icon: ArrowLeftRight,
  },
  { key: 'hold_assets', label: 'Hold assets', description: 'Long-term custody with minimal movement.', Icon: Shield },
]

const Heading = ({ title, subtitle }: { title: string; subtitle: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <Typography variant="h2">{title}</Typography>
    <Typography variant="paragraph" color="muted">
      {subtitle}
    </Typography>
  </div>
)

const toggle = (set: Set<string>, key: string) => {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

/** Story-only five-step onboarding: create, pick a plan, select Safes up to the plan's size, invite, survey → Stripe. */
const OnboardingPrototype = ({ initialStep = 'create' }: { initialStep?: PrototypeStep }): ReactElement => {
  const [step, setStep] = useState(initialStep)
  const [name, setName] = useState(initialStep === 'create' ? '' : 'Treasury Ops')
  const [size, setSize] = useState<TrialSize>(DEFAULT_SIZE)
  const [safes, setSafes] = useState<Set<string>>(new Set())
  const [emails, setEmails] = useState([''])
  const [answers, setAnswers] = useState<Set<string>>(new Set())
  const [isCheckout, setIsCheckout] = useState(false)

  const index = STEPS.indexOf(step)
  const back = () => index > 0 && setStep(STEPS[index - 1])
  const next = () => index < STEPS.length - 1 && setStep(STEPS[index + 1])

  if (isCheckout) return <MockStripeCheckout size={size} onBack={() => setIsCheckout(false)} />

  const screens: Record<PrototypeStep, { main: ReactNode; footer: ReactNode }> = {
    create: {
      main: (
        <>
          <Heading
            title="Create a Workspace"
            subtitle="Your team's home for managing Safes, tracking activity, and collaborating."
          />
          <label className="flex flex-col gap-2 text-sm font-medium">
            Workspace name
            <Input
              variant="surface"
              placeholder="e.g. Treasury Ops, DeFi Team"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        </>
      ),
      footer: <OnboardingFooter continueLabel="Next" onContinue={next} continueDisabled={!name.trim()} />,
    },
    plan: {
      main: (
        <>
          <Heading
            title="Pick your plan"
            subtitle={`Free for ${TRIAL_DAYS} days. Pick how many Safe accounts you need.`}
          />
          <TrialPlanCard
            size={size}
            onSizeChange={(picked) => {
              setSize(picked)
              setSafes(new Set([...safes].slice(0, picked.seats)))
            }}
          />
          <Typography variant="paragraph-small" color="muted">
            No card needed, and you won&apos;t be charged after the trial. More than 20 Safes?{' '}
            <Link href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer">
              Talk to sales
            </Link>
          </Typography>
        </>
      ),
      footer: <OnboardingFooter onBack={back} continueLabel="Next" onContinue={next} />,
    },
    safes: {
      main: (
        <>
          <div className="flex items-end justify-between gap-4">
            <Heading
              title="Add Safe accounts"
              subtitle={`Your ${size.plan} trial includes ${size.seats} Safe accounts.`}
            />
            <SelectedCounter
              count={safes.size}
              limit={size.seats}
              isAtLimit={safes.size >= size.seats}
              tooltip={safeLimitTooltip(size.seats)}
            />
          </div>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {OWNED_SAFES.map((safe) => {
              const isSelected = safes.has(safe.address)
              const isLocked = !isSelected && safes.size >= size.seats
              return (
                <li key={safe.address}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                    <Checkbox
                      checked={isSelected}
                      disabled={isLocked}
                      onCheckedChange={() => setSafes(toggle(safes, safe.address))}
                    />
                    <span className="flex flex-col">
                      <Typography variant="paragraph-small-bold">{safe.name}</Typography>
                      <Typography variant="paragraph-mini" color="muted">
                        {safe.address}
                      </Typography>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </>
      ),
      footer: <OnboardingFooter onBack={back} continueLabel="Next" onContinue={next} />,
    },
    invite: {
      main: (
        <>
          <Heading title="Invite your team" subtitle="Members can view, propose and sign from the Workspace." />
          <div className="flex flex-col gap-3">
            {emails.map((email, row) => (
              <Input
                key={row}
                variant="surface"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => setEmails(emails.map((value, at) => (at === row ? event.target.value : value)))}
              />
            ))}
            <Link render={<button type="button" />} onClick={() => setEmails([...emails, ''])}>
              <Plus className="size-4" /> Add member
            </Link>
          </div>
        </>
      ),
      footer: <OnboardingFooter onBack={back} continueLabel="Next" onContinue={next} />,
    },
    survey: {
      main: (
        <>
          <Heading title="How will you use Safe?" subtitle="Select all that apply. We'll tailor your setup." />
          <div className="grid auto-rows-fr grid-cols-2 gap-3 xl:grid-cols-3">
            {SURVEY_OPTIONS.map(({ Icon, ...option }) => (
              <SurveyOptionCard
                key={option.key}
                option={option}
                Icon={Icon}
                isPressed={answers.has(option.key)}
                onToggle={(key) => setAnswers(toggle(answers, key))}
              />
            ))}
          </div>
          <Typography variant="paragraph-small" color="muted">
            Next, you&apos;ll confirm your {size.plan} ({size.seats} Safes) trial on Stripe. No card needed, and you
            won&apos;t be charged when it ends. Changed your mind? Come back here to switch plans.
          </Typography>
        </>
      ),
      footer: (
        <OnboardingFooter
          onBack={back}
          continueLabel="Start free trial"
          onContinue={() => setIsCheckout(true)}
          continueDisabled={answers.size === 0}
        />
      ),
    },
  }

  const screen = screens[step]

  return (
    <OnboardingLayout
      main={
        <div className="flex flex-col gap-6">
          <StepCounter currentStep={index + 1} totalSteps={STEPS.length} />
          {screen.main}
        </div>
      }
      footer={screen.footer}
      sidePanel={<SafeAppMockup name={name} highlight={step === 'create' ? 'switcher' : 'accounts'} />}
    />
  )
}

export default OnboardingPrototype

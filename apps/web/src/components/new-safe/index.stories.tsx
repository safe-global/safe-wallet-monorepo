import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Trash2, Plus, CircleCheck, Wallet } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

/**
 * New Safe components handle the creation and loading of Safe accounts.
 * The creation flow includes network selection, owner configuration,
 * and threshold settings.
 *
 * Key components:
 * - CardStepper: Multi-step form navigation
 * - SetNameStep: Safe name and network selection
 * - OwnerPolicyStep: Configure owners and threshold
 * - ReviewStep: Final review before creation
 *
 * Note: Actual components require wallet and form context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Components/NewSafe',
  parameters: {
    layout: 'padded',
  },
}

export default meta

// Mock owner data
const mockOwners = [
  { name: 'My Wallet', address: '0x1234567890123456789012345678901234567890' },
  { name: 'Hardware Wallet', address: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01' },
]

// Mock stepper indicator
const MockStepper = ({ steps, activeStep }: { steps: string[]; activeStep: number }) => (
  <div className="mb-8 flex items-center gap-2">
    {steps.map((label, index) => (
      <div key={label} className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span
            className={
              index <= activeStep
                ? 'flex size-6 items-center justify-center rounded-full bg-primary'
                : 'flex size-6 items-center justify-center rounded-full bg-muted'
            }
          >
            <Typography
              variant="paragraph-mini-bold"
              className={index <= activeStep ? 'text-primary-foreground' : 'text-muted-foreground'}
            >
              {index + 1}
            </Typography>
          </span>
          <Typography
            variant="paragraph-small"
            className={index <= activeStep ? 'text-foreground' : 'text-muted-foreground'}
          >
            {label}
          </Typography>
        </div>
        {index < steps.length - 1 && <span className="h-px w-8 bg-border" />}
      </div>
    ))}
  </div>
)

// Mock OwnerRow component
const MockOwnerRow = ({
  owner,
  index,
  onRemove,
  readOnly = false,
}: {
  owner: { name: string; address: string }
  index: number
  onRemove?: () => void
  readOnly?: boolean
}) => (
  <div className="mb-2 flex items-start gap-4 rounded bg-background p-4">
    <Typography variant="paragraph-small" color="muted" as="div" className="w-6">
      {index + 1}.
    </Typography>
    <div className="flex-1">
      {readOnly ? (
        <>
          <Typography variant="paragraph-small">{owner.name || 'Owner'}</Typography>
          <Typography variant="paragraph-mini" color="muted" as="div" className="font-mono">
            {owner.address}
          </Typography>
        </>
      ) : (
        <>
          <Input className="mb-2" defaultValue={owner.name} placeholder="Owner name" />
          <Input defaultValue={owner.address} placeholder="Owner address" />
        </>
      )}
    </div>
    {!readOnly && onRemove && index > 0 && (
      <Button variant="ghost" size="icon-sm" onClick={onRemove}>
        <Trash2 className="size-4" />
      </Button>
    )}
  </div>
)

// Mock ReviewRow component
const MockReviewRow = ({ name, value }: { name: string; value: React.ReactNode }) => (
  <div className="flex border-b border-border py-3">
    <Typography variant="paragraph-small" color="muted" as="div" className="w-[150px]">
      {name}
    </Typography>
    <div className="flex-1">{value}</div>
  </div>
)

// Docs-style wrapper for each step
const StepWrapper = ({
  stepNumber,
  stepName,
  description,
  children,
}: {
  stepNumber: number
  stepName: string
  description: string
  children: React.ReactNode
}) => (
  <div className="mb-16">
    <div className="mb-4 border-b border-border pb-4">
      <Typography variant="paragraph-mini" color="muted" as="div">
        Step {stepNumber}
      </Typography>
      <Typography variant="h4">{stepName}</Typography>
      <Typography variant="paragraph-small" color="muted" as="div">
        {description}
      </Typography>
    </div>
    <div className="rounded-lg bg-muted p-6">{children}</div>
  </div>
)

// All Steps - Scrollable view of entire Create Safe flow with full UI at each step
export const CreateSafeAllSteps: StoryObj = {
  render: () => {
    const steps = ['Name', 'Owners', 'Review']

    return (
      <div className="max-w-[700px]">
        <div className="mb-12 border-b-2 border-primary pb-6">
          <Typography variant="h3">Create Safe flow</Typography>
          <Typography variant="paragraph" color="muted" as="div">
            Complete walkthrough of the Safe creation process. Scroll to view each step.
          </Typography>
        </div>

        {/* Step 1: Name */}
        <StepWrapper
          stepNumber={1}
          stepName="Name & network"
          description="User enters a name for their Safe and selects the network to deploy on."
        >
          <div className="max-w-[600px]">
            <Typography variant="h4" as="div" className="mb-2">
              Create new Safe
            </Typography>
            <MockStepper steps={steps} activeStep={0} />
            <div className="rounded-lg bg-card p-6">
              <Typography variant="h4" as="div" className="mb-2">
                Name your Safe
              </Typography>
              <Typography variant="paragraph-small" color="muted" as="div" className="mb-6">
                Choose a name for your Safe. This is stored locally.
              </Typography>
              <Field className="mb-6">
                <FieldLabel htmlFor="safe-name">Safe name</FieldLabel>
                <Input id="safe-name" placeholder="My Safe" defaultValue="Team Treasury" />
              </Field>
              <Field className="mb-6">
                <FieldLabel>Network</FieldLabel>
                <Select defaultValue="1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ethereum</SelectItem>
                    <SelectItem value="137">Polygon</SelectItem>
                    <SelectItem value="42161">Arbitrum</SelectItem>
                    <SelectItem value="10">Optimism</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Alert className="mb-6">
                <AlertDescription>
                  Your Safe will be created on the selected network. Make sure you have funds for deployment.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end">
                <Button>Next</Button>
              </div>
            </div>
          </div>
        </StepWrapper>

        {/* Step 2: Owners */}
        <StepWrapper
          stepNumber={2}
          stepName="Owners & threshold"
          description="User configures the Safe owners and sets the required number of confirmations."
        >
          <div className="max-w-[600px]">
            <Typography variant="h4" as="div" className="mb-2">
              Create new Safe
            </Typography>
            <MockStepper steps={steps} activeStep={1} />
            <div className="rounded-lg bg-card p-6">
              <Typography variant="h4" as="div" className="mb-2">
                Owners and confirmations
              </Typography>
              <Typography variant="paragraph-small" color="muted" as="div" className="mb-6">
                Add the addresses that will own this Safe and set the number of required confirmations.
              </Typography>
              {mockOwners.map((owner, index) => (
                <MockOwnerRow key={index} owner={owner} index={index} onRemove={() => {}} />
              ))}
              <Button variant="ghost" className="mb-6">
                <Plus className="size-4" />
                Add owner
              </Button>
              <Separator className="my-4" />
              <Typography variant="paragraph-small-bold" as="div" className="mb-2">
                Required confirmations
              </Typography>
              <div className="mb-6 flex items-center gap-4">
                <Select defaultValue="2">
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
                <Typography variant="paragraph-small">out of 2 owner(s)</Typography>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost">Back</Button>
                <Button>Next</Button>
              </div>
            </div>
          </div>
        </StepWrapper>

        {/* Step 3: Review */}
        <StepWrapper stepNumber={3} stepName="Review" description="User reviews all settings before creating the Safe.">
          <div className="max-w-[600px]">
            <Typography variant="h4" as="div" className="mb-2">
              Create new Safe
            </Typography>
            <MockStepper steps={steps} activeStep={2} />
            <div className="rounded-lg bg-card p-6">
              <Typography variant="h4" as="div" className="mb-2">
                Review
              </Typography>
              <MockReviewRow
                name="Safe name"
                value={<Typography variant="paragraph-small">Team Treasury</Typography>}
              />
              <MockReviewRow name="Network" value={<Badge>Ethereum</Badge>} />
              <MockReviewRow
                name="Owners"
                value={
                  <div>
                    {mockOwners.map((owner, i) => (
                      <div key={i} className="mb-2">
                        <Typography variant="paragraph-small">{owner.name}</Typography>
                        <Typography variant="paragraph-mini" color="muted" as="div" className="font-mono">
                          {owner.address}
                        </Typography>
                      </div>
                    ))}
                  </div>
                }
              />
              <MockReviewRow name="Threshold" value={<Typography variant="paragraph-small">2 out of 2</Typography>} />
              <Alert variant="warning" className="my-6">
                <AlertDescription>You will need to pay network fees to deploy this Safe.</AlertDescription>
              </Alert>
              <div className="flex justify-between">
                <Button variant="ghost">Back</Button>
                <Button>Create Safe</Button>
              </div>
            </div>
          </div>
        </StepWrapper>

        {/* Step 4: Success */}
        <StepWrapper stepNumber={4} stepName="Success" description="Confirmation screen shown after Safe is created.">
          <div className="max-w-[600px]">
            <div className="rounded-lg bg-card p-8 text-center">
              <CircleCheck className="mx-auto mb-4 size-16 text-success" />
              <Typography variant="h4" as="div" className="mb-2">
                Safe created successfully!
              </Typography>
              <Typography variant="paragraph-small" color="muted" as="div" className="mb-6">
                Your new Safe is ready to use.
              </Typography>
              <div className="mb-6 rounded bg-background p-4">
                <Typography variant="paragraph-small" color="muted" as="div">
                  Safe address
                </Typography>
                <Typography variant="paragraph-small" as="div" className="font-mono">
                  0x1234567890123456789012345678901234567890
                </Typography>
              </div>
              <Button>
                <Wallet className="size-4" />
                Open Safe
              </Button>
            </div>
          </div>
        </StepWrapper>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'All steps of the Create Safe flow displayed vertically with full UI state at each step.',
      },
    },
  },
}

// Interactive version - Create Safe Flow
export const CreateSafeInteractive: StoryObj = {
  tags: ['!chromatic'],
  render: () => {
    const [step, setStep] = useState(0)
    const [owners, setOwners] = useState(mockOwners)
    const [threshold, setThreshold] = useState('2')

    const steps = ['Name', 'Owners', 'Review']

    const addOwner = () => {
      setOwners([...owners, { name: '', address: '' }])
    }

    const removeOwner = (index: number) => {
      setOwners(owners.filter((_, i) => i !== index))
    }

    return (
      <div className="max-w-[600px]">
        <Typography variant="h4" as="div" className="mb-2">
          Create new Safe
        </Typography>

        <MockStepper steps={steps} activeStep={step} />

        <div className="rounded-lg bg-card p-6">
          {step === 0 && (
            <>
              <Typography variant="h4" as="div" className="mb-2">
                Name your Safe
              </Typography>
              <Field className="mb-6">
                <FieldLabel htmlFor="interactive-safe-name">Safe name</FieldLabel>
                <Input id="interactive-safe-name" placeholder="My Safe" />
              </Field>

              <Field className="mb-6">
                <FieldLabel>Network</FieldLabel>
                <Select defaultValue="1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ethereum</SelectItem>
                    <SelectItem value="137">Polygon</SelectItem>
                    <SelectItem value="42161">Arbitrum</SelectItem>
                    <SelectItem value="10">Optimism</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Alert className="mb-6">
                <AlertDescription>
                  Your Safe will be created on the selected network. Make sure you have funds for deployment.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button onClick={() => setStep(1)}>Next</Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Typography variant="h4" as="div" className="mb-2">
                Owners and confirmations
              </Typography>
              <Typography variant="paragraph-small" color="muted" as="div" className="mb-6">
                Add the addresses that will own this Safe and set the number of required confirmations.
              </Typography>

              {owners.map((owner, index) => (
                <MockOwnerRow key={index} owner={owner} index={index} onRemove={() => removeOwner(index)} />
              ))}

              <Button variant="ghost" onClick={addOwner} className="mb-6">
                <Plus className="size-4" />
                Add owner
              </Button>

              <Separator className="my-6" />

              <Typography variant="paragraph-small-bold" as="div" className="mb-2">
                Required confirmations
              </Typography>
              <div className="mb-6 flex items-center gap-4">
                <Select value={threshold} onValueChange={(value) => setThreshold(value ?? '')}>
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Typography variant="paragraph-small">out of {owners.length} owner(s)</Typography>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setStep(2)}>Next</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Typography variant="h4" as="div" className="mb-2">
                Review
              </Typography>

              <MockReviewRow name="Safe name" value={<Typography variant="paragraph-small">My Safe</Typography>} />
              <MockReviewRow name="Network" value={<Badge>Ethereum</Badge>} />
              <MockReviewRow
                name="Owners"
                value={
                  <div>
                    {owners.map((owner, i) => (
                      <Typography key={i} variant="paragraph-small" as="div" className="font-mono">
                        {owner.address.slice(0, 10)}...{owner.address.slice(-8)}
                      </Typography>
                    ))}
                  </div>
                }
              />
              <MockReviewRow
                name="Threshold"
                value={
                  <Typography variant="paragraph-small">
                    {threshold} out of {owners.length}
                  </Typography>
                }
              />

              <Alert variant="warning" className="my-6">
                <AlertDescription>You will need to pay network fees to deploy this Safe.</AlertDescription>
              </Alert>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button>Create Safe</Button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive Safe creation flow - click through to see each step.',
      },
    },
  },
}

// Load Safe Flow
export const LoadSafeFlow: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="max-w-[600px]">
      <Typography variant="h4" as="div" className="mb-2">
        Add existing Safe
      </Typography>

      <div className="rounded-lg bg-card p-6">
        <Typography variant="h4" as="div" className="mb-2">
          Enter Safe address
        </Typography>
        <Typography variant="paragraph-small" color="muted" as="div" className="mb-6">
          Paste the address of an existing Safe you want to add to your account.
        </Typography>

        <Field className="mb-6">
          <FieldLabel>Network</FieldLabel>
          <Select defaultValue="1">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Ethereum</SelectItem>
              <SelectItem value="137">Polygon</SelectItem>
              <SelectItem value="42161">Arbitrum</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field className="mb-6">
          <FieldLabel htmlFor="safe-address">Safe address</FieldLabel>
          <Input id="safe-address" placeholder="0x..." />
        </Field>

        <div className="flex justify-end">
          <Button>Add Safe</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Load an existing Safe by entering its address.',
      },
    },
  },
}

// Step 1: Name
export const SetNameStep: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-card p-6">
      <Typography variant="h4" as="div" className="mb-2">
        Name your Safe
      </Typography>
      <Typography variant="paragraph-small" color="muted" as="div" className="mb-6">
        Choose a name for your Safe. This is stored locally.
      </Typography>

      <Field className="mb-6">
        <FieldLabel htmlFor="set-name-safe-name">Safe name</FieldLabel>
        <Input id="set-name-safe-name" placeholder="My Safe" defaultValue="Team Treasury" />
      </Field>

      <Field>
        <FieldLabel>Network</FieldLabel>
        <Select defaultValue="1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Ethereum</SelectItem>
            <SelectItem value="137">Polygon</SelectItem>
            <SelectItem value="42161">Arbitrum</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'First step: set Safe name and select network.',
      },
    },
  },
}

// Step 2: Owners
export const OwnerPolicyStep: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-card p-6">
      <Typography variant="h4" as="div" className="mb-2">
        Owners
      </Typography>
      <Typography variant="paragraph-small" color="muted" as="div" className="mb-6">
        Add owners and set the required confirmations.
      </Typography>

      {mockOwners.map((owner, index) => (
        <MockOwnerRow key={index} owner={owner} index={index} onRemove={() => {}} />
      ))}

      <Button variant="ghost" className="mb-6">
        <Plus className="size-4" />
        Add owner
      </Button>

      <Separator className="my-4" />

      <Typography variant="paragraph-small-bold" as="div" className="mb-2">
        Required confirmations
      </Typography>
      <div className="flex items-center gap-4">
        <Select defaultValue="2">
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
          </SelectContent>
        </Select>
        <Typography variant="paragraph-small">out of 2 owner(s)</Typography>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Second step: configure owners and threshold.',
      },
    },
  },
}

// Step 3: Review
export const ReviewStep: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-card p-6">
      <Typography variant="h4" as="div" className="mb-2">
        Review Safe configuration
      </Typography>

      <MockReviewRow name="Safe name" value={<Typography variant="paragraph-small">Team Treasury</Typography>} />
      <MockReviewRow name="Network" value={<Badge>Ethereum</Badge>} />
      <MockReviewRow
        name="Owners"
        value={
          <div>
            {mockOwners.map((owner, i) => (
              <div key={i} className="mb-2">
                <Typography variant="paragraph-small">{owner.name}</Typography>
                <Typography variant="paragraph-mini" color="muted" as="div" className="font-mono">
                  {owner.address}
                </Typography>
              </div>
            ))}
          </div>
        }
      />
      <MockReviewRow name="Threshold" value={<Typography variant="paragraph-small">2 out of 2</Typography>} />

      <Alert className="mt-6">
        <AlertDescription>Estimated network fee: ~0.01 ETH</AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Final review step before Safe creation.',
      },
    },
  },
}

// Owner row variants
export const OwnerRowVariants: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-card p-6">
      <Typography variant="paragraph-small-bold" as="div" className="mb-2">
        Editable owner row
      </Typography>
      <MockOwnerRow owner={mockOwners[0]} index={0} onRemove={() => {}} />

      <Typography variant="paragraph-small-bold" as="div" className="mb-2 mt-6">
        Read-only owner row
      </Typography>
      <MockOwnerRow owner={mockOwners[0]} index={0} readOnly />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Owner row in editable and read-only modes.',
      },
    },
  },
}

// Review row component
export const ReviewRowComponent: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-card p-6">
      <MockReviewRow name="Safe name" value={<Typography variant="paragraph-small">My Safe</Typography>} />
      <MockReviewRow name="Network" value={<Badge>Ethereum</Badge>} />
      <MockReviewRow name="Balance" value={<Typography variant="paragraph-small">$125,000</Typography>} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ReviewRow displays labeled data in a consistent format.',
      },
    },
  },
}

// Creation success
export const CreationSuccess: StoryObj = {
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-card p-8 text-center">
      <CircleCheck className="mx-auto mb-4 size-16 text-success" />
      <Typography variant="h4" as="div" className="mb-2">
        Safe created successfully!
      </Typography>
      <Typography variant="paragraph-small" color="muted" as="div" className="mb-6">
        Your new Safe is ready to use.
      </Typography>

      <div className="mb-6 rounded bg-background p-4">
        <Typography variant="paragraph-small" color="muted" as="div">
          Safe address
        </Typography>
        <Typography variant="paragraph-small" as="div" className="font-mono">
          0x1234567890123456789012345678901234567890
        </Typography>
      </div>

      <Button>
        <Wallet className="size-4" />
        Open Safe
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success screen after Safe creation.',
      },
    },
  },
}

// Card stepper
export const CardStepper: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="max-w-[600px]">
      <MockStepper steps={['Name', 'Owners', 'Review']} activeStep={1} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Step progress indicator for multi-step flows.',
      },
    },
  },
}

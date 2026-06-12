import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Send, ArrowLeftRight, Pencil, CircleCheck } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Chip } from '@/components/ui/chip'

/**
 * Transaction Flow (tx-flow) components orchestrate multi-step transaction
 * creation, signing, and execution. This is the core transaction UI.
 *
 * The flow includes:
 * - Step-based navigation (form → review → sign/execute → confirmation)
 * - Transaction data display and validation
 * - Signing and execution actions
 *
 * Note: Actual TxFlow requires complex context providers.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Components/TxFlow',
  parameters: {
    layout: 'padded',
  },
}

export default meta

// Mock transaction data
const mockRecipient = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const mockAmount = '1.5'
const mockToken = 'ETH'

// Mock TxLayout - Main layout wrapper
const MockTxLayout = ({
  title,
  subtitle,
  icon,
  step = 0,
  totalSteps = 3,
  children,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  step?: number
  totalSteps?: number
  children: React.ReactNode
}) => (
  <div className="flex max-w-[900px] gap-6">
    {/* Sidebar */}
    <div className="w-[280px] shrink-0 rounded bg-card p-4">
      <Typography variant="paragraph-small-medium" color="muted" as="div" className="mb-2">
        Safe account
      </Typography>
      <Typography variant="paragraph-small" as="div" className="mb-4 font-mono">
        0x1234...5678
      </Typography>
      <Separator className="my-4" />
      <Typography variant="paragraph-small-medium" color="muted" as="div" className="mb-2">
        Network
      </Typography>
      <Chip>Ethereum</Chip>
    </div>

    {/* Main content */}
    <div className="flex-1">
      <div className="mb-4 flex items-center gap-4">
        {icon}
        <div>
          <Typography variant="h4">{title}</Typography>
          {subtitle && (
            <Typography variant="paragraph-small" color="muted">
              {subtitle}
            </Typography>
          )}
        </div>
      </div>

      {totalSteps > 1 && (
        <div className="mb-6 flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Typography
                variant="paragraph-small-medium"
                color={i === step ? 'default' : 'muted'}
                aria-current={i === step ? 'step' : undefined}
              >
                {['Create', 'Review', 'Execute'][i] || `Step ${i + 1}`}
              </Typography>
              {i < totalSteps - 1 && <Separator className="w-8" />}
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  </div>
)

// Mock TxCard - Form container
const MockTxCard = ({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) => (
  <Card className="py-0">
    <CardContent className="p-6">
      {children}
      {actions && (
        <>
          <Separator className="my-4" />
          <div className="flex justify-end gap-4">{actions}</div>
        </>
      )}
    </CardContent>
  </Card>
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
      <Typography variant="paragraph-mini" color="muted" as="div" className="uppercase tracking-wide">
        Step {stepNumber}
      </Typography>
      <Typography variant="h4">{stepName}</Typography>
      <Typography variant="paragraph-small" color="muted">
        {description}
      </Typography>
    </div>
    <div className="rounded-lg bg-muted p-6">{children}</div>
  </div>
)

// All Steps - Scrollable view of entire Token Transfer flow with full UI at each step
export const TokenTransferAllSteps: StoryObj = {
  render: () => (
    <div className="max-w-[950px]">
      <div className="mb-12 border-b-2 border-primary pb-6">
        <Typography variant="h4">Token transfer flow</Typography>
        <Typography variant="paragraph" color="muted">
          Complete walkthrough of the token transfer process. Scroll to view each step.
        </Typography>
      </div>

      {/* Step 1: Create */}
      <StepWrapper
        stepNumber={1}
        stepName="Create transaction"
        description="User enters recipient address and amount to send."
      >
        <MockTxLayout
          title="Send tokens"
          subtitle="Transfer tokens from your Safe"
          icon={<Send className="size-6 text-primary" />}
          step={0}
          totalSteps={3}
        >
          <MockTxCard actions={<Button>Next</Button>}>
            <Typography variant="paragraph-small-medium" as="div" className="mb-2">
              Recipient
            </Typography>
            <Input className="mb-6 w-full" placeholder="0x..." defaultValue={mockRecipient} />

            <Typography variant="paragraph-small-medium" as="div" className="mb-2">
              Amount
            </Typography>
            <div className="mb-4 flex gap-4">
              <Input className="flex-1" placeholder="0.0" defaultValue={mockAmount} />
              <NativeSelect defaultValue="ETH" className="w-[120px]">
                <NativeSelectOption value="ETH">ETH</NativeSelectOption>
                <NativeSelectOption value="USDC">USDC</NativeSelectOption>
                <NativeSelectOption value="DAI">DAI</NativeSelectOption>
              </NativeSelect>
            </div>
            <Alert>
              <AlertDescription>Available balance: 10.5 ETH</AlertDescription>
            </Alert>
          </MockTxCard>
        </MockTxLayout>
      </StepWrapper>

      {/* Step 2: Review */}
      <StepWrapper
        stepNumber={2}
        stepName="Review transaction"
        description="User reviews transaction details, balance changes, and gas fees before signing."
      >
        <MockTxLayout
          title="Send tokens"
          subtitle="Transfer tokens from your Safe"
          icon={<Send className="size-6 text-primary" />}
          step={1}
          totalSteps={3}
        >
          <MockTxCard
            actions={
              <>
                <Button variant="outline">Back</Button>
                <Button>Submit</Button>
              </>
            }
          >
            <Typography variant="h4" as="div" className="mb-2">
              Review transaction
            </Typography>
            <div className="mb-4 rounded bg-background p-4">
              <div className="mb-2 flex justify-between">
                <Typography variant="paragraph-small" color="muted">
                  Send
                </Typography>
                <Typography variant="paragraph-small-bold">
                  {mockAmount} {mockToken}
                </Typography>
              </div>
              <div className="mb-2 flex justify-between">
                <Typography variant="paragraph-small" color="muted">
                  To
                </Typography>
                <Typography variant="paragraph-small" className="font-mono">
                  {mockRecipient.slice(0, 10)}...{mockRecipient.slice(-8)}
                </Typography>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <Typography variant="paragraph-small" color="muted">
                  Network fee
                </Typography>
                <Typography variant="paragraph-small">~0.002 ETH</Typography>
              </div>
            </div>

            <Typography variant="paragraph-small-medium" as="div" className="mb-2">
              Balance changes
            </Typography>
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex justify-between rounded bg-[var(--color-error-light)] p-1.5">
                <Typography variant="paragraph-small">ETH</Typography>
                <Typography variant="paragraph-small-bold" className="text-[var(--color-error-main)]">
                  -{mockAmount} ETH
                </Typography>
              </div>
            </div>

            <Alert>
              <AlertDescription>This transaction requires 2 of 3 signatures to execute.</AlertDescription>
            </Alert>
          </MockTxCard>
        </MockTxLayout>
      </StepWrapper>

      {/* Step 3: Sign & Execute */}
      <StepWrapper
        stepNumber={3}
        stepName="Sign & execute"
        description="User signs the transaction. Once threshold is reached, transaction can be executed."
      >
        <MockTxLayout
          title="Send tokens"
          subtitle="Transfer tokens from your Safe"
          icon={<Send className="size-6 text-primary" />}
          step={2}
          totalSteps={3}
        >
          <MockTxCard>
            <Typography variant="h4" as="div" className="mb-2">
              Sign & execute
            </Typography>
            <Typography variant="paragraph-small" color="muted" as="div" className="mb-6">
              Sign with your connected wallet to add your confirmation.
            </Typography>
            <div className="mb-6 rounded bg-background p-4">
              <Typography variant="paragraph-mini" color="muted" as="div">
                Confirmations: 1 of 2 required
              </Typography>
              <Progress value={50} className="mt-2" />
            </div>
            <div className="flex gap-4">
              <Button className="w-full">Sign transaction</Button>
              <Button className="w-full" disabled>
                Execute
              </Button>
            </div>
          </MockTxCard>
        </MockTxLayout>
      </StepWrapper>

      {/* Step 4: Success */}
      <StepWrapper
        stepNumber={4}
        stepName="Transaction submitted"
        description="Confirmation screen shown after transaction is submitted to the network."
      >
        <MockTxLayout
          title="Send tokens"
          subtitle="Transfer tokens from your Safe"
          icon={<Send className="size-6 text-primary" />}
          step={2}
          totalSteps={3}
        >
          <MockTxCard>
            <div className="py-8 text-center">
              <CircleCheck className="mb-4 inline-block size-16 text-[var(--color-success-main)]" />
              <Typography variant="h4" as="div" className="mb-2">
                Transaction submitted
              </Typography>
              <Typography variant="paragraph-small" color="muted" as="div" className="mb-4">
                Your transaction has been submitted and is awaiting confirmations.
              </Typography>
              <div className="mb-4 inline-block rounded bg-background p-4">
                <Typography variant="paragraph-mini" color="muted" as="div">
                  Transaction hash
                </Typography>
                <Typography variant="paragraph-small" className="font-mono">
                  0xabc123...def456
                </Typography>
              </div>
              <div>
                <Button variant="outline" size="sm">
                  View on Etherscan
                </Button>
              </div>
            </div>
          </MockTxCard>
        </MockTxLayout>
      </StepWrapper>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All steps of the Token Transfer flow displayed vertically with full UI state at each step.',
      },
    },
  },
}

// Interactive version - Token Transfer Flow
export const TokenTransferInteractive: StoryObj = {
  tags: ['!chromatic'],
  render: () => {
    const [step, setStep] = useState(0)

    return (
      <MockTxLayout
        title="Send tokens"
        subtitle="Transfer tokens from your Safe"
        icon={<Send className="size-6 text-primary" />}
        step={step}
        totalSteps={3}
      >
        {step === 0 && (
          <MockTxCard actions={<Button onClick={() => setStep(1)}>Next</Button>}>
            <Typography variant="paragraph-small-medium" as="div" className="mb-2">
              Recipient
            </Typography>
            <Input className="mb-6 w-full" placeholder="0x..." defaultValue={mockRecipient} />

            <Typography variant="paragraph-small-medium" as="div" className="mb-2">
              Amount
            </Typography>
            <div className="flex gap-4">
              <Input className="flex-1" placeholder="0.0" defaultValue={mockAmount} />
              <NativeSelect defaultValue="ETH" className="w-[120px]">
                <NativeSelectOption value="ETH">ETH</NativeSelectOption>
                <NativeSelectOption value="USDC">USDC</NativeSelectOption>
                <NativeSelectOption value="DAI">DAI</NativeSelectOption>
              </NativeSelect>
            </div>
          </MockTxCard>
        )}

        {step === 1 && (
          <MockTxCard
            actions={
              <>
                <Button variant="outline" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setStep(2)}>Submit</Button>
              </>
            }
          >
            <Typography variant="h4" as="div" className="mb-2">
              Review transaction
            </Typography>
            <div className="mb-4 rounded bg-background p-4">
              <div className="mb-2 flex justify-between">
                <Typography variant="paragraph-small" color="muted">
                  Send
                </Typography>
                <Typography variant="paragraph-small-bold">
                  {mockAmount} {mockToken}
                </Typography>
              </div>
              <div className="flex justify-between">
                <Typography variant="paragraph-small" color="muted">
                  To
                </Typography>
                <Typography variant="paragraph-small" className="font-mono">
                  {mockRecipient.slice(0, 10)}...{mockRecipient.slice(-8)}
                </Typography>
              </div>
            </div>
            <Alert>
              <AlertDescription>This transaction requires 2 of 3 signatures to execute.</AlertDescription>
            </Alert>
          </MockTxCard>
        )}

        {step === 2 && (
          <MockTxCard>
            <div className="py-8 text-center">
              <CircleCheck className="mb-4 inline-block size-16 text-[var(--color-success-main)]" />
              <Typography variant="h4" as="div" className="mb-2">
                Transaction submitted
              </Typography>
              <Typography variant="paragraph-small" color="muted">
                Your transaction has been submitted and is awaiting confirmations.
              </Typography>
            </div>
          </MockTxCard>
        )}
      </MockTxLayout>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive token transfer flow - click through to see each step.',
      },
    },
  },
}

// TxLayout variations
export const TxLayoutDefault: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <MockTxLayout title="New transaction" subtitle="Create a new transaction">
      <MockTxCard>
        <Typography variant="paragraph-small" color="muted">
          Transaction form content goes here...
        </Typography>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default TxLayout with sidebar showing safe info and main content area.',
      },
    },
  },
}

export const TxLayoutWithProgress: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <MockTxLayout title="Multi-step transaction" step={1} totalSteps={4}>
      <MockTxCard>
        <Typography variant="paragraph-small" color="muted">
          Step 2 of 4
        </Typography>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TxLayout with step progress indicator.',
      },
    },
  },
}

// TxCard variations
export const TxCardBasic: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="max-w-md rounded bg-card p-4">
      <MockTxCard>
        <Typography variant="paragraph">Basic card content</Typography>
      </MockTxCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic TxCard container for form content.',
      },
    },
  },
}

export const TxCardWithActions: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="max-w-md rounded bg-card p-4">
      <MockTxCard
        actions={
          <>
            <Button variant="outline">Cancel</Button>
            <Button>Continue</Button>
          </>
        }
      >
        <Typography variant="paragraph">Card with action buttons</Typography>
      </MockTxCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TxCard with action buttons footer.',
      },
    },
  },
}

// Sign Message Flow
export const SignMessageFlow: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <MockTxLayout
      title="Sign message"
      subtitle="Sign an off-chain message"
      icon={<Pencil className="size-6 text-primary" />}
    >
      <MockTxCard
        actions={
          <>
            <Button variant="outline">Reject</Button>
            <Button>Sign</Button>
          </>
        }
      >
        <Typography variant="paragraph-small-medium" as="div" className="mb-2">
          Message to sign
        </Typography>
        <div className="mb-4 rounded bg-background p-4">
          <Typography variant="paragraph-small" className="font-mono">
            Hello, this is a test message to be signed by the Safe.
          </Typography>
        </div>
        <Alert>
          <AlertDescription>This is an off-chain signature. No transaction will be executed on-chain.</AlertDescription>
        </Alert>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Sign message flow for off-chain signatures.',
      },
    },
  },
}

// Swap Flow
export const SwapFlow: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <MockTxLayout
      title="Swap tokens"
      subtitle="Exchange one token for another"
      icon={<ArrowLeftRight className="size-6 text-primary" />}
    >
      <MockTxCard
        actions={
          <>
            <Button variant="outline">Cancel</Button>
            <Button>Review swap</Button>
          </>
        }
      >
        <Typography variant="paragraph-small-medium" as="div" className="mb-2">
          You sell
        </Typography>
        <div className="mb-6 flex gap-4">
          <Input className="flex-1" placeholder="0.0" defaultValue="1.0" />
          <Chip>ETH</Chip>
        </div>

        <div className="my-4 text-center">
          <ArrowLeftRight className="inline-block size-6 rotate-90" />
        </div>

        <Typography variant="paragraph-small-medium" as="div" className="mb-2">
          You receive
        </Typography>
        <div className="flex gap-4">
          <Input className="flex-1" placeholder="0.0" defaultValue="1850.00" disabled />
          <Chip>USDC</Chip>
        </div>

        <div className="mt-4 rounded bg-background p-4">
          <Typography variant="paragraph-mini" color="muted">
            Rate: 1 ETH = 1,850 USDC
          </Typography>
        </div>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Token swap transaction flow.',
      },
    },
  },
}

// Loading state
export const LoadingState: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <MockTxLayout title="Processing transaction">
      <MockTxCard>
        <div className="py-8 text-center">
          <Progress className="mb-6" value={null} />
          <Typography variant="h4" as="div" className="mb-2">
            Submitting transaction...
          </Typography>
          <Typography variant="paragraph-small" color="muted">
            Please confirm in your wallet
          </Typography>
        </div>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Transaction submission in progress.',
      },
    },
  },
}

// Error state
export const ErrorState: StoryObj = {
  render: () => (
    <MockTxLayout title="Send tokens" icon={<Send className="size-6 text-primary" />}>
      <MockTxCard
        actions={
          <>
            <Button variant="outline">Cancel</Button>
            <Button>Try again</Button>
          </>
        }
      >
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Transaction failed: Insufficient funds for gas</AlertDescription>
        </Alert>
        <Typography variant="paragraph-small" color="muted">
          Your Safe does not have enough ETH to pay for the transaction gas fees.
        </Typography>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state when transaction fails.',
      },
    },
  },
}

// Review with balance changes
export const ReviewWithBalanceChanges: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="max-w-md rounded bg-card p-6">
      <Typography variant="h4" as="div" className="mb-2">
        Balance changes
      </Typography>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between rounded bg-[var(--color-error-light)] p-4">
          <Typography variant="paragraph-small">ETH</Typography>
          <Typography variant="paragraph-small-bold" className="text-[var(--color-error-main)]">
            -1.5 ETH
          </Typography>
        </div>
        <div className="flex justify-between rounded bg-[var(--color-success-light)] p-4">
          <Typography variant="paragraph-small">USDC</Typography>
          <Typography variant="paragraph-small-bold" className="text-[var(--color-success-main)]">
            +2,775 USDC
          </Typography>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Balance changes display in transaction review.',
      },
    },
  },
}

// Action buttons
export const ActionButtons: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="max-w-sm rounded bg-card p-6">
      <Typography variant="paragraph-small-medium" as="div" className="mb-2">
        Transaction actions
      </Typography>
      <div className="flex flex-col gap-4">
        <Button className="w-full">Sign transaction</Button>
        <Button className="w-full">Execute transaction</Button>
        <Button variant="outline" className="w-full">
          Reject transaction
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available action buttons for transaction flows.',
      },
    },
  },
}

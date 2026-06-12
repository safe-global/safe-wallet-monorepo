import type { Meta, StoryObj } from '@storybook/react'
import { CircleCheck, Wallet, Rocket, ExternalLink } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/**
 * Counterfactual feature handles undeployed (counterfactual) Safe accounts.
 * These Safes exist as addresses but are not yet deployed on-chain.
 *
 * Key components:
 * - CheckBalance: Alert when Safe needs activation
 * - ActivateAccountFlow: Deployment flow
 * - CounterfactualSuccessScreen: Deployment success dialog
 *
 * Note: Actual components require Redux store and wallet context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/Counterfactual',
  parameters: {
    layout: 'centered',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Mock safe info
const mockSafeAddress = '0x1234567890123456789012345678901234567890'
const mockChain = { name: 'Ethereum', chainId: '1', explorerUrl: 'https://etherscan.io' }

// Docs-style wrapper for each state
const StateWrapper = ({
  stateName,
  description,
  children,
}: {
  stateName: string
  description: string
  children: React.ReactNode
}) => (
  <div className="mb-16">
    <div className="mb-4 border-b pb-4">
      <Typography variant="h4">{stateName}</Typography>
      <Typography variant="paragraph-small" color="muted">
        {description}
      </Typography>
    </div>
    <div className="flex justify-center rounded-lg bg-muted p-6">{children}</div>
  </div>
)

const NotDeployedAlert = () => (
  <Alert className="relative max-w-[500px]">
    <AlertTitle>Safe not yet activated</AlertTitle>
    <AlertDescription>
      Your Safe needs to be activated before you can make transactions. You can receive funds to this address now.
    </AlertDescription>
    <AlertAction>
      <Button variant="ghost" size="sm">
        <Rocket className="size-4" />
        Activate
      </Button>
    </AlertAction>
  </Alert>
)

const ActivationForm = () => (
  <div className="max-w-[500px] rounded-lg bg-background p-6">
    <div className="mb-6 flex items-center gap-4">
      <Rocket className="size-8 text-primary" />
      <div>
        <Typography variant="h4">Activate your Safe</Typography>
        <Typography variant="paragraph-small" color="muted">
          Deploy your Safe to start using it
        </Typography>
      </div>
    </div>

    <Alert className="mb-6">
      <AlertDescription>
        Your Safe exists as an address but is not yet deployed on-chain. Activate it to start making transactions.
      </AlertDescription>
    </Alert>

    <div className="mb-6 rounded bg-muted p-4">
      <Typography variant="paragraph-small" color="muted" as="div" className="mb-1">
        Safe address
      </Typography>
      <Typography variant="code">{mockSafeAddress}</Typography>
    </div>

    <div className="mb-6 rounded bg-muted p-4">
      <Typography variant="paragraph-small" color="muted" as="div" className="mb-1">
        Network
      </Typography>
      <Badge variant="outline">{mockChain.name}</Badge>
    </div>

    <Separator className="my-4" />

    <div className="mb-1 flex justify-between">
      <Typography variant="paragraph-small">Estimated network fee</Typography>
      <Typography variant="paragraph-small-bold">~0.005 ETH</Typography>
    </div>

    <Button size="lg" className="w-full">
      Activate Safe
    </Button>
  </div>
)

const InsufficientBalanceCard = () => (
  <div className="max-w-[500px] rounded-lg bg-background p-6">
    <Typography variant="h4" className="mb-2">
      Activate your Safe
    </Typography>

    <Alert variant="warning" className="mb-6">
      <AlertTitle>Insufficient balance</AlertTitle>
      <AlertDescription>You need at least 0.005 ETH to activate your Safe. Current balance: 0.001 ETH</AlertDescription>
    </Alert>

    <div className="mb-6 rounded bg-muted p-4">
      <div className="mb-1 flex justify-between">
        <Typography variant="paragraph-small" color="muted">
          Required
        </Typography>
        <Typography variant="paragraph-small">~0.005 ETH</Typography>
      </div>
      <div className="flex justify-between">
        <Typography variant="paragraph-small" color="muted">
          Current balance
        </Typography>
        <Typography variant="paragraph-small" className="text-destructive">
          0.001 ETH
        </Typography>
      </div>
    </div>

    <Button className="w-full" disabled>
      Activate Safe
    </Button>
  </div>
)

const ActivatingCard = () => (
  <div className="max-w-[400px] rounded-lg bg-background p-8 text-center">
    <Rocket className="mx-auto mb-4 size-12 text-primary" />
    <Typography variant="h4" className="mb-2">
      Activating Safe...
    </Typography>
    <Typography variant="paragraph-small" color="muted" className="mb-6">
      Please wait while your Safe is being deployed
    </Typography>
    <Progress value={null} className="mb-4" />
    <Typography variant="paragraph-mini" color="muted">
      This may take up to a minute
    </Typography>
  </div>
)

const PayNowPayLaterOptions = () => (
  <>
    <Typography variant="h4" className="mb-2">
      Choose activation method
    </Typography>
    <Typography variant="paragraph-small" color="muted" className="mb-6">
      Select how you want to pay for Safe deployment
    </Typography>

    <div className="mb-4 cursor-pointer rounded border-2 border-primary p-4">
      <Typography variant="paragraph-small-bold" as="div">
        Pay now
      </Typography>
      <Typography variant="paragraph-small" color="muted">
        Deploy your Safe immediately by paying gas fees
      </Typography>
      <Typography variant="paragraph-mini" as="div" className="text-primary">
        ~0.005 ETH
      </Typography>
    </div>

    <div className="cursor-pointer rounded border p-4">
      <Typography variant="paragraph-small-bold" as="div">
        Pay later
      </Typography>
      <Typography variant="paragraph-small" color="muted">
        Activate when you make your first transaction
      </Typography>
      <Typography variant="paragraph-mini" color="muted" as="div">
        Deployment cost added to first transaction
      </Typography>
    </div>
  </>
)

const SuccessDialog = () => (
  <Dialog open>
    <DialogContent>
      <DialogHeader className="pt-4 text-center">
        <CircleCheck className="mx-auto mb-4 size-16 text-[var(--color-success-main)]" />
        <DialogTitle>Safe activated!</DialogTitle>
      </DialogHeader>
      <div className="text-center">
        <Typography variant="paragraph-small" color="muted" className="mb-6">
          Your Safe has been successfully deployed and is ready to use.
        </Typography>

        <div className="mb-4 rounded bg-muted p-4">
          <Typography variant="paragraph-small" color="muted" as="div" className="mb-1">
            Safe address
          </Typography>
          <Typography variant="code">{mockSafeAddress}</Typography>
        </div>

        <Button variant="ghost" size="sm" render={<a href={`${mockChain.explorerUrl}/address/${mockSafeAddress}`} />}>
          View on Etherscan
          <ExternalLink className="size-4" />
        </Button>
      </div>
      <DialogFooter className="justify-center pb-2">
        <Button>
          <Wallet className="size-4" />
          Open Safe
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// All States - Scrollable view of entire Counterfactual activation flow
export const ActivationAllStates: StoryObj = {
  render: () => (
    <div className="max-w-[600px]">
      <div className="mb-6 border-b-2 border-primary pb-6">
        <Typography variant="h4">Safe activation flow</Typography>
        <Typography variant="paragraph" color="muted">
          Complete walkthrough of activating a counterfactual (undeployed) Safe. Scroll to view each state.
        </Typography>
      </div>

      <StateWrapper
        stateName="Not deployed alert"
        description="Banner shown on dashboard when Safe is not yet deployed on-chain."
      >
        <NotDeployedAlert />
      </StateWrapper>

      <StateWrapper
        stateName="Activation options"
        description="User chooses between paying now or paying later (with first transaction)."
      >
        <div className="max-w-[500px] rounded-lg bg-background p-6">
          <PayNowPayLaterOptions />
        </div>
      </StateWrapper>

      <StateWrapper
        stateName="Activation form"
        description="User reviews Safe details and estimated fees before activating."
      >
        <ActivationForm />
      </StateWrapper>

      <StateWrapper
        stateName="Insufficient balance"
        description="Activation blocked when user doesn't have enough funds for gas."
      >
        <InsufficientBalanceCard />
      </StateWrapper>

      <StateWrapper stateName="Activating" description="Loading state while Safe deployment is in progress.">
        <ActivatingCard />
      </StateWrapper>

      <StateWrapper stateName="Activation success" description="Confirmation dialog shown after Safe is deployed.">
        <SuccessDialog />
      </StateWrapper>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All states of the Safe activation flow displayed vertically for easy review.',
      },
    },
  },
}

// Individual state: Activate Account Flow
export const FullActivateAccountFlow: StoryObj = {
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-background p-6">
      <div className="mb-6 flex items-center gap-4">
        <Rocket className="size-8 text-primary" />
        <div>
          <Typography variant="h4">Activate your Safe</Typography>
          <Typography variant="paragraph-small" color="muted">
            Deploy your Safe to start using it
          </Typography>
        </div>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          Your Safe exists as an address but is not yet deployed on-chain. Activate it to start making transactions.
        </AlertDescription>
      </Alert>

      <div className="mb-6 rounded bg-muted p-4">
        <Typography variant="paragraph-small" color="muted" as="div" className="mb-1">
          Safe address
        </Typography>
        <Typography variant="code">{mockSafeAddress}</Typography>
      </div>

      <div className="mb-6 rounded bg-muted p-4">
        <Typography variant="paragraph-small" color="muted" as="div" className="mb-1">
          Network
        </Typography>
        <Badge variant="outline">{mockChain.name}</Badge>
      </div>

      <Separator className="my-4" />

      <div className="mb-1 flex justify-between">
        <Typography variant="paragraph-small">Estimated network fee</Typography>
        <Typography variant="paragraph-small-bold">~0.005 ETH</Typography>
      </div>
      <div className="mb-6 flex justify-between">
        <Typography variant="paragraph-small">Estimated time</Typography>
        <Typography variant="paragraph-small">~30 seconds</Typography>
      </div>

      <Button size="lg" className="w-full">
        Activate Safe
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full activation flow for deploying a counterfactual Safe.',
      },
    },
  },
}

// Check Balance Alert
export const CheckBalanceAlert: StoryObj = {
  render: () => <NotDeployedAlert />,
  parameters: {
    docs: {
      description: {
        story: 'Alert shown when Safe is not deployed but can receive funds.',
      },
    },
  },
}

// Activation Success
export const ActivationSuccess: StoryObj = {
  render: () => <SuccessDialog />,
  parameters: {
    docs: {
      description: {
        story: 'Success dialog shown after Safe deployment.',
      },
    },
  },
}

// Activation In Progress
export const ActivationInProgress: StoryObj = {
  render: () => <ActivatingCard />,
  parameters: {
    docs: {
      description: {
        story: 'Loading state during Safe deployment.',
      },
    },
  },
}

// Activation Button
export const ActivateAccountButton: StoryObj = {
  render: () => (
    <div className="flex max-w-[300px] flex-col gap-4">
      <Button className="w-full">
        <Rocket className="size-4" />
        Activate Safe
      </Button>
      <Button variant="outline" className="w-full">
        <Rocket className="size-4" />
        Activate Safe
      </Button>
      <Button variant="ghost">
        <Rocket className="size-4" />
        Activate Safe
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Activation button variants.',
      },
    },
  },
}

// Not Deployed Chip
export const NotDeployedChip: StoryObj = {
  render: () => (
    <div className="max-w-[400px] rounded-lg bg-background p-6">
      <Typography variant="paragraph-small-bold" as="div" className="mb-2">
        Safe status indicators
      </Typography>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Typography variant="paragraph-small">Counterfactual Safe</Typography>
          <Badge variant="outline">Not deployed</Badge>
        </div>
        <div className="flex items-center justify-between">
          <Typography variant="paragraph-small">Deployed Safe</Typography>
          <Badge variant="success">Active</Badge>
        </div>
        <div className="flex items-center justify-between">
          <Typography variant="paragraph-small">Deploying</Typography>
          <Badge variant="warning">Pending</Badge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Status chips for counterfactual Safe states.',
      },
    },
  },
}

// Insufficient Balance
export const InsufficientBalance: StoryObj = {
  render: () => <InsufficientBalanceCard />,
  parameters: {
    docs: {
      description: {
        story: 'Activation blocked due to insufficient balance.',
      },
    },
  },
}

// Pay Now Pay Later Options
export const PayNowPayLater: StoryObj = {
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-background p-6">
      <PayNowPayLaterOptions />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Options for paying activation fees now or later.',
      },
    },
  },
}

// First Transaction Flow
export const FirstTransactionFlow: StoryObj = {
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-background p-6">
      <Alert className="mb-6">
        <AlertTitle>First transaction will activate your Safe</AlertTitle>
        <AlertDescription>
          Your Safe will be deployed as part of this transaction. Deployment cost will be added to the gas fee.
        </AlertDescription>
      </Alert>

      <div className="rounded bg-muted p-4">
        <div className="mb-1 flex justify-between">
          <Typography variant="paragraph-small" color="muted">
            Transaction fee
          </Typography>
          <Typography variant="paragraph-small">~0.002 ETH</Typography>
        </div>
        <div className="mb-1 flex justify-between">
          <Typography variant="paragraph-small" color="muted">
            Deployment fee
          </Typography>
          <Typography variant="paragraph-small">~0.005 ETH</Typography>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between">
          <Typography variant="paragraph-small-bold">Total</Typography>
          <Typography variant="paragraph-small-bold">~0.007 ETH</Typography>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Information shown when first transaction includes deployment.',
      },
    },
  },
}

// Receive Funds Info
export const ReceiveFundsInfo: StoryObj = {
  render: () => (
    <Alert className="max-w-[500px]">
      <AlertTitle>Ready to receive funds</AlertTitle>
      <AlertDescription>
        Even though your Safe is not deployed yet, you can already receive funds to this address. The Safe will be
        activated when you make your first transaction.
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Info about receiving funds to counterfactual Safe.',
      },
    },
  },
}

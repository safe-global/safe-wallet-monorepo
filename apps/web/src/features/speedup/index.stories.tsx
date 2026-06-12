import type { Meta, StoryObj } from '@storybook/react'
import { Gauge } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'

/**
 * Speedup feature allows users to accelerate pending transactions by
 * resubmitting them with higher gas prices. This is useful when network
 * congestion causes transactions to be stuck in the mempool.
 *
 * Note: The actual SpeedUpModal requires complex transaction state.
 * These stories document the UI patterns and states.
 */
const meta: Meta = {
  title: 'Features/Speedup',
  parameters: {
    layout: 'centered',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

export const SpeedUpModal: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[450px] rounded-lg p-6">
      <Typography variant="h4" className="mb-4">
        Speed up transaction
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-6">
        Increase the gas price to prioritize your transaction in the mempool.
      </Typography>

      <div className="mb-6">
        <div className="mb-2 flex justify-between">
          <Typography variant="paragraph-small">Current gas price</Typography>
          <Typography variant="paragraph-small">25 Gwei</Typography>
        </div>
        <div className="mb-2 flex justify-between">
          <Typography variant="paragraph-small-bold">New gas price</Typography>
          <Typography variant="paragraph-small-bold" className="text-[var(--color-success-main)]">
            37.5 Gwei (+50%)
          </Typography>
        </div>
        <div className="flex justify-between">
          <Typography variant="paragraph-small">Estimated cost</Typography>
          <Typography variant="paragraph-small">~$2.50</Typography>
        </div>
      </div>

      <Alert className="mb-6">
        <AlertDescription>The new transaction will replace the pending one with a higher gas price.</AlertDescription>
      </Alert>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button>
          <Gauge className="size-4" />
          Speed up
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'SpeedUpModal allows users to resubmit a pending transaction with higher gas price.',
      },
    },
  },
}

export const SpeedUpInProgress: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[450px] rounded-lg p-6 text-center">
      <Spinner className="mb-4 size-8" />
      <Typography variant="h4" className="mb-4">
        Speeding up transaction
      </Typography>
      <Typography variant="paragraph-small" color="muted">
        Please wait while we submit the new transaction with higher gas...
      </Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state while the speed-up transaction is being submitted.',
      },
    },
  },
}

export const SpeedUpSuccess: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[450px] rounded-lg p-6">
      <Alert className="mb-4">
        <AlertDescription>Transaction successfully sped up!</AlertDescription>
      </Alert>
      <Typography variant="paragraph-small" color="muted" className="mb-4">
        Your transaction has been resubmitted with a higher gas price. It should be processed soon.
      </Typography>
      <div className="flex justify-end">
        <Button>Close</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success state after the speed-up transaction is submitted.',
      },
    },
  },
}

export const SpeedUpNotAvailable: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[450px] rounded-lg p-6">
      <Alert variant="warning" className="mb-4">
        <AlertDescription>Speed up not available</AlertDescription>
      </Alert>
      <Typography variant="paragraph-small" color="muted">
        This transaction cannot be sped up. It may have already been processed or cancelled.
      </Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'State when speed-up is not available for a transaction.',
      },
    },
  },
}

export const TransactionWithSpeedUp: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[600px] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="paragraph">Send 1.5 ETH</Typography>
          <Typography variant="paragraph-mini" color="muted">
            To: 0x1234...5678
          </Typography>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <Typography variant="paragraph-mini" as="div" className="text-[var(--color-warning-main)]">
              Pending for 10 min
            </Typography>
            <Typography variant="paragraph-mini" color="muted">
              Gas: 25 Gwei
            </Typography>
          </div>
          <Button size="sm" variant="outline">
            <Gauge className="size-4" />
            Speed up
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Transaction list item showing the speed-up button for a pending transaction.',
      },
    },
  },
}

export const SpeedUpMonitor: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[500px] rounded-lg p-6">
      <Typography variant="h4" className="mb-4">
        Transaction monitor
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-6">
        Monitoring pending transactions for potential speed-up opportunities.
      </Typography>

      <div className="flex flex-col gap-4">
        <div className="bg-[var(--color-warning-light)] rounded-md border border-[var(--color-warning-main)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <Typography variant="paragraph-small-bold">Send 1.5 ETH</Typography>
              <Typography variant="paragraph-mini">Pending for 15 minutes</Typography>
            </div>
            <Button size="sm">
              <Gauge className="size-4" />
              Speed up
            </Button>
          </div>
          <Progress value={75}>
            <ProgressTrack className="h-1">
              <ProgressIndicator className="bg-[var(--color-warning-main)]" />
            </ProgressTrack>
          </Progress>
        </div>

        <div className="rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="paragraph-small">Approve USDC</Typography>
              <Typography variant="paragraph-mini" color="muted">
                Pending for 2 minutes
              </Typography>
            </div>
            <Typography variant="paragraph-mini" color="muted">
              Waiting...
            </Typography>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'SpeedUpMonitor tracks pending transactions and suggests speed-up when needed.',
      },
    },
  },
}

export const GasSlider: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[400px] rounded-lg p-6">
      <Typography variant="paragraph-small-bold" className="mb-4 block">
        Select gas increase
      </Typography>
      <div className="mb-4 flex gap-2">
        {['+10%', '+25%', '+50%', '+100%'].map((option) => (
          <Button key={option} variant={option === '+50%' ? 'default' : 'outline'} size="sm" className="flex-1">
            {option}
          </Button>
        ))}
      </div>
      <div className="bg-muted rounded-md p-4">
        <div className="mb-2 flex justify-between">
          <Typography variant="paragraph-small">Current</Typography>
          <Typography variant="paragraph-small">25 Gwei</Typography>
        </div>
        <div className="flex justify-between">
          <Typography variant="paragraph-small-bold">New</Typography>
          <Typography variant="paragraph-small-bold" className="text-[var(--color-success-main)]">
            37.5 Gwei
          </Typography>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Gas increase selector for fine-tuning the speed-up amount.',
      },
    },
  },
}

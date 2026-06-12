import type { Meta, StoryObj } from '@storybook/react'
import { ArrowUpDown } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/**
 * Bridge feature allows users to transfer assets between different blockchains.
 * The bridge widget is embedded as an iframe from an external provider.
 *
 * Note: The actual bridge widget requires external iframe loading which may
 * not work in Storybook. These stories document the component structure.
 */
const meta: Meta = {
  title: 'Features/Bridge',
  parameters: {
    layout: 'padded',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Mock bridge widget UI
const MockBridgeWidget = () => (
  <div className="p-6">
    <Typography variant="h4" className="mb-2">
      Bridge assets
    </Typography>

    {/* Source Chain */}
    <div className="mb-6">
      <Typography variant="paragraph-mini" color="muted" as="div" className="mb-1">
        From
      </Typography>
      <div className="flex gap-4">
        <Select defaultValue="ethereum">
          <SelectTrigger className="min-w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ethereum">Ethereum</SelectItem>
            <SelectItem value="polygon">Polygon</SelectItem>
            <SelectItem value="arbitrum">Arbitrum</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="0.0" type="number" className="flex-1" />
        <Select defaultValue="eth">
          <SelectTrigger className="min-w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eth">ETH</SelectItem>
            <SelectItem value="usdc">USDC</SelectItem>
            <SelectItem value="usdt">USDT</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Typography variant="paragraph-mini" color="muted" className="mt-1">
        Balance: 2.5 ETH
      </Typography>
    </div>

    {/* Swap Direction */}
    <div className="my-4 flex justify-center">
      <ArrowUpDown className="size-5 text-muted-foreground" />
    </div>

    {/* Destination Chain */}
    <div className="mb-6">
      <Typography variant="paragraph-mini" color="muted" as="div" className="mb-1">
        To
      </Typography>
      <div className="flex gap-4">
        <Select defaultValue="polygon">
          <SelectTrigger className="min-w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ethereum">Ethereum</SelectItem>
            <SelectItem value="polygon">Polygon</SelectItem>
            <SelectItem value="arbitrum">Arbitrum</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="0.0" type="number" disabled className="flex-1" />
        <Select defaultValue="eth" disabled>
          <SelectTrigger className="min-w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eth">ETH</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* Fee Info */}
    <div className="mb-6 rounded bg-muted p-4">
      <div className="mb-1 flex justify-between">
        <Typography variant="paragraph-small">Bridge fee</Typography>
        <Typography variant="paragraph-small">~0.001 ETH</Typography>
      </div>
      <div className="flex justify-between">
        <Typography variant="paragraph-small">Estimated time</Typography>
        <Typography variant="paragraph-small">~15 minutes</Typography>
      </div>
    </div>

    <Button size="lg" className="w-full">
      Bridge assets
    </Button>
  </div>
)

// FULL PAGE FIRST
export const BridgePage: StoryObj = {
  render: () => (
    <div className="max-w-[900px]">
      <Typography variant="h4" className="mb-2">
        Bridge
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-6">
        Transfer assets securely between blockchains using the Safe bridge.
      </Typography>

      <div className="rounded-lg bg-background">
        <MockBridgeWidget />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full bridge page layout with header and widget.',
      },
    },
  },
}

export const BridgeWidget: StoryObj = {
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-background">
      <MockBridgeWidget />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BridgeWidget allows users to transfer assets between different blockchains (e.g., Ethereum → Polygon).',
      },
    },
  },
}

export const BridgeDisabled: StoryObj = {
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-background p-8 text-center">
      <Typography variant="h4" className="mb-2">
        Bridge not available
      </Typography>
      <Typography variant="paragraph-small" color="muted">
        The bridge feature is not available on this chain. Please switch to a supported network.
      </Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'State shown when the bridge feature is not enabled for the current chain.',
      },
    },
  },
}

export const BridgeInProgress: StoryObj = {
  render: () => (
    <div className="max-w-[500px] rounded-lg bg-background p-6">
      <Alert className="mb-4">
        <AlertDescription>Bridge transaction in progress</AlertDescription>
      </Alert>
      <Typography variant="paragraph-small" color="muted" className="mb-4">
        Your assets are being bridged from Ethereum to Polygon. This may take 10-20 minutes.
      </Typography>
      <div className="rounded bg-muted p-4">
        <div className="mb-1 flex justify-between">
          <Typography variant="paragraph-small">Amount</Typography>
          <Typography variant="paragraph-small">1.0 ETH</Typography>
        </div>
        <div className="mb-1 flex justify-between">
          <Typography variant="paragraph-small">From</Typography>
          <Typography variant="paragraph-small">Ethereum</Typography>
        </div>
        <div className="flex justify-between">
          <Typography variant="paragraph-small">To</Typography>
          <Typography variant="paragraph-small">Polygon</Typography>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'State shown while a bridge transaction is in progress.',
      },
    },
  },
}

export const BridgeHistory: StoryObj = {
  render: () => (
    <div className="max-w-[600px] rounded-lg bg-background p-6">
      <Typography variant="h4" className="mb-2">
        Bridge history
      </Typography>
      <div className="flex flex-col gap-4">
        {[
          { amount: '1.5 ETH', from: 'Ethereum', to: 'Polygon', status: 'Completed', time: '2 hours ago' },
          { amount: '500 USDC', from: 'Arbitrum', to: 'Ethereum', status: 'Completed', time: '1 day ago' },
          { amount: '0.5 ETH', from: 'Polygon', to: 'Ethereum', status: 'Pending', time: '5 min ago' },
        ].map((tx, i) => (
          <div key={i} className="flex items-center justify-between rounded border p-4">
            <div>
              <Typography variant="paragraph-small-bold" as="div">
                {tx.amount}
              </Typography>
              <Typography variant="paragraph-mini" color="muted">
                {tx.from} → {tx.to}
              </Typography>
            </div>
            <div className="text-right">
              <Typography
                variant="paragraph-mini"
                as="div"
                className={
                  tx.status === 'Completed' ? 'text-[var(--color-success-main)]' : 'text-[var(--color-warning-main)]'
                }
              >
                {tx.status}
              </Typography>
              <Typography variant="paragraph-mini" color="muted">
                {tx.time}
              </Typography>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Bridge transaction history showing past and pending transfers.',
      },
    },
  },
}

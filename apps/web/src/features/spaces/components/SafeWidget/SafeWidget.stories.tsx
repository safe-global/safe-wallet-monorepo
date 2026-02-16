import type { Meta, StoryObj } from '@storybook/react'
import { ArrowUpRight, ChevronRight, Plus, UserRound } from 'lucide-react'
import SafeWidget from './index'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup } from '@/components/ui/avatar'

/**
 * SafeWidget - Compound component for Space dashboard widgets.
 *
 * Uses a parent container (`SafeWidget`) with namespaced subcomponents
 * (`SafeWidget.Item`, `SafeWidget.Footer`) for flexible composition.
 *
 * Figma:
 * - Pending: https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/?node-id=7524-21913
 * - Pending (with networks): https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/?node-id=7524-19575
 * - Accounts: https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/?node-id=7524-19574
 * - Assets: https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/?node-id=7524-21912
 */

const TxIcon = () => (
  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f0fdf4]">
    <ArrowUpRight className="size-5 text-foreground" />
  </div>
)

const meta: Meta<typeof SafeWidget> = {
  title: 'Spaces/SafeWidget',
  component: SafeWidget,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: 'var(--color-background-default, #f4f4f4)', padding: '2rem' }}>
        <div style={{ maxWidth: '560px' }}>
          <Story />
        </div>
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = {
  render: () => (
    <SafeWidget
      title="Pending"
      action={
        <Button variant="ghost" size="icon-sm">
          <ChevronRight className="size-6" />
        </Button>
      }
    >
      <SafeWidget.Item
        label="Send 5 ETH"
        info="Jan 21"
        startNode={<TxIcon />}
        actionNode={<Badge variant="secondary">1 signature needed</Badge>}
      />
      <SafeWidget.Item
        label="Send 5 ETH"
        info="Jan 21"
        startNode={<TxIcon />}
        actionNode={<Badge variant="secondary">Execution needed</Badge>}
      />
      <SafeWidget.Item
        label="Send 5 ETH"
        info="Jan 21"
        startNode={<TxIcon />}
        actionNode={<Badge variant="secondary">1 signature needed</Badge>}
      />
      <SafeWidget.Footer count={14} text="View all pending transactions" />
    </SafeWidget>
  ),
}

export const PendingWithNetworks: Story = {
  render: () => (
    <SafeWidget
      title="Pending"
      action={
        <Button variant="ghost" size="icon-sm">
          <ChevronRight className="size-6" />
        </Button>
      }
    >
      <SafeWidget.Item
        label="Send 5 ETH"
        info="Jan 21"
        startNode={<TxIcon />}
        featuredNode={
          <Avatar size="xs">
            <AvatarFallback className="bg-[#f0fdf4] text-xs font-semibold">CN</AvatarFallback>
          </Avatar>
        }
        actionNode={<Badge variant="secondary">1 signature needed</Badge>}
      />
      <SafeWidget.Item
        label="Send 5 ETH"
        info="Jan 21"
        startNode={<TxIcon />}
        featuredNode={
          <Avatar size="xs">
            <AvatarFallback className="bg-[#f0fdf4] text-xs font-semibold">CN</AvatarFallback>
          </Avatar>
        }
        actionNode={<Badge variant="secondary">1 signature needed</Badge>}
      />
      <SafeWidget.Item
        label="Send 5 ETH"
        info="Jan 21"
        startNode={<TxIcon />}
        featuredNode={
          <Avatar size="xs">
            <AvatarFallback className="bg-[#f0fdf4] text-xs font-semibold">CN</AvatarFallback>
          </Avatar>
        }
        actionNode={<Badge variant="secondary">1 signature needed</Badge>}
      />
      <SafeWidget.Footer count={14} text="View all pending transactions" />
    </SafeWidget>
  ),
}

export const Accounts: Story = {
  render: () => (
    <SafeWidget
      title="Accounts"
      action={
        <Button variant="outline" size="sm">
          <Plus data-icon="inline-start" className="size-4" />
          Add account
        </Button>
      }
    >
      <SafeWidget.Item
        label="My account"
        info="0x8675...a19b"
        startNode={
          <Avatar>
            <AvatarFallback className="bg-[#f0fdf4] text-sm font-semibold">M</AvatarFallback>
          </Avatar>
        }
        featuredNode={
          <AvatarGroup>
            <Avatar size="xs">
              <AvatarImage src="https://safe-transaction-assets.safe.global/chains/1/chain_logo.png" alt="Ethereum" />
              <AvatarFallback>ET</AvatarFallback>
            </Avatar>
          </AvatarGroup>
        }
        actionNode={
          <>
            <span className="text-sm font-medium text-muted-foreground">$39.95M</span>
            <Badge variant="secondary">
              <UserRound className="size-3" />
              3/5
            </Badge>
          </>
        }
      />
      <SafeWidget.Item
        label="Treasury"
        info="0x8675...a19b"
        startNode={
          <Avatar>
            <AvatarFallback className="bg-[#f0fdf4] text-sm font-semibold">T</AvatarFallback>
          </Avatar>
        }
        featuredNode={
          <AvatarGroup>
            <Avatar size="xs">
              <AvatarImage src="https://safe-transaction-assets.safe.global/chains/1/chain_logo.png" alt="Ethereum" />
              <AvatarFallback>ET</AvatarFallback>
            </Avatar>
            <Avatar size="xs">
              <AvatarImage src="https://safe-transaction-assets.safe.global/chains/100/chain_logo.png" alt="Gnosis" />
              <AvatarFallback>GN</AvatarFallback>
            </Avatar>
            <Avatar size="xs">
              <AvatarImage src="https://safe-transaction-assets.safe.global/chains/8453/chain_logo.png" alt="Base" />
              <AvatarFallback>BA</AvatarFallback>
            </Avatar>
          </AvatarGroup>
        }
        actionNode={
          <>
            <span className="text-sm font-medium text-muted-foreground">$39.95M</span>
            <Badge variant="secondary">
              <UserRound className="size-3" />
              3/5
            </Badge>
          </>
        }
      />
      <SafeWidget.Item
        label="Name"
        info="0x8675...a19b"
        highlighted
        startNode={
          <Avatar>
            <AvatarFallback className="bg-[#f0fdf4] text-sm font-semibold">N</AvatarFallback>
          </Avatar>
        }
        featuredNode={
          <AvatarGroup>
            <Avatar size="xs">
              <AvatarImage src="https://safe-transaction-assets.safe.global/chains/100/chain_logo.png" alt="Gnosis" />
              <AvatarFallback>GN</AvatarFallback>
            </Avatar>
            <Avatar size="xs">
              <AvatarImage src="https://safe-transaction-assets.safe.global/chains/137/chain_logo.png" alt="Polygon" />
              <AvatarFallback>PO</AvatarFallback>
            </Avatar>
          </AvatarGroup>
        }
        actionNode={
          <>
            <span className="text-sm font-medium text-muted-foreground">$39.95M</span>
            <Badge variant="secondary">
              <UserRound className="size-3" />
              3/5
            </Badge>
          </>
        }
      />
      <SafeWidget.Footer count={14} text="View all pending transactions" />
    </SafeWidget>
  ),
}

export const Assets: Story = {
  render: () => (
    <SafeWidget
      title="Assets"
      action={
        <Button variant="ghost" size="icon-sm">
          <ChevronRight className="size-6" />
        </Button>
      }
    >
      <SafeWidget.Item
        label="Ether"
        info="19,188.40 ETH"
        startNode={
          <Avatar>
            <AvatarImage src="https://safe-transaction-assets.safe.global/chains/1/chain_logo.png" alt="Ether" />
            <AvatarFallback>ETH</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$39.95M</span>}
      />
      <SafeWidget.Item
        label="Gnosis"
        info="8,40213 GNO"
        startNode={
          <Avatar>
            <AvatarImage src="https://safe-transaction-assets.safe.global/chains/100/chain_logo.png" alt="Gnosis" />
            <AvatarFallback>GNO</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$9,4589</span>}
      />
      <SafeWidget.Item
        label="SAFE Token"
        info="2,188.40 SAFE"
        startNode={
          <Avatar>
            <AvatarImage
              src="https://safe-transaction-assets.safe.global/tokens/logos/0x5aFE3855358E112B5647B952709E6165e1c1eEEe.png"
              alt="SAFE"
            />
            <AvatarFallback className="bg-[#f0fdf4] text-xs font-semibold">SA</AvatarFallback>
          </Avatar>
        }
        actionNode={<span className="text-sm font-medium text-muted-foreground">$1.12M</span>}
      />
      <SafeWidget.Footer count={14} text="View all assets" />
    </SafeWidget>
  ),
}

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Pending</h3>
        <SafeWidget
          title="Pending"
          action={
            <Button variant="ghost" size="icon-sm">
              <ChevronRight className="size-6" />
            </Button>
          }
        >
          <SafeWidget.Item
            label="Send 5 ETH"
            info="Jan 21"
            startNode={<TxIcon />}
            actionNode={<Badge variant="secondary">1 signature needed</Badge>}
          />
          <SafeWidget.Item
            label="Send 5 ETH"
            info="Jan 21"
            startNode={<TxIcon />}
            actionNode={<Badge variant="secondary">Execution needed</Badge>}
          />
          <SafeWidget.Footer count={14} text="View all pending transactions" />
        </SafeWidget>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Assets</h3>
        <SafeWidget
          title="Assets"
          action={
            <Button variant="ghost" size="icon-sm">
              <ChevronRight className="size-6" />
            </Button>
          }
        >
          <SafeWidget.Item
            label="Ether"
            info="19,188.40 ETH"
            startNode={
              <Avatar>
                <AvatarImage src="https://safe-transaction-assets.safe.global/chains/1/chain_logo.png" alt="Ether" />
                <AvatarFallback>ETH</AvatarFallback>
              </Avatar>
            }
            actionNode={<span className="text-sm font-medium text-muted-foreground">$39.95M</span>}
          />
          <SafeWidget.Item
            label="SAFE Token"
            info="2,188.40 SAFE"
            startNode={
              <Avatar>
                <AvatarImage
                  src="https://safe-transaction-assets.safe.global/tokens/logos/0x5aFE3855358E112B5647B952709E6165e1c1eEEe.png"
                  alt="SAFE"
                />
                <AvatarFallback>SA</AvatarFallback>
              </Avatar>
            }
            actionNode={<span className="text-sm font-medium text-muted-foreground">$1.12M</span>}
          />
          <SafeWidget.Footer count={14} text="View all assets" />
        </SafeWidget>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Accounts</h3>
        <SafeWidget
          title="Accounts"
          action={
            <Button variant="outline" size="sm">
              <Plus data-icon="inline-start" className="size-4" />
              Add account
            </Button>
          }
        >
          <SafeWidget.Item
            label="My account"
            info="0x8675...a19b"
            startNode={
              <Avatar>
                <AvatarFallback className="bg-[#f0fdf4] text-sm font-semibold">M</AvatarFallback>
              </Avatar>
            }
            actionNode={
              <>
                <span className="text-sm font-medium text-muted-foreground">$39.95M</span>
                <Badge variant="secondary">
                  <UserRound className="size-3" />
                  3/5
                </Badge>
              </>
            }
          />
          <SafeWidget.Footer count={14} text="View all pending transactions" />
        </SafeWidget>
      </div>
    </div>
  ),
}

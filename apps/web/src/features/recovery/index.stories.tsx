import type { Meta, StoryObj } from '@storybook/react'
import { TriangleAlert, CircleCheck, Clock, ShieldCheck } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

/**
 * Recovery feature allows Safe owners to set up account recovery mechanisms.
 * Recoverers can initiate recovery transactions after a delay period.
 *
 * Key components:
 * - RecoverySettings: Configure recovery parameters
 * - RecoveryList: View pending recovery transactions
 * - RecoveryStatus: Display recovery transaction status
 *
 * Note: Actual components require Redux store and wallet context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/Recovery',
  parameters: {
    layout: 'padded',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Mock recovery data
const mockRecoverers = [
  { address: '0x1234567890123456789012345678901234567890', name: 'Recovery Wallet 1' },
  { address: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01', name: 'Recovery Wallet 2' },
]

const mockRecoveryQueue = [
  {
    id: '1',
    type: 'Account Recovery',
    status: 'pending',
    validFrom: Date.now() + 86400000 * 2, // 2 days from now
    expiresAt: Date.now() + 86400000 * 7, // 7 days from now
    executor: '0x1234567890123456789012345678901234567890',
    isMalicious: false,
  },
  {
    id: '2',
    type: 'Malicious Transaction',
    status: 'expired',
    validFrom: Date.now() - 86400000 * 5,
    expiresAt: Date.now() - 86400000 * 1,
    executor: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
    isMalicious: true,
  },
]

// Mock RecoveryType component
const MockRecoveryType = ({ isMalicious }: { isMalicious: boolean }) => (
  <div className="flex items-center gap-2">
    {isMalicious ? (
      <TriangleAlert className="size-4 text-[var(--color-error-main)]" />
    ) : (
      <ShieldCheck className="size-4 text-primary" />
    )}
    <Typography variant="paragraph-small">{isMalicious ? 'Malicious transaction' : 'Account recovery'}</Typography>
  </div>
)

const statusColorClass = {
  pending: 'text-[var(--color-warning-main)]',
  processing: 'text-[var(--color-info-main)]',
  ready: 'text-[var(--color-success-main)]',
  expired: 'text-[var(--color-error-main)]',
}

const statusLabel = {
  pending: 'Pending',
  processing: 'Processing',
  ready: 'Ready to execute',
  expired: 'Expired',
}

// Mock RecoveryStatus component
const MockRecoveryStatus = ({ status }: { status: 'pending' | 'processing' | 'ready' | 'expired' }) => (
  <Chip variant="outline" className={statusColorClass[status]}>
    {statusLabel[status]}
  </Chip>
)

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
    <div className="mb-4 border-b border-border pb-4">
      <Typography variant="h3">{stateName}</Typography>
      <Typography variant="paragraph-small" color="muted">
        {description}
      </Typography>
    </div>
    <div className="bg-muted rounded-lg p-6">{children}</div>
  </div>
)

// All States - Scrollable view of all Recovery states
export const RecoveryAllStates: StoryObj = {
  render: () => (
    <div className="max-w-[900px]">
      <div className="mb-12 border-b-2 border-primary pb-6">
        <Typography variant="h2">Recovery feature states</Typography>
        <Typography variant="paragraph" color="muted">
          All possible states of the account recovery feature. Scroll to view each state.
        </Typography>
      </div>

      {/* State 1: No Recovery Configured */}
      <StateWrapper
        stateName="No recovery configured"
        description="Initial state when no recovery mechanism is set up for the Safe."
      >
        <div className="max-w-[700px]">
          <Typography variant="h2" className="mb-2">
            Account recovery
          </Typography>
          <Alert className="mb-6">
            <AlertTitle>No recovery setup</AlertTitle>
            <AlertDescription>
              Set up account recovery to allow trusted addresses to recover your Safe if you lose access.
            </AlertDescription>
          </Alert>

          <div className="bg-background rounded-lg p-6">
            <div className="mb-6 flex items-center gap-4">
              <ShieldCheck className="size-10 text-primary" />
              <div>
                <Typography variant="h4">Set up account recovery</Typography>
                <Typography variant="paragraph-small" color="muted">
                  Add trusted addresses that can help recover your Safe
                </Typography>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <CircleCheck className="size-4 text-[var(--color-success-main)]" />
                <Typography variant="paragraph-small">
                  Recoverers can initiate account recovery after a delay
                </Typography>
              </div>
              <div className="flex items-center gap-4">
                <CircleCheck className="size-4 text-[var(--color-success-main)]" />
                <Typography variant="paragraph-small">Owners can cancel malicious recovery attempts</Typography>
              </div>
              <div className="flex items-center gap-4">
                <CircleCheck className="size-4 text-[var(--color-success-main)]" />
                <Typography variant="paragraph-small">Configurable delay period for added security</Typography>
              </div>
            </div>

            <Button>Set up recovery</Button>
          </div>
        </div>
      </StateWrapper>

      {/* State 2: Recovery Configured */}
      <StateWrapper
        stateName="Recovery configured"
        description="Recovery is set up with trusted recoverers and delay period."
      >
        <div className="max-w-[700px]">
          <Typography variant="h2" className="mb-2">
            Account recovery
          </Typography>

          <div className="bg-background mb-6 rounded-lg p-6">
            <Typography variant="h4" className="mb-2">
              Recovery settings
            </Typography>

            <div className="mb-4 flex justify-between">
              <Typography variant="paragraph-small" color="muted">
                Delay period
              </Typography>
              <Typography variant="paragraph-small-bold">7 days</Typography>
            </div>

            <div className="mb-6 flex justify-between">
              <Typography variant="paragraph-small" color="muted">
                Expiration period
              </Typography>
              <Typography variant="paragraph-small-bold">14 days</Typography>
            </div>

            <Typography variant="paragraph-small-bold" className="mb-2 block">
              Recoverers
            </Typography>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecoverers.map((recoverer) => (
                  <TableRow key={recoverer.address}>
                    <TableCell>{recoverer.name}</TableCell>
                    <TableCell className="font-mono">
                      {recoverer.address.slice(0, 10)}...{recoverer.address.slice(-8)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button variant="outline">Edit recovery settings</Button>
        </div>
      </StateWrapper>

      {/* State 3: Recovery In Progress */}
      <StateWrapper
        stateName="Recovery in progress"
        description="A recovery transaction has been initiated and is waiting for the delay period."
      >
        <div className="max-w-[700px]">
          <Typography variant="h2" className="mb-2">
            Account recovery
          </Typography>

          <Alert variant="warning" className="mb-6">
            <AlertTitle>Recovery in progress</AlertTitle>
            <AlertDescription>
              A recovery transaction has been initiated. If this was not you, cancel it immediately.
            </AlertDescription>
          </Alert>

          <div className="bg-background rounded-lg p-6">
            <Typography variant="h4" className="mb-2">
              Pending recovery
            </Typography>

            <div className="mb-6 flex items-center gap-4">
              <Clock className="size-6 text-[var(--color-warning-main)]" />
              <div>
                <Typography variant="paragraph-small" color="muted">
                  Can be executed in
                </Typography>
                <Typography variant="h4">2 days, 4 hours</Typography>
              </div>
            </div>

            <Progress value={30} className="mb-6">
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>

            <div className="flex gap-4">
              <Button variant="destructive">Cancel recovery</Button>
              <Button variant="outline">View details</Button>
            </div>
          </div>
        </div>
      </StateWrapper>

      {/* State 4: Recovery Queue */}
      <StateWrapper stateName="Recovery queue" description="List of all recovery transactions with their statuses.">
        <div className="max-w-[700px]">
          <Typography variant="h4" className="mb-2">
            Recovery queue
          </Typography>
          <Accordion defaultValue={['item-1']}>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                <div className="flex w-full items-center gap-4">
                  <MockRecoveryType isMalicious={false} />
                  <div className="flex-1" />
                  <MockRecoveryStatus status="pending" />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <Typography variant="paragraph-small" color="muted">
                      Initiated by
                    </Typography>
                    <Typography variant="paragraph-small" className="font-mono">
                      0x1234...5678
                    </Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="paragraph-small" color="muted">
                      Valid from
                    </Typography>
                    <Typography variant="paragraph-small">In 2 days</Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="paragraph-small" color="muted">
                      Expires
                    </Typography>
                    <Typography variant="paragraph-small">In 7 days</Typography>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </StateWrapper>

      {/* State 5: Status Variants */}
      <StateWrapper stateName="Status variants" description="All possible status indicators for recovery transactions.">
        <div className="bg-background max-w-[400px] rounded-lg p-6">
          <Typography variant="paragraph-small-bold" className="mb-2 block">
            Recovery status indicators
          </Typography>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Typography variant="paragraph-small">Waiting for delay period</Typography>
              <MockRecoveryStatus status="pending" />
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="paragraph-small">Being processed</Typography>
              <MockRecoveryStatus status="processing" />
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="paragraph-small">Can be executed</Typography>
              <MockRecoveryStatus status="ready" />
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="paragraph-small">Expired</Typography>
              <MockRecoveryStatus status="expired" />
            </div>
          </div>
        </div>
      </StateWrapper>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All states of the Recovery feature displayed vertically for easy review.',
      },
    },
  },
}

// Individual state: Full Recovery Settings Page
export const FullRecoveryPage: StoryObj = {
  render: () => (
    <div className="max-w-[900px]">
      <Typography variant="h2" className="mb-2">
        Account recovery
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-6">
        Set up recovery options to regain access to your Safe if you lose your owner keys.
      </Typography>

      <div className="bg-background mb-6 rounded-lg p-6">
        <Typography variant="h4" className="mb-2">
          Recovery settings
        </Typography>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recoverer</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRecoverers.map((recoverer) => (
              <TableRow key={recoverer.address}>
                <TableCell>{recoverer.name}</TableCell>
                <TableCell>
                  <Typography variant="paragraph-small" className="font-mono">
                    {recoverer.address.slice(0, 10)}...{recoverer.address.slice(-8)}
                  </Typography>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" className="text-[var(--color-error-main)]">
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="bg-muted mt-4 rounded-md p-4">
          <Typography variant="paragraph-small" color="muted">
            Recovery delay: <strong>2 days</strong>
          </Typography>
          <Typography variant="paragraph-small" color="muted">
            Expiry period: <strong>7 days</strong>
          </Typography>
        </div>

        <Button className="mt-4">Add recoverer</Button>
      </div>

      <div className="bg-background rounded-lg p-6">
        <Typography variant="h4" className="mb-2">
          Recovery queue
        </Typography>
        <Accordion>
          {mockRecoveryQueue.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>
                <div className="flex w-full items-center gap-4">
                  <MockRecoveryType isMalicious={item.isMalicious} />
                  <div className="flex-1" />
                  <MockRecoveryStatus status={item.status as 'pending' | 'expired'} />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Typography variant="paragraph-small" color="muted">
                  Executor: {item.executor.slice(0, 10)}...{item.executor.slice(-8)}
                </Typography>
                <Typography variant="paragraph-small" color="muted">
                  Valid from: {new Date(item.validFrom).toLocaleDateString()}
                </Typography>
                {!item.isMalicious && item.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm">Execute</Button>
                    <Button variant="outline" size="sm" className="text-[var(--color-error-main)]">
                      Cancel
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full recovery settings page with recoverers list and recovery queue.',
      },
    },
  },
}

// Recovery not configured
export const NoRecoveryConfigured: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[600px] rounded-lg p-8 text-center">
      <ShieldCheck className="mx-auto mb-4 size-16 text-muted-foreground" />
      <Typography variant="h4" className="mb-2">
        Recovery not set up
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-6">
        Account recovery allows you to regain access to your Safe if you lose your owner keys. Set up recovery to
        protect your assets.
      </Typography>
      <Button>Set up recovery</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state when recovery is not configured.',
      },
    },
  },
}

// Active recovery in progress
export const RecoveryInProgress: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[600px] rounded-lg p-6">
      <Alert variant="warning" className="mb-4">
        <AlertTitle>Recovery in progress</AlertTitle>
      </Alert>

      <div className="mb-6">
        <div className="mb-2 flex justify-between">
          <Typography variant="paragraph-small">Time remaining</Typography>
          <Typography variant="paragraph-small-bold">1 day 14 hours</Typography>
        </div>
        <Progress value={30}>
          <ProgressTrack className="h-2">
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
      </div>

      <div className="bg-muted mb-4 rounded-md p-4">
        <Typography variant="paragraph-small" color="muted">
          Initiated by
        </Typography>
        <Typography variant="paragraph-small" className="font-mono">
          0x1234...5678
        </Typography>
      </div>

      <Typography variant="paragraph-small" color="muted" className="mb-4">
        If you did not initiate this recovery, cancel it immediately to protect your Safe.
      </Typography>

      <Button variant="destructive" className="w-full">
        Cancel recovery
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Recovery transaction in progress with countdown.',
      },
    },
  },
}

// Recovery status chips
export const RecoveryStatusVariants: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[400px] rounded-lg p-6">
      <Typography variant="paragraph-small-bold" className="mb-2 block">
        Recovery status variants
      </Typography>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Typography variant="paragraph-small">Pending (delay period)</Typography>
          <MockRecoveryStatus status="pending" />
        </div>
        <div className="flex items-center justify-between">
          <Typography variant="paragraph-small">Processing</Typography>
          <MockRecoveryStatus status="processing" />
        </div>
        <div className="flex items-center justify-between">
          <Typography variant="paragraph-small">Ready to execute</Typography>
          <MockRecoveryStatus status="ready" />
        </div>
        <div className="flex items-center justify-between">
          <Typography variant="paragraph-small">Expired</Typography>
          <MockRecoveryStatus status="expired" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different recovery status states.',
      },
    },
  },
}

// Recovery type indicators
export const RecoveryTypeIndicators: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[400px] rounded-lg p-6">
      <Typography variant="paragraph-small-bold" className="mb-2 block">
        Recovery type indicators
      </Typography>
      <div className="flex flex-col gap-4">
        <div className="rounded-md border border-border p-4">
          <MockRecoveryType isMalicious={false} />
          <Typography variant="paragraph-mini" color="muted" className="mt-2 block">
            Legitimate recovery attempt by authorized recoverer
          </Typography>
        </div>
        <div className="bg-[var(--color-error-background)] rounded-md border border-[var(--color-error-main)] p-4">
          <MockRecoveryType isMalicious={true} />
          <Typography variant="paragraph-mini" className="mt-2 block text-[var(--color-error-main)]">
            Potentially malicious - review carefully before proceeding
          </Typography>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Recovery type indicators showing legitimate vs malicious attempts.',
      },
    },
  },
}

// Recovery list item
export const RecoveryListItem: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[600px] rounded-lg">
      <Accordion defaultValue={['item-1']}>
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className="flex w-full items-center gap-4">
              <MockRecoveryType isMalicious={false} />
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <Typography variant="paragraph-mini">2 days left</Typography>
              </div>
              <MockRecoveryStatus status="pending" />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <div>
                <Typography variant="paragraph-mini" color="muted">
                  Executor
                </Typography>
                <Typography variant="paragraph-small" className="font-mono">
                  0x1234567890123456789012345678901234567890
                </Typography>
              </div>
              <div>
                <Typography variant="paragraph-mini" color="muted">
                  Transaction hash
                </Typography>
                <Typography variant="paragraph-small" className="font-mono">
                  0xabcd...ef01
                </Typography>
              </div>
              <div className="flex gap-4">
                <Button size="sm">Execute</Button>
                <Button variant="outline" size="sm" className="text-[var(--color-error-main)]">
                  Cancel
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Individual recovery list item with expandable details.',
      },
    },
  },
}

// Recovery settings card
export const RecoverySettingsCard: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[500px] rounded-lg p-6">
      <div className="mb-4 flex items-center gap-4">
        <CircleCheck className="size-6 text-[var(--color-success-main)]" />
        <Typography variant="h4">Recovery enabled</Typography>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <Typography variant="paragraph-small" color="muted">
            Recoverers
          </Typography>
          <Typography variant="paragraph-small-bold">2</Typography>
        </div>
        <div className="flex justify-between">
          <Typography variant="paragraph-small" color="muted">
            Delay period
          </Typography>
          <Typography variant="paragraph-small-bold">2 days</Typography>
        </div>
        <div className="flex justify-between">
          <Typography variant="paragraph-small" color="muted">
            Expiry period
          </Typography>
          <Typography variant="paragraph-small-bold">7 days</Typography>
        </div>
      </div>

      <Button variant="outline" className="mt-6 w-full">
        Edit recovery settings
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Recovery settings summary card.',
      },
    },
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Link2, Link2Off, Clipboard, CircleCheck, TriangleAlert, Trash2 } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { List, ListItem, ListItemText } from '@/components/ui/list'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'

/**
 * WalletConnect feature enables connecting Safe accounts to dApps.
 * Users can pair with dApps, approve session proposals, and manage
 * active connections.
 *
 * Key components:
 * - WcConnectionForm: Enter pairing URI
 * - WcProposalForm: Approve/reject dApp connection
 * - WcSessionList: Manage active sessions
 * - WcConnectionState: Connection success/disconnect state
 *
 * Note: Actual components require WalletConnect SDK context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/WalletConnect',
  parameters: {
    layout: 'centered',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Mock session data
const mockSessions = [
  {
    topic: 'session1',
    name: 'Uniswap',
    url: 'https://app.uniswap.org',
    icon: 'https://app.uniswap.org/favicon.ico',
    chains: ['Ethereum', 'Polygon'],
  },
  {
    topic: 'session2',
    name: 'OpenSea',
    url: 'https://opensea.io',
    icon: 'https://opensea.io/favicon.ico',
    chains: ['Ethereum'],
  },
  {
    topic: 'session3',
    name: 'Aave',
    url: 'https://app.aave.com',
    icon: 'https://app.aave.com/favicon.ico',
    chains: ['Ethereum', 'Arbitrum'],
  },
]

// Mock proposal data
const mockProposal = {
  name: 'Example dApp',
  url: 'https://example.com',
  icon: null,
  description: 'A decentralized application for managing assets',
  chains: ['Ethereum'],
  methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData'],
}

// Mock WcLogoHeader
const MockWcLogoHeader = ({ error }: { error?: string }) => (
  <div className="mb-6 text-center">
    <div className="bg-primary mx-auto mb-4 flex size-[60px] items-center justify-center rounded-lg">
      <Link2 className="size-8 text-white" />
    </div>
    <Typography variant="h4">WalletConnect</Typography>
    {error && (
      <Typography variant="paragraph-small" className="text-[var(--color-error-main)]">
        {error}
      </Typography>
    )}
  </div>
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

const SessionRow = ({ session }: { session: (typeof mockSessions)[0] }) => (
  <ListItem className="bg-muted mb-2 gap-3 rounded-md p-2">
    <Avatar size="default">
      <AvatarImage src={session.icon} />
      <AvatarFallback>{session.name[0]}</AvatarFallback>
    </Avatar>
    <ListItemText
      primary={session.name}
      secondary={
        <span className="flex flex-wrap gap-1">
          {session.chains.map((chain) => (
            <Chip key={chain}>{chain}</Chip>
          ))}
        </span>
      }
    />
    <Button variant="ghost" size="icon-sm" className="ml-auto text-[var(--color-error-main)]" aria-label="Disconnect">
      <Link2Off className="size-4" />
    </Button>
  </ListItem>
)

// All States - Scrollable view of entire WalletConnect flow
export const WalletConnectAllStates: StoryObj = {
  render: () => {
    return (
      <div className="max-w-[550px]">
        <div className="mb-12 border-b-2 border-primary pb-6">
          <Typography variant="h2">WalletConnect flow</Typography>
          <Typography variant="paragraph" color="muted">
            Complete walkthrough of the WalletConnect connection process. Scroll to view each state.
          </Typography>
        </div>

        {/* State 1: Empty - No Sessions */}
        <StateWrapper
          stateName="Initial state (no sessions)"
          description="User sees the connection form with no active sessions."
        >
          <div className="bg-background max-w-[400px] rounded-lg p-6">
            <MockWcLogoHeader />
            <Input placeholder="Paste pairing code or URI" className="mb-6" />
            <Button className="mb-6 w-full" disabled>
              Connect
            </Button>
            <Separator className="my-4" />
            <div className="py-6 text-center">
              <Typography variant="paragraph-small" color="muted">
                No active sessions
              </Typography>
              <Typography variant="paragraph-mini" color="muted">
                Connect to a dApp to get started
              </Typography>
            </div>
          </div>
        </StateWrapper>

        {/* State 2: Connection Proposal */}
        <StateWrapper
          stateName="Connection proposal"
          description="A dApp requests to connect. User reviews permissions before approving."
        >
          <div className="bg-background max-w-[450px] rounded-lg p-6">
            <Typography variant="h4" className="mb-2">
              Connection request
            </Typography>

            <div className="mb-6 flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarFallback>{mockProposal.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <Typography variant="paragraph-bold">{mockProposal.name}</Typography>
                <Typography variant="paragraph-mini" color="muted">
                  {mockProposal.url}
                </Typography>
              </div>
            </div>

            <Alert className="mb-4">
              <AlertDescription>{mockProposal.name} wants to connect to your Safe</AlertDescription>
            </Alert>

            <Typography variant="paragraph-small-bold" className="mb-2 block">
              Requested permissions
            </Typography>
            <div className="mb-4 flex flex-wrap gap-1">
              {mockProposal.methods.map((method) => (
                <Chip key={method} variant="outline">
                  {method}
                </Chip>
              ))}
            </div>

            <Typography variant="paragraph-small-bold" className="mb-2 block">
              Networks
            </Typography>
            <div className="mb-6 flex flex-wrap gap-1">
              {mockProposal.chains.map((chain) => (
                <Chip key={chain}>{chain}</Chip>
              ))}
            </div>

            <Field orientation="horizontal" className="mb-4">
              <Checkbox id="risk-1" defaultChecked />
              <FieldLabel htmlFor="risk-1">I understand the risks of connecting</FieldLabel>
            </Field>

            <div className="flex gap-4">
              <Button variant="outline" className="w-full">
                Reject
              </Button>
              <Button className="w-full">Approve</Button>
            </div>
          </div>
        </StateWrapper>

        {/* State 3: Connected */}
        <StateWrapper
          stateName="Connected successfully"
          description="Connection established. User sees confirmation with linked accounts."
        >
          <div className="bg-background max-w-[400px] rounded-lg p-8 text-center">
            <CircleCheck className="mx-auto mb-4 size-16 text-[var(--color-success-main)]" />
            <Typography variant="h4" className="mb-2">
              Connected
            </Typography>

            <div className="my-6 flex items-center justify-center gap-4">
              <Avatar>
                <AvatarFallback>S</AvatarFallback>
              </Avatar>
              <Link2 className="size-5 text-[var(--color-success-main)]" />
              <Avatar>
                <AvatarFallback>{mockSessions[0].name[0]}</AvatarFallback>
              </Avatar>
            </div>

            <Typography variant="paragraph-small" color="muted">
              Your Safe is now connected to {mockSessions[0].name}
            </Typography>
          </div>
        </StateWrapper>

        {/* State 4: Active Sessions */}
        <StateWrapper
          stateName="Active sessions"
          description="User can view and manage all active WalletConnect sessions."
        >
          <div className="bg-background max-w-[450px] rounded-lg p-6">
            <MockWcLogoHeader />
            <Input placeholder="Paste pairing code or URI" defaultValue="" className="mb-6" />
            <Button className="mb-6 w-full" disabled>
              Connect
            </Button>
            <Separator className="my-4" />
            <Typography variant="paragraph-small-bold" className="mb-4 block">
              Active sessions ({mockSessions.length})
            </Typography>
            <List>
              {mockSessions.map((session) => (
                <SessionRow key={session.topic} session={session} />
              ))}
            </List>
          </div>
        </StateWrapper>

        {/* State 5: Disconnected */}
        <StateWrapper stateName="Disconnected" description="Confirmation shown when a session is disconnected.">
          <div className="bg-background max-w-[400px] rounded-lg p-8 text-center">
            <Link2Off className="mx-auto mb-4 size-16 text-muted-foreground" />
            <Typography variant="h4" className="mb-2">
              Disconnected
            </Typography>
            <Typography variant="paragraph-small" color="muted">
              {mockSessions[0].name} has been disconnected from your Safe.
            </Typography>
          </div>
        </StateWrapper>

        {/* State 6: Error */}
        <StateWrapper
          stateName="Error state"
          description="Shown when connection fails due to invalid URI or network error."
        >
          <div className="bg-background max-w-[400px] rounded-lg p-6">
            <MockWcLogoHeader error="Connection failed" />
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>Failed to connect: Invalid pairing URI</AlertDescription>
            </Alert>
            <Input placeholder="Paste pairing code or URI" aria-invalid defaultValue="invalid-uri" className="mb-4" />
            <Button className="w-full">Try again</Button>
          </div>
        </StateWrapper>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'All states of the WalletConnect flow displayed vertically for easy review.',
      },
    },
  },
}

// Full page first - WalletConnect Main UI
export const FullWalletConnectUI: StoryObj = {
  render: () => {
    const [uri, setUri] = useState('')

    return (
      <div className="bg-background max-w-[450px] rounded-lg p-6">
        <MockWcLogoHeader />

        <InputGroup className="mb-6">
          <InputGroupInput
            placeholder="Paste pairing code or URI"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton onClick={() => setUri('wc:example...')} aria-label="Paste">
              <Clipboard className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <Button className="mb-6 w-full" disabled={!uri}>
          Connect
        </Button>

        <Separator className="my-4" />

        <Typography variant="paragraph-small-bold" className="mb-4 block">
          Active sessions ({mockSessions.length})
        </Typography>

        <List>
          {mockSessions.map((session) => (
            <SessionRow key={session.topic} session={session} />
          ))}
        </List>

        <Accordion className="mt-4">
          <AccordionItem value="how-to">
            <AccordionTrigger>
              <Typography variant="paragraph-small">How to connect</Typography>
            </AccordionTrigger>
            <AccordionContent>
              <Typography variant="paragraph-small" color="muted">
                1. Open a WalletConnect-compatible dApp
                <br />
                2. Click &quot;Connect Wallet&quot; and select WalletConnect
                <br />
                3. Copy the pairing code and paste it here
              </Typography>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Full WalletConnect UI with connection form and active sessions.',
      },
    },
  },
}

// Connection Form
export const ConnectionForm: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[400px] rounded-lg p-6">
      <MockWcLogoHeader />

      <InputGroup className="mb-4">
        <InputGroupInput placeholder="Paste pairing code or URI" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Paste">
            <Clipboard className="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <Button className="w-full" disabled>
        Connect
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WalletConnect pairing URI input form.',
      },
    },
  },
}

// Proposal Form
export const ProposalForm: StoryObj = {
  render: () => {
    const [accepted, setAccepted] = useState(false)

    return (
      <div className="bg-background max-w-[450px] rounded-lg p-6">
        <Typography variant="h4" className="mb-2">
          Connection request
        </Typography>

        <div className="mb-6 flex items-center gap-4">
          <Avatar className="size-12">
            <AvatarFallback>{mockProposal.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <Typography variant="paragraph-bold">{mockProposal.name}</Typography>
            <Typography variant="paragraph-mini" color="muted">
              {mockProposal.url}
            </Typography>
          </div>
        </div>

        <Alert className="mb-4">
          <AlertDescription>{mockProposal.name} wants to connect to your Safe</AlertDescription>
        </Alert>

        <Typography variant="paragraph-small-bold" className="mb-2 block">
          Requested permissions
        </Typography>
        <div className="mb-4 flex flex-wrap gap-1">
          {mockProposal.methods.map((method) => (
            <Chip key={method} variant="outline">
              {method}
            </Chip>
          ))}
        </div>

        <Typography variant="paragraph-small-bold" className="mb-2 block">
          Networks
        </Typography>
        <div className="mb-6 flex flex-wrap gap-1">
          {mockProposal.chains.map((chain) => (
            <Chip key={chain}>{chain}</Chip>
          ))}
        </div>

        <Field orientation="horizontal" className="mb-4">
          <Checkbox id="risk-proposal" checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} />
          <FieldLabel htmlFor="risk-proposal">I understand the risks of connecting</FieldLabel>
        </Field>

        <div className="flex gap-4">
          <Button variant="outline" className="w-full">
            Reject
          </Button>
          <Button className="w-full" disabled={!accepted}>
            Approve
          </Button>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'dApp connection proposal approval form.',
      },
    },
  },
}

// Session List
export const SessionList: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[400px] rounded-lg p-6">
      <Typography variant="h4" className="mb-2">
        Active sessions
      </Typography>

      <List>
        {mockSessions.map((session) => (
          <ListItem key={session.topic} className="bg-muted mb-2 gap-3 rounded-md p-2">
            <Avatar size="default">
              <AvatarImage src={session.icon} />
              <AvatarFallback>{session.name[0]}</AvatarFallback>
            </Avatar>
            <ListItemText primary={session.name} secondary={session.url} />
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto text-[var(--color-error-main)]"
              title="Disconnect"
              aria-label="Disconnect"
            >
              <Trash2 className="size-4" />
            </Button>
          </ListItem>
        ))}
      </List>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'List of active WalletConnect sessions.',
      },
    },
  },
}

// Connection State - Connected
export const ConnectionStateConnected: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[400px] rounded-lg p-8 text-center">
      <CircleCheck className="mx-auto mb-4 size-16 text-[var(--color-success-main)]" />
      <Typography variant="h4" className="mb-2">
        Connected
      </Typography>

      <div className="my-6 flex items-center justify-center gap-4">
        <Avatar>
          <AvatarFallback>S</AvatarFallback>
        </Avatar>
        <Link2 className="size-5 text-[var(--color-success-main)]" />
        <Avatar>
          <AvatarFallback>{mockSessions[0].name[0]}</AvatarFallback>
        </Avatar>
      </div>

      <Typography variant="paragraph-small" color="muted">
        Your Safe is now connected to {mockSessions[0].name}
      </Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Connection success state showing Safe connected to dApp.',
      },
    },
  },
}

// Connection State - Disconnected
export const ConnectionStateDisconnected: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[400px] rounded-lg p-8 text-center">
      <Link2Off className="mx-auto mb-4 size-16 text-muted-foreground" />
      <Typography variant="h4" className="mb-2">
        Disconnected
      </Typography>

      <Typography variant="paragraph-small" color="muted">
        {mockSessions[0].name} has been disconnected from your Safe.
      </Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disconnection confirmation state.',
      },
    },
  },
}

// Empty Sessions
export const EmptySessions: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[400px] rounded-lg p-6">
      <MockWcLogoHeader />

      <Input placeholder="Paste pairing code or URI" className="mb-6" />

      <Button className="mb-6 w-full" disabled>
        Connect
      </Button>

      <Separator className="my-4" />

      <div className="py-6 text-center">
        <Typography variant="paragraph-small" color="muted">
          No active sessions
        </Typography>
        <Typography variant="paragraph-mini" color="muted">
          Connect to a dApp to get started
        </Typography>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WalletConnect UI with no active sessions.',
      },
    },
  },
}

// Error State
export const ErrorState: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[400px] rounded-lg p-6">
      <MockWcLogoHeader error="Connection failed" />

      <Alert variant="destructive" className="mb-4">
        <AlertDescription>Failed to connect: Invalid pairing URI</AlertDescription>
      </Alert>

      <Input placeholder="Paste pairing code or URI" aria-invalid defaultValue="invalid-uri" className="mb-4" />

      <Button className="w-full">Try again</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state when connection fails.',
      },
    },
  },
}

// High Risk Proposal
export const HighRiskProposal: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[450px] rounded-lg p-6">
      <Typography variant="h4" className="mb-2">
        Connection request
      </Typography>

      <Alert variant="warning" className="mb-6">
        <TriangleAlert className="size-4" />
        <AlertTitle>Proceed with caution</AlertTitle>
        <AlertDescription>This dApp is not verified and may be malicious.</AlertDescription>
      </Alert>

      <div className="mb-6 flex items-center gap-4">
        <Avatar className="bg-[var(--color-warning-main)]">
          <AvatarFallback className="bg-[var(--color-warning-main)]">?</AvatarFallback>
        </Avatar>
        <div>
          <Typography variant="paragraph-bold">Unknown dApp</Typography>
          <Typography variant="paragraph-mini" color="muted">
            https://suspicious-site.com
          </Typography>
        </div>
      </div>

      <Field orientation="horizontal" className="mb-4">
        <Checkbox id="risk-high" />
        <FieldLabel htmlFor="risk-high">I understand this dApp is not verified and accept the risks</FieldLabel>
      </Field>

      <div className="flex gap-4">
        <Button variant="destructive" className="w-full">
          Reject
        </Button>
        <Button variant="outline" className="w-full" disabled>
          Approve
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'High-risk dApp proposal with warnings.',
      },
    },
  },
}

// Help Hints
export const HelpHints: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[400px] rounded-lg p-6">
      <Accordion>
        <AccordionItem value="how-to">
          <AccordionTrigger>
            <Typography variant="paragraph-small">How to connect to a dApp</Typography>
          </AccordionTrigger>
          <AccordionContent>
            <Typography variant="paragraph-small" color="muted">
              1. Open a WalletConnect-compatible dApp
              <br />
              2. Click &quot;Connect Wallet&quot; and select WalletConnect
              <br />
              3. Copy the pairing code and paste it above
            </Typography>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="what-is">
          <AccordionTrigger>
            <Typography variant="paragraph-small">What is WalletConnect?</Typography>
          </AccordionTrigger>
          <AccordionContent>
            <Typography variant="paragraph-small" color="muted">
              WalletConnect is an open protocol that allows you to connect your Safe to decentralized applications
              (dApps) securely.
            </Typography>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="is-safe">
          <AccordionTrigger>
            <Typography variant="paragraph-small">Is it safe?</Typography>
          </AccordionTrigger>
          <AccordionContent>
            <Typography variant="paragraph-small" color="muted">
              Always verify the dApp URL before approving a connection. Only connect to trusted applications.
            </Typography>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Help accordion with usage instructions.',
      },
    },
  },
}

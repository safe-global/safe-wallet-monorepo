import type { Meta, StoryObj } from '@storybook/react'
import { Mail, Braces, CircleCheck, Hourglass } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Progress } from '@/components/ui/progress'

/**
 * Safe Messages components handle off-chain message signing for Safe accounts.
 * Messages require threshold signatures before being considered "signed".
 *
 * This includes EIP-191 personal messages and EIP-712 typed data signing.
 *
 * Note: Actual components require Redux store and wallet context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Components/SafeMessages',
  parameters: {
    layout: 'padded',
  },
}

export default meta

// Mock message type component
const MockMsgType = ({ isTypedData = false }: { isTypedData?: boolean }) => (
  <div className="flex items-center gap-2">
    {isTypedData ? <Braces className="size-5" /> : <Mail className="size-5" />}
    <Typography variant="paragraph-small">{isTypedData ? 'Typed data (EIP-712)' : 'Personal message'}</Typography>
  </div>
)

// Mock message summary row
const MockMsgSummary = ({
  message,
  isTypedData = false,
  confirmations,
  required,
  isConfirmed = false,
}: {
  message: string
  isTypedData?: boolean
  confirmations: number
  required: number
  isConfirmed?: boolean
}) => (
  <div className="flex items-center justify-between border-b border-border p-4 hover:bg-muted">
    <div className="flex items-center gap-4">
      <MockMsgType isTypedData={isTypedData} />
      <Typography variant="paragraph-small" className="max-w-[300px] truncate">
        {message}
      </Typography>
    </div>
    <div className="flex items-center gap-4">
      <Chip
        className={
          isConfirmed
            ? 'bg-[var(--color-success-light)] text-[var(--color-success-dark)]'
            : 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]'
        }
      >
        {isConfirmed ? <CircleCheck className="size-3" /> : <Hourglass className="size-3" />}
        {`${confirmations}/${required}`}
      </Chip>
      {!isConfirmed && <Button size="sm">Sign</Button>}
    </div>
  </div>
)

// Mock signers component
const MockMsgSigners = ({
  signers,
  confirmations,
}: {
  signers: { address: string; hasSigned: boolean }[]
  confirmations: number
}) => (
  <div>
    <Typography variant="paragraph-small-medium" as="div" className="mb-2">
      Confirmations ({confirmations}/{signers.length} required)
    </Typography>
    <Progress value={(confirmations / signers.length) * 100} className="mb-4" />
    <div className="flex flex-col gap-2">
      {signers.map((signer, i) => (
        <div
          key={i}
          className={`flex items-center justify-between rounded border border-border p-2 ${
            signer.hasSigned ? 'bg-[var(--color-success-light)]' : 'bg-transparent'
          }`}
        >
          <Typography variant="paragraph-small" className="font-mono">
            {signer.address.slice(0, 10)}...{signer.address.slice(-8)}
          </Typography>
          {signer.hasSigned ? (
            <CircleCheck className="size-5 text-[var(--color-success-main)]" />
          ) : (
            <Typography variant="paragraph-mini" color="muted">
              Pending
            </Typography>
          )}
        </div>
      ))}
    </div>
  </div>
)

// Stories - FULL PAGE FIRST

export const FullMessagePage: StoryObj = {
  render: () => (
    <div className="max-w-[900px]">
      <Typography variant="h4" className="mb-2">
        Messages
      </Typography>
      <Typography variant="paragraph-small" color="muted" as="div" className="mb-6">
        View and sign off-chain messages for your Safe account.
      </Typography>

      <div className="mb-4 rounded bg-card">
        <div className="border-b border-border p-4">
          <Typography variant="paragraph-medium">Pending messages</Typography>
        </div>
        <MockMsgSummary message="Hello, Safe!" confirmations={1} required={2} />
        <MockMsgSummary
          message='{"types":{"Permit":[...]},"domain":{...}}'
          isTypedData
          confirmations={0}
          required={2}
        />
      </div>

      <div className="rounded bg-card">
        <div className="border-b border-border p-4">
          <Typography variant="paragraph-medium">Signed messages</Typography>
        </div>
        <MockMsgSummary message="Contract agreement signed" confirmations={2} required={2} isConfirmed />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Full messages page layout with pending and signed messages.',
      },
    },
  },
}

export const MessageType: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6 rounded bg-card p-6">
      <div>
        <Typography variant="paragraph-mini" color="muted" as="div" className="mb-2">
          Personal message
        </Typography>
        <MockMsgType />
      </div>
      <div>
        <Typography variant="paragraph-mini" color="muted" as="div" className="mb-2">
          Typed data (EIP-712)
        </Typography>
        <MockMsgType isTypedData />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'MsgType displays the message type icon and label.',
      },
    },
  },
}

export const MessageSummary: StoryObj = {
  render: () => (
    <div className="max-w-[800px] rounded bg-card">
      <Typography variant="paragraph-small-medium" as="div" className="border-b border-border p-4">
        Message queue
      </Typography>
      <MockMsgSummary message="Hello, Safe!" confirmations={1} required={2} />
      <MockMsgSummary message='{"types":{"Permit":[...]},"domain":{...}}' isTypedData confirmations={1} required={2} />
      <MockMsgSummary message="Signed agreement for contract XYZ" confirmations={2} required={2} isConfirmed />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'MsgSummary displays message row with type, confirmations, status, and action button.',
      },
    },
  },
}

export const MessageSigners: StoryObj = {
  render: () => (
    <div className="max-w-sm rounded bg-card p-6">
      <MockMsgSigners
        confirmations={1}
        signers={[
          { address: '0x1234567890123456789012345678901234567890', hasSigned: true },
          { address: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01', hasSigned: false },
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'MsgSigners displays the list of signers with confirmation status.',
      },
    },
  },
}

export const SignButton: StoryObj = {
  render: () => (
    <div className="flex gap-4 rounded bg-card p-6">
      <div>
        <Typography variant="paragraph-mini" as="div" className="mb-2">
          Full button
        </Typography>
        <Button>Sign message</Button>
      </div>
      <div>
        <Typography variant="paragraph-mini" as="div" className="mb-2">
          Compact button
        </Typography>
        <Button size="sm">Sign</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'SignMsgButton in full and compact variants.',
      },
    },
  },
}

export const MessageInfoBox: StoryObj = {
  render: () => (
    <div className="max-w-md rounded bg-card p-6">
      <div className="rounded border border-[var(--color-info-main)] bg-[var(--color-info-light)] p-4">
        <Typography variant="paragraph-small-bold" as="div" className="mb-2">
          Message signing
        </Typography>
        <Typography variant="paragraph-small" color="muted">
          This is an off-chain message that will be signed by your Safe. No transaction will be executed.
        </Typography>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'InfoBox displays informational content with title and message.',
      },
    },
  },
}

export const DecodedMessage: StoryObj = {
  render: () => (
    <div className="max-w-xl rounded bg-card p-6">
      <Typography variant="paragraph-small-medium" as="div" className="mb-2">
        Personal message
      </Typography>
      <div className="mb-6 rounded bg-background p-4">
        <Typography variant="paragraph-small" className="font-mono">
          Hello, this is a test message!
        </Typography>
      </div>

      <Typography variant="paragraph-small-medium" as="div" className="mb-2">
        Typed data (EIP-712)
      </Typography>
      <div className="rounded bg-background p-4">
        <Typography variant="paragraph-mini" color="muted" as="div">
          Domain: USD Coin
        </Typography>
        <Typography variant="paragraph-mini" color="muted" as="div">
          Primary type: Permit
        </Typography>
        <div className="mt-2">
          <pre className="m-0 overflow-auto text-xs">
            {JSON.stringify(
              {
                owner: '0x1234...5678',
                spender: '0xABCD...EF01',
                value: '1000000000',
                nonce: 0,
              },
              null,
              2,
            )}
          </pre>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'DecodedMsg displays the message content in a readable format.',
      },
    },
  },
}

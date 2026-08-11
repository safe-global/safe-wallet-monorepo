import type { Meta, StoryObj } from '@storybook/react'
import { Alert, AlertTitle, AlertDescription, AlertAction } from '../alert'
import { AlertCircle, Check, TriangleAlert, Wallet, X } from 'lucide-react'
import { Button } from '../button'

/**
 * Alert Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=4029-4518
 */
const meta = {
  title: 'UI/Alert',
  component: Alert,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning', 'success', 'info'],
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

const playgroundIcons = {
  check: Check,
  'circle-alert': AlertCircle,
  'triangle-alert': TriangleAlert,
} as const

type PlaygroundArgs = {
  variant: 'default' | 'destructive' | 'warning' | 'success' | 'info'
  outlined: boolean
  title: string
  description: string
  icon: keyof typeof playgroundIcons | 'none'
  button: 'none' | 'label' | 'close'
}

export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    variant: 'default',
    outlined: true,
    title: 'Item added successfully',
    description: '',
    icon: 'check',
    button: 'none',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'warning', 'success', 'info'],
    },
    outlined: { control: 'boolean' },
    icon: {
      control: 'select',
      options: ['none', 'check', 'circle-alert', 'triangle-alert'],
    },
    button: {
      control: 'select',
      options: ['none', 'label', 'close'],
    },
    title: { control: 'text' },
    description: { control: 'text' },
  },
  render: ({ variant, outlined, title, description, icon, button }) => {
    const Icon = icon === 'none' ? null : playgroundIcons[icon]

    return (
      <div className="w-[400px]">
        <Alert variant={variant} outlined={outlined}>
          {Icon && <Icon />}
          <AlertTitle>{title}</AlertTitle>
          {description && <AlertDescription>{description}</AlertDescription>}
          {button !== 'none' && (
            <AlertAction>
              {button === 'label' ? (
                <Button variant="outline">Undo</Button>
              ) : (
                <Button variant="ghost" size="sm">
                  <X />
                </Button>
              )}
            </AlertAction>
          )}
        </Alert>
      </div>
    )
  },
}

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <Alert>
              <AlertTitle>Default Alert</AlertTitle>
              <AlertDescription>This is a default alert message.</AlertDescription>
            </Alert>
          </div>
          <div style={{ width: '400px' }}>
            <Alert variant="destructive">
              <AlertTitle>Destructive Alert</AlertTitle>
              <AlertDescription>This is a destructive alert message.</AlertDescription>
            </Alert>
          </div>
          <div style={{ width: '400px' }}>
            <Alert variant="destructive" outlined={false}>
              <AlertTitle>Destructive Alert (filled)</AlertTitle>
              <AlertDescription>This is a destructive alert with outlined set to false.</AlertDescription>
            </Alert>
          </div>
          <div style={{ width: '400px' }}>
            <Alert variant="warning">
              <AlertTitle>Warning Alert</AlertTitle>
              <AlertDescription>This is a warning alert message.</AlertDescription>
            </Alert>
          </div>
          <div style={{ width: '400px' }}>
            <Alert variant="warning" outlined={false}>
              <AlertTitle>Warning Alert (filled)</AlertTitle>
              <AlertDescription>This is a warning alert with outlined set to false.</AlertDescription>
            </Alert>
          </div>
          <div style={{ width: '400px' }}>
            <Alert variant="success">
              <AlertTitle>Success Alert</AlertTitle>
              <AlertDescription>This is a success alert message.</AlertDescription>
            </Alert>
          </div>
          <div style={{ width: '400px' }}>
            <Alert variant="info">
              <AlertCircle />
              <AlertTitle>Info Alert</AlertTitle>
              <AlertDescription>This is an info alert message.</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Icon</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <Alert>
              <AlertCircle />
              <AlertTitle>Alert with Icon</AlertTitle>
              <AlertDescription>This alert includes an icon.</AlertDescription>
            </Alert>
          </div>
          <div style={{ width: '400px' }}>
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Destructive with Icon</AlertTitle>
              <AlertDescription>This destructive alert includes an icon.</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Action</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <Alert>
              <AlertTitle>Alert with Action</AlertTitle>
              <AlertDescription>This alert has an action button.</AlertDescription>
              <AlertAction>
                <Button variant="ghost" size="sm">
                  <X />
                </Button>
              </AlertAction>
            </Alert>
          </div>
          <div style={{ width: '400px' }}>
            <Alert variant="success" className="items-center rounded-md py-4">
              <Wallet className="!translate-y-0" />
              <AlertDescription className="flex w-full items-center gap-3">
                <span className="min-w-0 flex-1">Connect a wallet to discover accounts you own or sign for</span>
                <Button size="sm" className="shrink-0">
                  Connect
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  ),
}

import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Check, Minus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../primitives/table/table'
import { PeekCollapsible } from './peek-collapsible'

const FEATURES: Array<[feature: string, starter: boolean, business: boolean]> = [
  ['Safe accounts', true, true],
  ['Signer setup', true, true],
  ['Address book', true, true],
  ['Spending policies', false, true],
  ['Activity log', false, true],
  ['Priority support', false, true],
]

function FeatureTable({ open = false }: { open?: boolean }) {
  const [isOpen, setOpen] = useState(open)
  const lastPeekRowRef = useRef<HTMLTableRowElement>(null)
  return (
    <PeekCollapsible
      open={isOpen}
      onOpen={() => setOpen(true)}
      peekUntil={lastPeekRowRef}
      expandLabel="Compare all features"
      className="rounded-xl bg-card"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Feature</TableHead>
            <TableHead className="text-center">Starter</TableHead>
            <TableHead className="text-center">Business</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURES.map(([feature, starter, business], index) => (
            <TableRow key={feature} ref={index === 2 ? lastPeekRowRef : undefined}>
              <TableCell>{feature}</TableCell>
              {[starter, business].map((included, column) => (
                <TableCell key={column} className="text-center">
                  {included ? (
                    <Check aria-label="Included" className="inline size-4" />
                  ) : (
                    <Minus aria-label="Not included" className="inline size-4 text-muted-foreground" />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PeekCollapsible>
  )
}

/** Content clipped to a peek element with a blurred fade and an expand button. */
const meta = {
  title: 'Safe UI/PeekCollapsible',
  component: PeekCollapsible,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="bg-background p-6">
        <div className="max-w-[640px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof PeekCollapsible>

export default meta
type Story = StoryObj<typeof meta>

/** Collapsed to the third row; the button expands the table to its full height. */
export const Default: Story = {
  args: { open: false, onOpen: () => undefined, peekUntil: { current: null }, expandLabel: '', children: null },
  render: () => <FeatureTable />,
}

/** Open: the fade and the button are gone. */
export const Expanded: Story = {
  args: { open: true, onOpen: () => undefined, peekUntil: { current: null }, expandLabel: '', children: null },
  render: () => <FeatureTable open />,
}

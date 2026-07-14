import type { Meta, StoryObj } from '@storybook/react'
import { SimilarityGroupContainer } from './SimilarityGroupContainer'
import { Typography } from '@/components/ui/typography'

/**
 * `SimilarityGroupContainer` wraps a set of nested Safes whose addresses look alike,
 * rendering a warning header above the grouped items so users verify them carefully.
 *
 * It is purely presentational: it only renders its `children` inside the warning-styled shell.
 */
const meta = {
  title: 'Components/NestedSafes/SimilarityGroupContainer',
  component: SimilarityGroupContainer,
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: 'var(--color-background-default)', padding: '2rem', maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SimilarityGroupContainer>

export default meta
type Story = StoryObj<typeof meta>

const MockNestedSafeRow = ({ address }: { address: string }) => (
  <div className="flex items-center gap-2 rounded-md border border-[var(--color-border-light)] px-3 py-2">
    <div className="h-6 w-6 shrink-0 rounded-full bg-[var(--color-primary-light)]" />
    <Typography variant="paragraph-small" className="font-mono">
      {address}
    </Typography>
  </div>
)

/** Default: two similar-looking addresses grouped under the warning header. */
export const Default: Story = {
  args: {
    children: (
      <>
        <MockNestedSafeRow address="0x1234...aB01cd" />
        <MockNestedSafeRow address="0x1234...ab01Cd" />
      </>
    ),
  },
}

/** A larger group with several near-identical addresses. */
export const ManyItems: Story = {
  args: {
    children: (
      <>
        <MockNestedSafeRow address="0xdead...Beef01" />
        <MockNestedSafeRow address="0xdead...beef01" />
        <MockNestedSafeRow address="0xdead...BEEF01" />
        <MockNestedSafeRow address="0xdead...beeF01" />
      </>
    ),
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import StartScreen from './StartScreen'
import css from '../styles.module.css'

const meta = {
  title: 'Features/TowerDefense/StartScreen',
  component: StartScreen,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className={css.root} style={{ position: 'relative', height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  args: { onStart: () => {} },
} satisfies Meta<typeof StartScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { best: {} } }

export const WithBestScores: Story = {
  args: {
    best: {
      testnet: { score: 9800, wave: 30, won: true },
      mainnet: { score: 4321, wave: 12, won: false },
    },
  },
}

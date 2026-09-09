import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import SelectAccountsStep from './SelectAccountsStep'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', features: { spaces: true }, shadcn: true })

const meta = {
  title: 'Features/Spaces/StartTrialModal/SelectAccountsStep',
  component: SelectAccountsStep,
  tags: ['autodocs'],
  loaders: [mswLoader],
  parameters: setup.parameters,
  decorators: [
    setup.decorator,
    (Story) => (
      <Dialog open>
        <DialogContent size="sm-md" surface="card" padding="sm">
          <div className="flex flex-col gap-6 pt-5">
            <Story />
          </div>
        </DialogContent>
      </Dialog>
    ),
  ],
  args: { limit: 10, onBack: () => {}, onContinue: () => {} },
} satisfies Meta<typeof SelectAccountsStep>

export default meta

export const Default: StoryObj<typeof meta> = {}

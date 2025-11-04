import type { Meta, StoryObj } from '@storybook/react'
import Disclaimer from './index'
import LegalDisclaimerContent from '@/components/common/LegalDisclaimerContent'

const meta = {
  component: Disclaimer,
  parameters: {
    componentSubtitle: 'Renders a Block for displaying information to the user, with a button to accept.',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Disclaimer>

export default meta
type Story = StoryObj<typeof meta>

export const BlockedAddress: Story = {
  args: {
    subtitle: '0xD3a484faEa53313eF85b5916C9302a3E304ae622',
    title: 'Blocked Address',
    content:
      'This signer address is blocked by the Safe interface, due to being associated with the blocked activities by the U.S. Department of Treasury in the Specially Designated Nationals (SDN) list.',
    onAccept: () => {},
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?node-id=6167%3A14371&mode=dev',
    },
  },
}

export const LegalDisclaimer: Story = {
  args: {
    title: 'Legal Disclaimer',
    content: <LegalDisclaimerContent withTitle={false} />,
    buttonText: 'Continue',
    onAccept: () => {},
  },
}

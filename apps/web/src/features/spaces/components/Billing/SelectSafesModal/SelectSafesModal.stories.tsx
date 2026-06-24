import type { Meta, StoryObj } from '@storybook/react'
import type { SafeItem } from '@/hooks/safes'
import SelectSafesModal from './index'

const makeSafe = (address: string, name: string): SafeItem => ({
  address,
  chainId: '1',
  name,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
})

// Story-only stub so the modal renders without the live space-safes query / store-coupled row hooks.
const MOCK_SAFES = [
  makeSafe('0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', 'My account'),
  makeSafe('0xdAC17F958D2ee523a2206206994597C13D831ec7', 'Treasury'),
  makeSafe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 'A longer name'),
  makeSafe('0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', 'Name'),
]

const meta = {
  title: 'Features/Spaces/Billing/SelectSafesModal',
  component: SelectSafesModal,
  parameters: { mockData: { useSpaceSafes: { allSafes: MOCK_SAFES, isLoading: false } } },
  args: {
    open: true,
    onClose: () => {},
    initialSelected: [MOCK_SAFES[0].address],
    onSave: () => {},
  },
} satisfies Meta<typeof SelectSafesModal>

export default meta

export const Default: StoryObj<typeof meta> = {}

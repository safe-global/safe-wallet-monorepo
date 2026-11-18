import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SpaceAddressBookPage = dynamic(() => import('../../components/SpaceAddressBook/Page'))

export default SpaceAddressBookPage

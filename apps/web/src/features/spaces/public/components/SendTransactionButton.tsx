import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SendTransactionButton = dynamic(() => import('../../components/SafeAccounts/SendTransactionButton'))

export default SendTransactionButton

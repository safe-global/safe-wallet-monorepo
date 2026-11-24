import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const TxNote = gatedDynamic(FEATURES.TX_NOTES, () => import('../../components/TxNote'))

export default TxNote

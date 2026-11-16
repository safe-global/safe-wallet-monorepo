import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const TxNoteForm = gatedDynamic(FEATURES.TX_NOTES, () => import('../components/TxNoteForm'))

export default TxNoteForm

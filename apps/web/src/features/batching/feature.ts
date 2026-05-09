import type { BatchingContract } from './contract'
import BatchIndicator from './components/BatchIndicator'
import BatchSidebar from './components/BatchSidebar'
import BatchTxList from './components/BatchSidebar/BatchTxList'

const feature: BatchingContract = {
  BatchIndicator,
  BatchSidebar,
  BatchTxList,
}

export default feature

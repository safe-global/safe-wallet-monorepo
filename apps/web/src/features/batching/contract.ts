import type BatchIndicator from './components/BatchIndicator'
import type BatchSidebar from './components/BatchSidebar'
import type BatchTxList from './components/BatchSidebar/BatchTxList'

export interface BatchingContract {
  BatchIndicator: typeof BatchIndicator
  BatchSidebar: typeof BatchSidebar
  BatchTxList: typeof BatchTxList
}

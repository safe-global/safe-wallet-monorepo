import type BatchSidebar from './components/BatchSidebar'
import type BatchTxList from './components/BatchSidebar/BatchTxList'

export interface BatchingContract {
  BatchSidebar: typeof BatchSidebar
  BatchTxList: typeof BatchTxList
}

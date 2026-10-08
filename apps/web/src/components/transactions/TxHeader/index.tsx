import type { ReactElement, ReactNode } from 'react'

import TxNavigation from '@/components/transactions/TxNavigation'
import { TxHeaderView } from '@views/components/transactions/TxHeader/TxHeaderView'

const TxHeader = ({ children }: { children?: ReactNode }): ReactElement => {
  return <TxHeaderView navigation={<TxNavigation />}>{children}</TxHeaderView>
}

export default TxHeader

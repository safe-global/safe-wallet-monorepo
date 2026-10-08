import type { ReactElement } from 'react'
import { BRAND_NAME } from '@/config/constants'
import { WcLogoHeaderView } from '@views/features/walletconnect/components/WcLogoHeader/WcLogoHeaderView'

const WcLogoHeader = ({ errorMessage }: { errorMessage?: string }): ReactElement => {
  return <WcLogoHeaderView errorMessage={errorMessage} brandName={BRAND_NAME} />
}

export default WcLogoHeader

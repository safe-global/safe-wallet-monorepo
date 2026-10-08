import useSafeInfo from '@/hooks/useSafeInfo'
import useSafeAddress from '@/hooks/useSafeAddress'
import CopyTooltip from '@/components/common/CopyTooltip'
import { AddFundsBannerView } from '@views/components/dashboard/AddFundsBanner/AddFundsBannerView'

const AddFundsToGetStarted = () => {
  const { safe } = useSafeInfo()
  const safeAddress = useSafeAddress()

  const addressCopyText = safeAddress

  if (!safe.deployed) return null

  return (
    <AddFundsBannerView
      renderCopyTooltip={(children) => <CopyTooltip text={addressCopyText}>{children}</CopyTooltip>}
    />
  )
}

export default AddFundsToGetStarted

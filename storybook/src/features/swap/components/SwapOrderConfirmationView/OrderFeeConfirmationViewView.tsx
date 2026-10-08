import { DataRow } from '@/components/common/Table/DataRow'
import { HelpIconTooltip } from '@views/features/swap/components/HelpIconTooltip'
import { Link } from '@/components/ui/link'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

export type OrderFeeConfirmationViewViewProps = {
  bps: number
  brandName: string
}

export const OrderFeeConfirmationViewView = ({ bps, brandName }: OrderFeeConfirmationViewViewProps) => {
  const title = (
    <>
      Widget fee{' '}
      <HelpIconTooltip
        title={
          <>
            The tiered widget fee incurred here is charged by CoW Protocol for the operation of this widget. The fee is
            automatically calculated into this quote. Part of the fee will contribute to a license fee that supports the
            Safe Community. Neither the Safe Ecosystem Foundation nor {`${brandName}`} operate the CoW Swap Widget
            and/or CoW Swap.
            <Link href={HelpCenterArticle.SWAP_WIDGET_FEES} target="_blank" rel="noopener noreferrer">
              Learn more
            </Link>
          </>
        }
      />
    </>
  )

  return (
    <DataRow datatestid="widget-fee" title={title} key="widget_fee">
      {Number(bps) / 100} %
    </DataRow>
  )
}

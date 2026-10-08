import { FilePen as RequiredIcon } from 'lucide-react'
import ImageFallback from '@/components/common/ImageFallback'
import txTypeCss from '@/components/transactions/TxType/styles.module.css'

const FALLBACK_LOGO_URI = '/images/transactions/custom.svg'

export type MsgTypeViewProps = {
  logoUri?: string | null
  name: string
}

export const MsgTypeView = ({ logoUri, name }: MsgTypeViewProps) => {
  return (
    <div className={txTypeCss.txType}>
      {logoUri ? (
        <ImageFallback
          src={logoUri || FALLBACK_LOGO_URI}
          fallbackSrc={FALLBACK_LOGO_URI}
          alt="Message type"
          width={16}
          height={16}
        />
      ) : (
        <RequiredIcon strokeWidth={1.5} className="size-4 shrink-0 text-muted-foreground" />
      )}
      {name}
    </div>
  )
}

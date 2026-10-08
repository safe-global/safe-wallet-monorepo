import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import WarningIcon from '@/public/images/notifications/warning.svg'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import type { EthHashInfoProps } from '@/components/common/EthHashInfo/SrcEthHashInfo'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'

export type ReviewSignMessageOnChainViewProps = {
  sendFromBlock: ReactNode
  signMessageAddress: string
  renderAddress: (props: EthHashInfoProps) => ReactNode
  isTypedData: boolean
  renderApprovalEditor: (fallback: ReactElement) => ReactNode
  safeTxData?: string
  method: string
  copyButton?: ReactNode
  decodedMessage: ReactNode
}

export const ReviewSignMessageOnChainView = ({
  sendFromBlock,
  signMessageAddress,
  renderAddress,
  isTypedData,
  renderApprovalEditor,
  safeTxData,
  method,
  copyButton,
  decodedMessage,
}: ReviewSignMessageOnChainViewProps): ReactElement => (
  <>
    {sendFromBlock}

    <InfoDetails title="Interact with SignMessageLib">
      {renderAddress({ address: signMessageAddress, shortAddress: false, showCopyButton: true, hasExplorer: true })}
    </InfoDetails>

    {isTypedData && renderApprovalEditor(<div>Error parsing data</div>)}

    {safeTxData !== undefined && (
      <div className="pb-2">
        <HexEncodedData title="Data:" hexData={safeTxData} />
      </div>
    )}

    <Typography className="my-2">
      <b>Signing method:</b> <code>{method}</code>
    </Typography>

    <Typography className="my-4">
      <b>Signing message:</b> {copyButton}
    </Typography>
    {decodedMessage}

    <div className="my-4 flex items-center">
      <WarningIcon className="size-4 text-[var(--color-warning-main)]" />
      <Typography className="ml-2">
        Signing a message with your Safe account requires a transaction on the blockchain
      </Typography>
    </div>
  </>
)

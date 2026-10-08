import type { MultisigConfirmationDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import TokenIcon from '@/components/common/TokenIcon'
import { cn } from '@/utils/cn'
import type { SafeTransaction } from '@safe-global/types-kit'
import { PaperViewToggle } from '@views/components/common/PaperViewToggle'
import EthHashInfo from '@/components/common/EthHashInfo'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import TxDetailsRow from './TxDetailsRow'

const ScrollWrapper = ({ children, padded = true }: { children: ReactElement | ReactElement[]; padded?: boolean }) => (
  <div className={cn('max-h-[550px] flex-1 overflow-y-auto', padded && 'px-4 pt-2')}>{children}</div>
)

const DataStack = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col divide-y divide-[var(--color-border-light)] [&>*]:py-2 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
    {children}
  </div>
)

export type ReceiptViewProps = {
  safeTxData: SafeTransaction['data']
  isCallOperation: boolean
  grid?: boolean
  withSignatures: boolean
  outlined: boolean
  confirmations: MultisigConfirmationDetails[]
  displaySafeTxGas: SafeTransaction['data']['safeTxGas']
  displayBaseGas: SafeTransaction['data']['baseGas']
  displayGasPrice: SafeTransaction['data']['gasPrice']
  displayGasToken: string
  displayRefundReceiver: string
  gasTokenLogo?: string | null
  gasTokenSymbol?: string | null
  domainHash?: string | null
  messageHash?: string | null
  safeTxHash?: string | null
  nameChip: ReactNode
  jsonView: ReactElement
}

export const ReceiptView = ({
  safeTxData,
  isCallOperation,
  grid,
  withSignatures,
  outlined,
  confirmations,
  displaySafeTxGas,
  displayBaseGas,
  displayGasPrice,
  displayGasToken,
  displayRefundReceiver,
  gasTokenLogo,
  gasTokenSymbol,
  domainHash,
  messageHash,
  safeTxHash,
  nameChip,
  jsonView,
}: ReceiptViewProps) => {
  const toAddress = (
    <EthHashInfo
      address={safeTxData.to}
      avatarSize={20}
      showPrefix={false}
      showName={false}
      shortAddress={false}
      hasExplorer
      showAvatar
      highlight4bytes
    />
  )

  return (
    <PaperViewToggle activeView={0} leftAlign={grid} outlined={outlined}>
      {[
        {
          title: 'Data',
          content: (
            <ScrollWrapper padded={!outlined}>
              <DataStack>
                <TxDetailsRow label="To" grid={grid}>
                  {grid ? (
                    <div>
                      <span className="inline-flex -ml-2.5">{nameChip}</span>

                      <Typography
                        variant="paragraph-small"
                        className="mt-1.5 [&_*]:whitespace-normal [&_*]:break-words [&_*]:!items-start"
                      >
                        {toAddress}
                      </Typography>
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-end gap-2">
                      <Typography
                        variant="paragraph-small"
                        className="min-w-0 [&_*]:whitespace-normal [&_*]:break-words [&_*]:!items-start"
                      >
                        {toAddress}
                      </Typography>

                      {nameChip}
                    </div>
                  )}
                </TxDetailsRow>

                <TxDetailsRow label="Value" grid={grid}>
                  {safeTxData.value}
                </TxDetailsRow>

                <TxDetailsRow label="Data" grid={grid}>
                  <Typography variant="paragraph-small" className={grid ? 'w-[70%]' : undefined}>
                    <HexEncodedData hexData={safeTxData.data} limit={140} />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="Operation" grid={grid}>
                  <Typography variant="paragraph-small" className="flex items-center gap-1">
                    {safeTxData.operation} ({isCallOperation ? 'call' : 'delegate call'})
                    {isCallOperation && <Check className="size-[1em] text-[var(--color-success-main)]" />}
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="SafeTxGas" grid={grid}>
                  {displaySafeTxGas}
                </TxDetailsRow>

                <TxDetailsRow label="BaseGas" grid={grid}>
                  {displayBaseGas}
                </TxDetailsRow>

                <TxDetailsRow label="GasPrice" grid={grid}>
                  {displayGasPrice}
                </TxDetailsRow>

                <TxDetailsRow label="GasToken" grid={grid}>
                  <Typography variant="paragraph-small">
                    <EthHashInfo
                      address={displayGasToken}
                      showAvatar={false}
                      showPrefix={false}
                      showName={false}
                      shortAddress
                      hasExplorer
                    >
                      {gasTokenLogo && gasTokenSymbol && (
                        <Tooltip>
                          <TooltipTrigger render={<span className="inline-flex" />}>
                            <TokenIcon logoUri={gasTokenLogo} tokenSymbol={gasTokenSymbol} size={16} />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            The GasToken address is the address of the token used to pay gas fees.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </EthHashInfo>
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="RefundReceiver" grid={grid}>
                  <Typography variant="paragraph-small">
                    <EthHashInfo
                      address={displayRefundReceiver}
                      avatarSize={20}
                      showPrefix={false}
                      shortAddress
                      showName={false}
                      hasExplorer
                    />
                  </Typography>
                </TxDetailsRow>

                <TxDetailsRow label="Nonce" grid={grid}>
                  {safeTxData.nonce}
                </TxDetailsRow>

                {withSignatures &&
                  confirmations?.map(
                    ({ signature }, index) =>
                      !!signature && (
                        <TxDetailsRow
                          data-testid="tx-signature"
                          label={`Signature ${index + 1}`}
                          key={`signature-${index}`}
                          grid={grid}
                        >
                          <Typography variant="paragraph-small" className={grid ? 'w-[70%]' : undefined}>
                            <HexEncodedData hexData={signature} highlightFirstBytes={false} limit={30} />
                          </Typography>
                        </TxDetailsRow>
                      ),
                  )}
              </DataStack>
            </ScrollWrapper>
          ),
        },
        {
          title: 'Hashes',
          content: (
            <ScrollWrapper padded={!outlined}>
              <DataStack>
                {domainHash && (
                  <TxDetailsRow label="Domain hash" grid={grid}>
                    <Typography variant="paragraph-small" className="w-full break-words">
                      <HexEncodedData hexData={domainHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}

                {messageHash && (
                  <TxDetailsRow label="Message hash" grid={grid}>
                    <Typography variant="paragraph-small" className="w-full break-words">
                      <HexEncodedData hexData={messageHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}

                {safeTxHash && (
                  <TxDetailsRow label="safeTxHash" grid={grid}>
                    <Typography variant="paragraph-small" className="w-full break-words">
                      <HexEncodedData hexData={safeTxHash} limit={66} highlightFirstBytes={false} />
                    </Typography>
                  </TxDetailsRow>
                )}
              </DataStack>
            </ScrollWrapper>
          ),
        },
        {
          title: 'JSON',
          content: <ScrollWrapper padded={!outlined}>{jsonView}</ScrollWrapper>,
        },
      ]}
    </PaperViewToggle>
  )
}

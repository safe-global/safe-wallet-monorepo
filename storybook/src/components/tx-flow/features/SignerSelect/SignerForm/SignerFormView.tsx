import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import InfoIcon from '@/public/images/notifications/info.svg'
import SignatureIcon from '@/public/images/transactions/signature.svg'
import SignerSelector from '@/components/common/SignerSelector'
import TxSectionTitle from '@/components/tx-flow/common/TxSectionTitle'

export type SignerFormViewProps = {
  willExecute?: boolean
  options: string[]
  value: string | undefined
  onChange: (address: string) => void
  isOptionDisabled: (address: string) => boolean
}

export const SignerFormView = ({ willExecute, options, value, onChange, isOptionDisabled }: SignerFormViewProps) => {
  return (
    <>
      <TxSectionTitle>
        <SignatureIcon className="size-4" />
        {willExecute ? 'Execute' : 'Sign'} with
        <Tooltip>
          <TooltipTrigger render={<InfoIcon className="size-4 text-[var(--color-border-main)]" />} />
          <TooltipContent side="top">
            {`Your connected wallet controls other Safe accounts, which can sign this transaction. You can select which Account to ${
              willExecute ? 'execute' : 'sign'
            } with.`}
          </TooltipContent>
        </Tooltip>
      </TxSectionTitle>

      <SignerSelector
        options={options}
        value={value}
        onChange={onChange}
        isOptionDisabled={isOptionDisabled}
        disabledReason={() => 'Already signed'}
      />
    </>
  )
}

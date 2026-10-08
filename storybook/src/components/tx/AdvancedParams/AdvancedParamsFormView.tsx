import type { ReactNode, SyntheticEvent } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import ModalDialog from '@/components/common/ModalDialog'
import ExternalLink from '@/components/common/ExternalLink'
import NumberField from '@/components/common/NumberField'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

type FieldError = { message?: string }

export type AdvancedParamsFormViewProps = {
  onFormSubmit: (e: SyntheticEvent) => void
  onBack: () => void
  willRelay?: boolean
  isEIP1559?: boolean
  errors: {
    userNonce?: FieldError
    maxFeePerGas?: FieldError
    maxPriorityFeePerGas?: FieldError
  }
  userNonceField: UseFormRegisterReturn
  maxPriorityFeePerGasField?: UseFormRegisterReturn
  maxFeePerGasField: UseFormRegisterReturn
  gasLimitInput: ReactNode
}

export const AdvancedParamsFormView = ({
  onFormSubmit,
  onBack,
  willRelay,
  isEIP1559,
  errors,
  userNonceField,
  maxPriorityFeePerGasField,
  maxFeePerGasField,
  gasLimitInput,
}: AdvancedParamsFormViewProps) => {
  return (
    <ModalDialog open dialogTitle="Advanced parameters" hideChainIndicator forceBackdrop>
      <form onSubmit={onFormSubmit}>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Typography className="font-bold">Execution parameters</Typography>
            </div>

            {/* User nonce */}
            <div className="w-full">
              <NumberField
                fullWidth
                disabled={willRelay}
                label={errors.userNonce?.message || 'Wallet nonce'}
                error={!!errors.userNonce}
                {...userNonceField}
              />
            </div>

            {/* Gas limit */}
            <div>{gasLimitInput}</div>

            {/* Gas price */}
            {isEIP1559 && (
              <div className="w-full">
                <NumberField
                  fullWidth
                  disabled={willRelay}
                  label={errors.maxPriorityFeePerGas?.message || 'Max priority fee (Gwei)'}
                  error={!!errors.maxPriorityFeePerGas}
                  required
                  {...maxPriorityFeePerGasField}
                />
              </div>
            )}

            <div className="w-full">
              <NumberField
                fullWidth
                disabled={willRelay}
                label={errors.maxFeePerGas?.message || isEIP1559 ? 'Max fee (Gwei)' : 'Gas price (Gwei)'}
                error={!!errors.maxFeePerGas}
                required
                {...maxFeePerGasField}
              />
            </div>
          </div>

          {/* Help link */}
          <Typography className="mt-4">
            <ExternalLink href={HelpCenterArticle.ADVANCED_PARAMS}>
              How can I configure these parameters manually?
            </ExternalLink>
          </Typography>
        </div>

        {/* Buttons */}
        <div className="flex justify-between gap-2 px-6 pb-6">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>

          <Button type="submit">Confirm</Button>
        </div>
      </form>
    </ModalDialog>
  )
}

import useSafeInfo from '@/hooks/useSafeInfo'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RotateCcw } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { BASE_TX_GAS } from '@/config/constants'
import { AdvancedField } from './types'
import NumberField from '@/components/common/NumberField'

const GasLimitInput = ({ recommendedGasLimit }: { recommendedGasLimit?: string }) => {
  const { safe } = useSafeInfo()

  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext()

  const currentGasLimit = watch(AdvancedField.gasLimit)

  const onResetGasLimit = () => {
    setValue(AdvancedField.gasLimit, recommendedGasLimit)
    trigger(AdvancedField.gasLimit)
  }

  const error = errors.gasLimit as
    | {
        message: string
        type: string
      }
    | undefined

  const errorMessage = error ? (error.type === 'min' ? 'Gas limit must be at least 21000' : error.message) : undefined

  return (
    <div className="w-full">
      <NumberField
        fullWidth
        label={errorMessage || 'Gas limit'}
        error={!!errorMessage}
        endAdornment={
          recommendedGasLimit &&
          recommendedGasLimit !== currentGasLimit.toString() && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" onClick={onResetGasLimit} className="text-primary">
                    <RotateCcw className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Reset to recommended gas limit</TooltipContent>
            </Tooltip>
          )
        }
        disabled={!safe.deployed}
        required
        {...register(AdvancedField.gasLimit, { required: true, min: BASE_TX_GAS })}
      />
    </div>
  )
}

export default GasLimitInput

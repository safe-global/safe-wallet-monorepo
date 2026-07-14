import { Controller, useFormContext } from 'react-hook-form'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { RotateCcwIcon } from 'lucide-react'
import { useCurrentChain } from '@/hooks/useChains'
import InfoIcon from '@/public/images/notifications/info.svg'
import { EnvVariablesField } from './index'

type RpcProviderSectionProps = {
  onReset: () => void
  showResetButton: boolean
}

const RpcProviderSection = ({ onReset, showResetButton }: RpcProviderSectionProps) => {
  const chain = useCurrentChain()
  const { control } = useFormContext()

  return (
    <>
      <Typography variant="paragraph-bold" className="mb-4 mt-6 flex items-center">
        RPC provider
        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <InfoIcon className="ml-1 size-4 align-middle text-muted-foreground" />
              </span>
            }
          />
          <TooltipContent>Any provider that implements the Ethereum JSON-RPC standard can be used.</TooltipContent>
        </Tooltip>
      </Typography>

      <Controller
        name={EnvVariablesField.rpc}
        control={control}
        render={({ field }) => (
          <InputGroup>
            <InputGroupInput {...field} value={field.value || ''} type="url" placeholder={chain?.rpcUri.value} />
            {showResetButton && (
              <InputGroupAddon align="inline-end">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <InputGroupButton size="icon-sm" onClick={onReset} aria-label="Reset to default value">
                        <RotateCcwIcon />
                      </InputGroupButton>
                    }
                  />
                  <TooltipContent>Reset to default value</TooltipContent>
                </Tooltip>
              </InputGroupAddon>
            )}
          </InputGroup>
        )}
      />
    </>
  )
}

export default RpcProviderSection

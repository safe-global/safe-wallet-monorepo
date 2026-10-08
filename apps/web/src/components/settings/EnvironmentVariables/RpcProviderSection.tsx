import { Controller, useFormContext } from 'react-hook-form'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { RotateCcwIcon } from 'lucide-react'
import { useCurrentChain } from '@/hooks/useChains'
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
      <Typography variant="paragraph-bold" className="mb-2 mt-6">
        RPC provider
      </Typography>

      <Alert variant="info" className="mb-3" data-testid="rpc-info">
        <AlertSeverityIcon variant="info" />
        <AlertDescription>Any provider that implements the Ethereum JSON-RPC standard can be used.</AlertDescription>
      </Alert>

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

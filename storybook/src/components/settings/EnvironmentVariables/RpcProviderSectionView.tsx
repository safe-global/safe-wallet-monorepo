import type { ReactElement, ReactNode } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { RotateCcwIcon } from 'lucide-react'
import InfoIcon from '@/public/images/notifications/info.svg'

export type EnvFieldRender = (render: (field: ControllerRenderProps) => ReactElement) => ReactNode

export type RpcProviderSectionViewProps = {
  placeholder?: string
  onReset: () => void
  showResetButton: boolean
  renderField: EnvFieldRender
}

export const RpcProviderSectionView = ({
  placeholder,
  onReset,
  showResetButton,
  renderField,
}: RpcProviderSectionViewProps) => {
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

      {renderField((field) => (
        <InputGroup>
          <InputGroupInput {...field} value={field.value || ''} type="url" placeholder={placeholder} />
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
      ))}
    </>
  )
}

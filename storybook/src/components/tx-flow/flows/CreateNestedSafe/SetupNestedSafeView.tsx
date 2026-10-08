import type { ComponentProps, FormEventHandler, ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type NameInput from '@/components/common/NameInput'

import InfoIcon from '@/public/images/notifications/info.svg'
import AddIcon from '@/public/images/common/add.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import css from './styles.module.css'

export type SetupNestedSafeViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  nameFieldName: string
  fallbackName: string
  renderNameInput: (props: ComponentProps<typeof NameInput>) => ReactNode
  assetInputs: ReactNode
}

export function SetupNestedSafeView({
  onSubmit,
  nameFieldName,
  fallbackName,
  renderNameInput,
  assetInputs,
}: SetupNestedSafeViewProps): ReactElement {
  return (
    <TxCard>
      <form onSubmit={onSubmit}>
        <Typography variant="paragraph-small" className="block mt-2">
          Name your Nested Safe and select which assets to fund it with. All selected assets will be transferred when
          deployed.
        </Typography>

        <div className="mt-6 w-full">
          {renderNameInput({
            inputSize: 'hero',
            'data-testid': 'nested-safe-name-input',
            name: nameFieldName,
            label: 'Name',
            placeholder: fallbackName,
            InputLabelProps: { shrink: true },
            InputProps: {
              endAdornment: (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="flex">
                        <InfoIcon className="size-4" />
                      </span>
                    }
                  />
                  <TooltipContent>
                    This name is stored locally and will never be shared with us or any third parties.
                  </TooltipContent>
                </Tooltip>
              ),
            },
          })}
        </div>

        {assetInputs}

        <Separator bleed="6" />

        <TxCardActions>
          <Button data-testid="next-button" type="submit">
            Next
          </Button>
        </TxCardActions>
      </form>
    </TxCard>
  )
}

export type AssetInputsViewProps = {
  rows: Array<{ id: string; tokenInput: ReactNode; onRemove: () => void }>
  onAdd: () => void
  addDisabled: boolean
}

export function AssetInputsView({ rows, onAdd, addDisabled }: AssetInputsViewProps): ReactElement {
  return (
    <>
      {rows.map(({ id, tokenInput, onRemove }) => (
        <div data-testid="asset-data" className={css.assetInput} key={id}>
          <div className="min-w-0 flex-1">{tokenInput}</div>

          <div className={css.removeAsset}>
            <Button variant="ghost" size="icon" data-testid="remove-asset-icon" onClick={onRemove}>
              <DeleteIcon className="size-4" />
            </Button>
          </div>
        </div>
      ))}

      <Button
        data-testid="fund-asset-button"
        variant="ghost"
        onClick={onAdd}
        size="lg"
        className="my-6 self-start"
        disabled={addDisabled}
      >
        <AddIcon className="size-4" />
        Fund new asset
      </Button>
    </>
  )
}

import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/cn'

type Option = {
  id: string
  label?: string
}

export default function SplitMenuButton({
  options,
  disabled = false,
  tooltip,
  onClick,
  onChange,
  selected,
  disabledIndex,
  loading = false,
}: {
  options: Option[]
  disabled?: boolean
  tooltip?: string
  onClick?: (option: Option, e: SyntheticEvent) => void
  onChange?: (option: Option) => void
  selected?: Option['id']
  disabledIndex?: number
  loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (selected) {
      const index = options.findIndex((option) => option.id === selected)
      if (index !== -1) {
        setSelectedIndex(index)
      }
    }
  }, [selected, options])

  const handleClick = (e: SyntheticEvent) => {
    onClick?.(options[selectedIndex], e)
  }

  const handleMenuItemClick = (index: number) => {
    if (index !== selectedIndex) {
      setSelectedIndex(index)
      onChange?.(options[index])
    }

    setOpen(false)
  }

  const { label, id } = useMemo(() => options[selectedIndex] || {}, [options, selectedIndex])
  const maxCharLen = Math.max(...options.map(({ id, label }) => (label || id).length)) + 2
  const hasMenu = options.length > 1

  return (
    <div data-slot="button-group" className="flex h-10 w-full" aria-label="Button group with a nested menu">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              data-testid={`combo-submit-${id}`}
              onClick={handleClick}
              type="submit"
              disabled={disabled}
              // Corner reset carries the same `in-data-[slot=button-group]` variant as Button's own
              // `rounded-md`, otherwise that variant outranks a bare `rounded-r-none` and the halves
              // meet on two 12px curves instead of a flat seam.
              // eslint-disable-next-line no-restricted-syntax -- split-button halves flatten inner corners at the join and fill the button-group row height
              className={cn('h-full min-w-0 flex-1 shrink', hasMenu && 'in-data-[slot=button-group]:rounded-r-none')}
              // The floor keeps the button from resizing as the selected option's label changes, but
              // an unconditional `${maxCharLen}ch` outgrew narrow rows and shoved the dropdown half
              // outside the group, where TxCard's overflow-hidden clipped it off. Capping it against
              // the space left after that half (3rem = its max-w-12) keeps both inside at any width.
              style={{ minWidth: `min(${maxCharLen}ch, 100% - 3rem)` }}
            />
          }
        >
          {loading ? <Spinner className="size-5" /> : label || id}
        </TooltipTrigger>
        {tooltip ? <TooltipContent>{tooltip}</TooltipContent> : null}
      </Tooltip>

      {hasMenu && (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="select action"
                disabled={loading}
                data-testid="combo-submit-dropdown"
                // eslint-disable-next-line no-restricted-syntax -- split-button halves flatten inner corners at the join and fill the button-group row height
                className="h-full max-w-12 border-l border-l-[var(--color-border-light)] px-3 in-data-[slot=button-group]:rounded-l-none"
              />
            }
          >
            <ChevronDown />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            data-testid="combo-submit-popover"
            align="end"
            side="bottom"
            className="w-auto min-w-(--anchor-width)"
          >
            {options.map((option, index) => (
              <DropdownMenuItem
                key={option.id}
                disabled={disabledIndex === index}
                onClick={() => handleMenuItemClick(index)}
                className="gap-4"
              >
                <span className="flex-1">{option.label || option.id}</span>
                {index === selectedIndex ? <Check className="size-4" /> : <span className="w-6" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

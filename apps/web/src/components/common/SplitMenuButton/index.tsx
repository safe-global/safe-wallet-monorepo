import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

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

  return (
    <div data-slot="button-group" className="flex w-full" aria-label="Button group with a nested menu">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              data-testid={`combo-submit-${id}`}
              onClick={handleClick}
              type="submit"
              disabled={disabled}
              className="h-full w-full rounded-r-none"
              style={{ minWidth: `${maxCharLen}ch` }}
            />
          }
        >
          {loading ? <Spinner className="size-5" /> : label || id}
        </TooltipTrigger>
        {tooltip ? <TooltipContent>{tooltip}</TooltipContent> : null}
      </Tooltip>

      {options.length > 1 && (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="select action"
                disabled={loading}
                data-testid="combo-submit-dropdown"
                className="h-full max-w-12 rounded-l-none border-l border-l-[var(--color-border-light)] px-3"
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

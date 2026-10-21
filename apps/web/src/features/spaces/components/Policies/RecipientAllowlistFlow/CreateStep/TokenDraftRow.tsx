import { useMemo, useRef, useState, type ReactElement } from 'react'
import { Check, Search, X } from 'lucide-react'
import { cn } from '@safe-global/views/utils/cn'
import { Button } from '@safe-global/views/components/ui/button'
import { InputGroupAddon } from '@safe-global/views/components/ui/input-group'
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  useComboboxAnchor,
} from '@safe-global/views/components/ui/combobox'
import { Typography } from '@safe-global/views/components/ui/typography'
import { matchesTokenQuery } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/utils/tokenSearch'
import {
  HELD_GROUP_LABEL,
  NO_TOKENS_FOUND_TEXT,
  POPULAR_GROUP_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/TokenSelector/constants'
import {
  ADD_TOKEN_CONFIRM_LABEL,
  ADD_TOKEN_FIELD_LABEL,
  ADD_TOKEN_PLACEHOLDER,
  CANCEL_ADD_TOKEN_LABEL,
  IDENTICON_SIZE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { ALLOWLIST_ROW_CLASSES } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSection'
import TokenIcon from '@/components/common/TokenIcon'
import { tokenOptionLabel, type TokenOption } from '../../SpendingLimitFlow/utils/tokenOptions'

type TokenGroup = { value: TokenOption['group']; label: string; items: TokenOption[] }

const GROUP_LABELS: Record<TokenOption['group'], string> = { held: HELD_GROUP_LABEL, popular: POPULAR_GROUP_LABEL }

type TokenDraftRowProps = {
  /** Tokens not on the form yet. */
  options: TokenOption[]
  onConfirm: (address: string) => void
  onCancel: () => void
}

/** "Add a token" as a new row that searches the tokens; closing it before typing drops the row. */
const TokenDraftRow = ({ options, onConfirm, onCancel }: TokenDraftRowProps): ReactElement => {
  const anchor = useComboboxAnchor()
  const [query, setQuery] = useState('')
  const isTyping = query.trim() !== ''
  const isSettled = useRef(false)
  const groups = useMemo<TokenGroup[]>(
    () =>
      (['held', 'popular'] as const)
        .map((group) => ({
          value: group,
          label: GROUP_LABELS[group],
          items: options.filter((option) => option.group === group),
        }))
        .filter(({ items }) => items.length > 0),
    [options],
  )
  const firstMatch = isTyping
    ? groups.flatMap(({ items }) => items).find((option) => matchesTokenQuery(option, query))
    : undefined

  const confirm = (address: string) => {
    isSettled.current = true
    onConfirm(address)
  }

  const cancel = () => {
    isSettled.current = true
    onCancel()
  }

  return (
    <div ref={anchor} className={cn(ALLOWLIST_ROW_CLASSES, 'p-0')}>
      <Combobox<TokenOption>
        items={groups}
        defaultOpen
        openOnInputClick
        autoHighlight
        itemToStringLabel={tokenOptionLabel}
        itemToStringValue={(option) => option.address}
        filter={(option, value) => matchesTokenQuery(option, value)}
        onInputValueChange={setQuery}
        onValueChange={(option) => {
          if (option) confirm(option.address)
        }}
        onOpenChange={(open) => {
          if (!open && !isTyping && !isSettled.current) cancel()
        }}
      >
        <ComboboxInput
          autoFocus
          aria-label={ADD_TOKEN_FIELD_LABEL}
          placeholder={ADD_TOKEN_PLACEHOLDER}
          autoComplete="off"
          spellCheck={false}
          showTrigger={!isTyping}
          className="h-16 w-full rounded-lg border-0 bg-transparent px-0 shadow-none focus-within:ring-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0 [&_[data-slot=input-group-control]]:!pl-3"
          data-testid="allowlist-add-token-input"
        >
          {/* A box the token icons' size, so the search icon lines up with the chips' icons above */}
          <InputGroupAddon align="inline-start" className="!pr-0 !pl-3">
            <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden>
              <Search className="size-4 text-muted-foreground" />
            </span>
          </InputGroupAddon>

          {isTyping && (
            <InputGroupAddon align="inline-end" className="gap-2 !pr-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={ADD_TOKEN_CONFIRM_LABEL}
                disabled={!firstMatch}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => firstMatch && confirm(firstMatch.address)}
              >
                <Check />
              </Button>
              <Button
                type="button"
                variant="ghost-muted"
                size="icon"
                aria-label={CANCEL_ADD_TOKEN_LABEL}
                onMouseDown={(event) => event.preventDefault()}
                onClick={cancel}
              >
                <X />
              </Button>
            </InputGroupAddon>
          )}
        </ComboboxInput>

        {/* Pinned below the row: flipping above would cover the chips the token is added to */}
        <ComboboxContent
          anchor={anchor}
          sideOffset={4}
          collisionAvoidance={{ side: 'none' }}
          className="max-h-80 rounded-lg"
        >
          <ComboboxEmpty>{NO_TOKENS_FOUND_TEXT}</ComboboxEmpty>
          <ComboboxList>
            {(group: TokenGroup) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{group.label}</ComboboxLabel>
                <ComboboxCollection>
                  {(option: TokenOption) => {
                    const label = tokenOptionLabel(option)
                    return (
                      // The list's 4px inset and these 8px make the rows' 12px, so the icons share one column
                      <ComboboxItem key={option.address} value={option} className="rounded-[10px] px-2">
                        <span className="flex min-w-0 flex-1 items-center gap-3">
                          <TokenIcon logoUri={option.logoUri} tokenSymbol={label} size={IDENTICON_SIZE} />
                          <span className="flex min-w-0 flex-col text-left">
                            <Typography variant="paragraph-small-medium" as="span">
                              {label}
                            </Typography>
                            {option.name && (
                              <Typography variant="paragraph-small" color="muted" as="span">
                                {option.name}
                              </Typography>
                            )}
                          </span>
                        </span>
                      </ComboboxItem>
                    )
                  }}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

export default TokenDraftRow

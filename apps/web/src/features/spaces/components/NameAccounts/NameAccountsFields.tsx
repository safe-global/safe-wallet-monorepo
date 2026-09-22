import { useEffect, useState, type ReactNode } from 'react'
import get from 'lodash/get'
import { useFormContext, useWatch } from 'react-hook-form'
import { ADDRESS_BOOK_NAME_MAX_LENGTH, NAME_MIN_LENGTH, sanitizeName } from '@safe-global/utils/validation/names'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import Identicon from '@/components/common/Identicon'
import NameInput from '@/components/common/NameInput'
import FiatBalance from '@/components/common/FiatBalance'
import { FullAddress, HOVER_ACTION_CLASS, RenameButton } from '@/components/common/AccountRow'
import { ThresholdBadge } from '@/components/common/AccountBadges'
import PaginatedDataTable, { type DataTableColumn } from '@/components/common/PaginatedDataTable'
import { NetworkLogosPill } from '@/features/multichain'
import { isMultiChainSafeItem, type AllSafeItems } from '@/hooks/safes'
import type { AddAccountsFormValues } from '../../hooks/addAccounts.types'
import { nameFieldKey } from './utils'
import { validateContactName } from '../SpaceAddressBook/utils'
import { cn } from '@/utils/cn'
import { useSafeSummaries, type SafeSummary } from './useSafeSummaries'

type Item = AllSafeItems[number]

const EMPTY_SUMMARY: SafeSummary = { thresholdMixed: false, loaded: false }

/**
 * A named row reads as text with a hover pencil; clicking it (or an empty row) shows the boxed input,
 * sized to the text line with its padding hanging into the gutter so the text keeps the row's
 * alignment. Once left, an empty or invalid name shows its message in place of the address.
 */
const NameAccountCell = ({ item }: { item: Item }) => {
  const key = nameFieldKey(item.address)
  const { formState } = useFormContext<AddAccountsFormValues>()
  const value = sanitizeName(useWatch({ name: key }) ?? '')
  const [focused, setFocused] = useState(false)
  const isTouched = Boolean(get(formState.touchedFields, key))
  const nameError = validateContactName(value)
  // Shown only while unfocused: the message takes the address line's place, so typing keeps the address visible.
  let error: string | undefined
  if (!focused) {
    if (value !== '') error = nameError
    else if (isTouched) error = 'Name is required'
  }
  const showInput = focused || Boolean(nameError)
  const startEditing = () => setFocused(true)

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex w-10 shrink-0 items-center">
        <Identicon address={item.address} />
      </span>
      <div
        className="flex min-w-0 flex-1 flex-col gap-0.5"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {showInput ? (
          <NameInput
            name={key}
            placeholder="Add a name"
            autoFocus={focused}
            validateCharset
            minLength={NAME_MIN_LENGTH}
            maxLength={ADDRESS_BOOK_NAME_MAX_LENGTH}
            className="-mx-1.5 w-[calc(100%+0.75rem)] [&_[data-slot=field-error]]:hidden"
            InputProps={{
              className: cn(
                'h-6 w-0 min-w-full rounded-sm px-1.5 py-0 text-base font-semibold md:text-base',
                error && 'border-destructive',
              ),
            }}
            data-testid="account-name-input"
          />
        ) : (
          <div className="flex h-6 items-center gap-1">
            <button
              type="button"
              onClick={startEditing}
              className="-mx-2 min-w-0 cursor-text truncate rounded-sm px-2 text-left text-base leading-6 font-semibold group-hover/row:bg-muted"
              data-testid="account-name-text"
            >
              {value}
            </button>
            <RenameButton onRename={startEditing} className={HOVER_ACTION_CLASS} />
          </div>
        )}
        {error ? (
          <Typography variant="paragraph-mini" className="text-destructive" role="alert">
            {error}
          </Typography>
        ) : (
          <FullAddress address={item.address} className="w-0 min-w-full" />
        )}
      </div>
    </div>
  )
}

/** One label/value line of the mobile detail row. */
const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-muted-foreground w-20 shrink-0">{label}</span>
    {children}
  </div>
)

/** Naming step shared by workspace onboarding and the "Add accounts" dialog; expects the surrounding form. */
const NameAccountsFields = ({ items }: { items: AllSafeItems }) => {
  const { getValues, setValue } = useFormContext<AddAccountsFormValues>()
  const summaries = useSafeSummaries(items)

  useEffect(() => {
    for (const item of items) {
      const key = nameFieldKey(item.address)
      if (getValues(key) === undefined) setValue(key, item.name ?? '')
    }
  }, [items, getValues, setValue])

  /** Fetched stats for a row, or an empty summary while the overviews are still loading. */
  const summaryOf = (item: Item) => summaries.get(item.address.toLowerCase()) ?? EMPTY_SUMMARY

  /** Threshold badge; icon-only when a multichain Safe's per-chain setups differ. */
  const renderThreshold = (item: Item) => {
    const { threshold, owners, thresholdMixed, loaded } = summaryOf(item)
    return <ThresholdBadge threshold={threshold} owners={owners} iconOnly={thresholdMixed} loading={!loaded} />
  }
  /** Logo pill covering every chain the Safe is being added on. */
  const renderNetworks = (item: Item) => (
    <NetworkLogosPill
      networks={(isMultiChainSafeItem(item) ? item.safes : [item]).map(({ chainId }) => ({ chainId }))}
    />
  )
  /** Fiat total across the Safe's chains, or a skeleton until the overviews land. */
  const renderBalance = (item: Item) => {
    const { balance, loaded } = summaryOf(item)
    return loaded ? <FiatBalance value={balance} /> : <Skeleton className="h-4 w-16" />
  }

  // Mirrors the accounts table's columns; on phones the three stat columns fold into the detail row.
  const columns: DataTableColumn<Item>[] = [
    {
      id: 'name',
      // Indented past the identicon so the label sits above the name text, as in the accounts table.
      header: <span className="pl-[52px]">Name</span>,
      width: '40%',
      minWidth: 280,
      cell: (item) => <NameAccountCell item={item} />,
    },
    {
      id: 'threshold',
      header: 'Threshold',
      align: 'center',
      width: '15%',
      minWidth: 96,
      priority: 'secondary',
      cell: renderThreshold,
    },
    {
      id: 'networks',
      header: 'Networks',
      align: 'center',
      width: '15%',
      minWidth: 96,
      priority: 'secondary',
      cell: renderNetworks,
    },
    {
      id: 'balance',
      header: 'Balance',
      align: 'end',
      width: '15%',
      minWidth: 96,
      priority: 'secondary',
      cell: renderBalance,
    },
  ]

  /** Mobile-only stats, indented past the identicon so the labels line up under the name. */
  const renderRowDetail = (item: Item) => (
    <div className="flex flex-col gap-2 pl-[52px] pb-2 text-sm">
      <DetailRow label="Threshold">{renderThreshold(item)}</DetailRow>
      <DetailRow label="Networks">{renderNetworks(item)}</DetailRow>
      <DetailRow label="Balance">{renderBalance(item)}</DetailRow>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <Typography variant="paragraph" color="muted">
        Your whole workspace sees these names. Use ones your team will recognize.
      </Typography>

      <PaginatedDataTable
        columns={columns}
        rows={items}
        getRowKey={(item) => item.address}
        getRowClassName={() => 'group/row'}
        rowHover={false}
        renderRowDetail={renderRowDetail}
        plainDetail
      />
    </div>
  )
}

export default NameAccountsFields

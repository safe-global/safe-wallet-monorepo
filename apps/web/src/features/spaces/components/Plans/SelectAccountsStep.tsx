import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SearchInput } from '@/components/ui/search-input'
import { Typography } from '@/components/ui/typography'
import SimilarityConfirmDialog from '@/components/common/TrustedSafesModal/SimilarityConfirmDialog'
import { SafeAccountsTable, type SafeAccountColumnId } from '@/features/myAccounts'
import type { AllSafeItems } from '@/hooks/safes'
import type { AddAccountsFormValues } from '../../hooks/addAccounts.types'
import SelectedCounter from '../SelectSafesOnboarding/components/SelectedCounter'
import useOnboardingSafes from '../SelectSafesOnboarding/hooks/useOnboardingSafes'
import useOnboardingSelection from '../SelectSafesOnboarding/hooks/useOnboardingSelection'

const COLUMNS: SafeAccountColumnId[] = ['name', 'networks', 'balance']

export default function SelectAccountsStep({
  limit,
  onBack,
  onContinue,
}: {
  limit: number
  onBack: () => void
  onContinue: (safeIds: string[]) => void
}) {
  const {
    trustedSafes,
    ownedSafes,
    flaggedAddresses,
    trustedSimilarityGroups,
    ownedSimilarityGroups,
    similarWarnings,
    handleSearch,
    hasNoSafes,
  } = useOnboardingSafes()
  const items = useMemo<AllSafeItems>(() => [...trustedSafes, ...ownedSafes], [trustedSafes, ownedSafes])
  const similarityGroups = useMemo(
    () => new Map([...trustedSimilarityGroups, ...ownedSimilarityGroups]),
    [trustedSimilarityGroups, ownedSimilarityGroups],
  )
  const { control, setValue } = useForm<AddAccountsFormValues>({ defaultValues: { selectedSafes: {} } })
  const { selectedKeys, isAtLimit, handleToggle, pendingConfirmation, confirmPending, cancelPending } =
    useOnboardingSelection({ items, control, setValue, flaggedAddresses, limit })

  const selection = { selectedKeys, onToggle: handleToggle, isAtLimit }
  const noResults = !hasNoSafes && items.length === 0

  return (
    <>
      <div className="flex flex-col gap-1">
        <Typography variant="h3" as={DialogTitle}>
          Select Safe accounts for your plan
        </Typography>
        <Typography color="muted">
          Choose which Safe accounts you want to include in this plan. You can add up to {limit} accounts.
        </Typography>
      </div>

      {hasNoSafes ? (
        <Alert variant="info">
          <AlertSeverityIcon variant="info" />
          <AlertDescription>You don&apos;t have any Safe accounts yet</AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <SearchInput
              className="flex-1"
              placeholder="by name, address or network"
              aria-label="Search Safe list"
              autoComplete="off"
              onChange={(e) => handleSearch(e.target.value)}
            />
            <SelectedCounter
              count={selectedKeys.size}
              limit={limit}
              isAtLimit={isAtLimit}
              tooltip={`Your plan covers up to ${limit} Safe accounts`}
            />
          </div>

          <ScrollArea className="h-[364px]">
            {noResults ? (
              <Typography align="center" color="muted" className="py-8">
                No Safe accounts match your search
              </Typography>
            ) : (
              <SafeAccountsTable
                items={items}
                columns={COLUMNS}
                embedded
                selection={selection}
                similarWarnings={similarWarnings}
                similarityGroups={similarityGroups}
                data-testid="trial-safes-table"
              />
            )}
          </ScrollArea>
        </div>
      )}

      <div className="flex gap-5">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack}>
          Go back
        </Button>
        <Button
          size="lg"
          accentIcon
          className="flex-1"
          disabled={selectedKeys.size === 0}
          onClick={() => onContinue([...selectedKeys])}
        >
          Continue to checkout
          <ArrowRight />
        </Button>
      </div>

      {pendingConfirmation && (
        <SimilarityConfirmDialog
          open
          safe={{ address: pendingConfirmation.address, name: pendingConfirmation.displayName }}
          onConfirm={confirmPending}
          onCancel={cancelPending}
        />
      )}
    </>
  )
}

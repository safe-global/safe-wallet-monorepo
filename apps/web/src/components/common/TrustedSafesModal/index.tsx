import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Info, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsQualifiedSafe } from '@/features/spaces'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import SecurityBanner from './SecurityBanner'
import TrustedSafesList from './TrustedSafesList'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import SelectAllConfirmDialog from './SelectAllConfirmDialog'
import type { UseTrustedSafesModalReturn } from './useTrustedSafesModal'

interface TrustedSafesModalProps {
  modal: UseTrustedSafesModalReturn
}

const TrustedSafesModal = ({ modal }: TrustedSafesModalProps) => {
  const {
    isOpen,
    availableItems,
    pendingConfirmation,
    pendingSelectAllConfirmation,
    similarAddressesForSelectAll,
    searchQuery,
    isLoading,
    hasChanges,
    totalSafesCount,
    selectedCount,
    allSelected,
    close,
    toggleSelection,
    selectAll,
    deselectAll,
    confirmSimilarAddress,
    cancelSimilarAddress,
    confirmSelectAll,
    skipSimilarSelectAll,
    cancelSelectAll,
    submitSelection,
    setSearchQuery,
  } = modal

  const isInSpace = useIsQualifiedSafe()
  const isConnected = Boolean(useWallet())
  const connectWallet = useConnectWallet()

  const pendingItem = pendingConfirmation
    ? availableItems.find((s) => s.address.toLowerCase() === pendingConfirmation)
    : null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-[min(900px,calc(100vw-2rem))] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
            <DialogTitle className="font-bold">Manage trusted Safes</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-5">
            <SecurityBanner title="Verify before you trust" />

            {/* Lightweight contextual helpers — kept slim so they don't compete with the list. */}
            {isInSpace && (
              <p className="text-muted-foreground mb-4 flex items-start gap-1.5 text-xs" data-testid="space-notice">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>Trusted Safes aren&apos;t added to this workspace automatically — add them separately.</span>
              </p>
            )}

            {!isConnected && (
              <div
                className="border-border bg-muted/40 mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5"
                data-testid="trusted-connect-wallet"
              >
                <span className="text-muted-foreground text-sm">
                  Connect your wallet to see and manage owned Safes.
                </span>
                <Button size="sm" variant="outline" onClick={connectWallet} data-testid="trusted-connect-wallet-button">
                  Connect wallet
                </Button>
              </div>
            )}

            {/* Toolbar: search + selection controls, aligned on one row above the list. Hidden when
                there's nothing to search or select. */}
            {(availableItems.length > 0 || Boolean(searchQuery)) && (
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <InputGroup className="border-border min-w-[220px] flex-1 rounded-md shadow-none">
                  <InputGroupAddon>
                    <Search className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Search by name or full address"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                    data-testid="trusted-safes-search"
                  />
                </InputGroup>
                <div className="text-muted-foreground ml-auto flex items-center gap-3 text-sm">
                  <span className="whitespace-nowrap">
                    <span className="text-foreground font-medium">{selectedCount}</span> of {totalSafesCount} selected
                  </span>
                  <span className="bg-border h-4 w-px" aria-hidden />
                  <button
                    type="button"
                    onClick={selectAll}
                    disabled={allSelected || isLoading}
                    className="text-primary hover:text-primary/80 cursor-pointer font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    disabled={selectedCount === 0 || isLoading}
                    className="text-primary hover:text-primary/80 cursor-pointer font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Deselect all
                  </button>
                </div>
              </div>
            )}

            <TrustedSafesList
              items={availableItems}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onToggle={toggleSelection}
              showSearchInput={false}
            />
          </div>

          <DialogFooter className="shrink-0 flex-row justify-end border-t border-border px-6 pb-6 pt-4">
            <Button onClick={close} variant="ghost">
              Cancel
            </Button>
            <Button onClick={submitSelection} disabled={!hasChanges}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pendingItem && (
        <SimilarityConfirmDialog
          open={Boolean(pendingConfirmation)}
          safe={pendingItem}
          onConfirm={confirmSimilarAddress}
          onCancel={cancelSimilarAddress}
        />
      )}

      <SelectAllConfirmDialog
        open={pendingSelectAllConfirmation}
        similarAddresses={similarAddressesForSelectAll}
        onConfirm={confirmSelectAll}
        onSkip={skipSimilarSelectAll}
        onCancel={cancelSelectAll}
      />
    </>
  )
}

export default TrustedSafesModal

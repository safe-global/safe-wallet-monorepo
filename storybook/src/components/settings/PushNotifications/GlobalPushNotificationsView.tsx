import { Typography } from '@/components/ui/typography'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { List, ListItem } from '@/components/ui/list'
import { Fragment } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { clickOnEnterOrSpace } from '@/utils/keyboard'
import { maybePlural } from '@safe-global/utils/utils/formatters'

import css from './styles.module.css'

export type NotifiableSafeItem = {
  address: string
  isSelected: boolean
  onSelect: () => void
  addressInfo: ReactNode
}

export type NotifiableChainItem = {
  chainId: string
  chainName?: string
  isChainSelected: boolean
  onSelectChain: () => void
  safes: NotifiableSafeItem[]
}

export type GlobalPushNotificationsViewProps = {
  hasAddress: boolean
  totalNotifiableSafes: number
  totalSignaturesRequired: number
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  canSave: boolean
  isLoading: boolean
  onSave: () => void
  isAllSelected: boolean
  onSelectAll: () => void
  chains: NotifiableChainItem[]
}

export const GlobalPushNotificationsView = ({
  hasAddress,
  totalNotifiableSafes,
  totalSignaturesRequired,
  renderCheckWallet,
  canSave,
  isLoading,
  onSave,
  isAllSelected,
  onSelectAll,
  chains,
}: GlobalPushNotificationsViewProps): ReactElement => {
  if (totalNotifiableSafes === 0) {
    return (
      <Typography className="text-muted-foreground">{hasAddress ? 'No owned Safes' : 'No wallet connected'}</Typography>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Typography variant="h4" className="inline">
          My Safes Accounts ({totalNotifiableSafes})
        </Typography>

        <div className="flex items-center">
          {totalSignaturesRequired > 0 && (
            <Typography className="mr-4 inline text-right">
              We&apos;ll ask you to verify ownership of each Safe account with your signature per chain{' '}
              {totalSignaturesRequired} time{maybePlural(totalSignaturesRequired)}
            </Typography>
          )}

          {renderCheckWallet((isOk) => (
            <Button disabled={!canSave || !isOk || isLoading} onClick={onSave}>
              {isLoading ? <Spinner className="size-5" /> : 'Save'}
            </Button>
          ))}
        </div>
      </div>

      <List className="rounded-lg border border-border bg-card">
        <ListItem className="block p-0">
          <div
            role="button"
            tabIndex={0}
            className={`${css.item} flex w-full cursor-pointer items-center gap-3 py-2 text-left`}
            onClick={onSelectAll}
            onKeyDown={clickOnEnterOrSpace}
          >
            <span className={css.icon}>
              <Checkbox checked={isAllSelected} aria-hidden tabIndex={-1} className="pointer-events-none" />
            </span>
            <Typography variant="paragraph-bold">Select all</Typography>
          </div>
        </ListItem>

        <ListItem aria-hidden className="p-0">
          <Separator />
        </ListItem>

        {chains.map(({ chainId, chainName, isChainSelected, onSelectChain, safes }, i, arr) => {
          if (safes.length === 0) return

          return (
            <Fragment key={chainId}>
              <ListItem className="block p-0">
                <div
                  role="button"
                  tabIndex={0}
                  className={`${css.item} flex w-full cursor-pointer items-center gap-3 py-2 text-left`}
                  onClick={onSelectChain}
                  onKeyDown={clickOnEnterOrSpace}
                >
                  <span className={css.icon}>
                    <Checkbox checked={isChainSelected} aria-hidden tabIndex={-1} className="pointer-events-none" />
                  </span>
                  <Typography variant="paragraph-bold">{`${chainName} Safe accounts`}</Typography>
                </div>

                <List className={css.item}>
                  {safes.map(({ address, isSelected, onSelect, addressInfo }) => {
                    return (
                      <ListItem key={address} className="p-0">
                        <div
                          role="button"
                          tabIndex={0}
                          className="flex w-full cursor-pointer items-center gap-3 py-0.5 pl-14 text-left"
                          onClick={onSelect}
                          onKeyDown={clickOnEnterOrSpace}
                        >
                          <span className={css.icon}>
                            <Checkbox checked={isSelected} aria-hidden tabIndex={-1} className="pointer-events-none" />
                          </span>
                          {addressInfo}
                        </div>
                      </ListItem>
                    )
                  })}
                </List>
              </ListItem>

              {i !== arr.length - 1 ? (
                <ListItem aria-hidden className="p-0">
                  <Separator />
                </ListItem>
              ) : null}
            </Fragment>
          )
        })}
      </List>
    </div>
  )
}

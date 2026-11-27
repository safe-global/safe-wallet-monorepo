import { useContext, type ReactElement, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  ArrowUpRight,
  BookUser,
  Building2,
  Landmark,
  Orbit,
  Repeat2,
  SquareTerminal,
  TrendingUp,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { AppRoutes } from '@/config/routes'
import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import type { ShellPageKey } from './shellPages'
import { useSafeRequest, type Shell } from './useShell'

type NewMenuProps = {
  shell: Shell
  /** The button that opens the menu, as a render element. */
  trigger: ReactElement
  children: ReactNode
  align?: 'start' | 'end'
}

const ITEM_CLASS = 'min-h-8 cursor-pointer gap-2'

/** Everything you can start or add, in one menu. Opens on hover, click and from the keyboard. */
export const NewMenu = ({ shell, trigger, children, align = 'start' }: NewMenuProps): ReactElement => {
  const { safe, pickedSafe } = shell
  const router = useRouter()
  const { setTxFlow } = useContext(TxModalContext)
  const txBuilder = useTxBuilderApp()
  const [, setSafeRequest] = useSafeRequest()

  const pageItem = (key: ShellPageKey, label: string, Icon: typeof Repeat2): ReactElement => {
    const link = shell.getLink(key)
    const content = (
      <>
        <Icon aria-hidden />
        <span className="flex-1">{label}</span>
        {link.kind === 'preview' && (
          <span className="block h-3.5 w-6 shrink-0" role="img" aria-label="Safe Pro">
            <ProChip className="size-full" />
          </span>
        )}
      </>
    )
    if (link.kind === 'pickSafe') {
      return (
        <DropdownMenuItem
          className={ITEM_CLASS}
          onClick={() => setSafeRequest({ page: key, label })}
          data-testid={`unified-new-${key}`}
        >
          {content}
        </DropdownMenuItem>
      )
    }
    return (
      <DropdownMenuItem className={ITEM_CLASS} render={<Link href={link.href} />} data-testid={`unified-new-${key}`}>
        {content}
      </DropdownMenuItem>
    )
  }

  const sendItem = safe ? (
    <CheckWallet allowSpendingLimit noTooltip>
      {(isOk) => (
        <DropdownMenuItem
          className={ITEM_CLASS}
          disabled={!isOk}
          onClick={() => setTxFlow(<TokenTransferFlow />)}
          data-testid="unified-new-send"
        >
          <ArrowUpRight aria-hidden />
          Send tokens
        </DropdownMenuItem>
      )}
    </CheckWallet>
  ) : (
    <DropdownMenuItem
      className={ITEM_CLASS}
      onClick={() => setSafeRequest({ page: 'overview', label: 'Send tokens', thenSend: true })}
      data-testid="unified-new-send"
    >
      <ArrowUpRight aria-hidden />
      Send tokens
    </DropdownMenuItem>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger openOnHover delay={80} render={trigger}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60" data-testid="unified-new-menu">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {pickedSafe ? `Transaction from ${pickedSafe.name}` : 'Transaction, asks which Safe first'}
          </DropdownMenuLabel>
          {sendItem}
          {pageItem('swap', 'Swap', Repeat2)}
          {pageItem('bridge', 'Bridge', Orbit)}
          {pageItem('earn', 'Deposit', TrendingUp)}
          {safe ? (
            <DropdownMenuItem className={ITEM_CLASS} render={<Link href={txBuilder.link} />}>
              <SquareTerminal aria-hidden />
              Transaction builder
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className={ITEM_CLASS}
              onClick={() => setSafeRequest({ page: 'apps', label: 'Transaction builder' })}
            >
              <SquareTerminal aria-hidden />
              Transaction builder
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Add</DropdownMenuLabel>
          <DropdownMenuItem className={ITEM_CLASS} onClick={() => void router.push(AppRoutes.newSafe.create)}>
            <WalletCards aria-hidden />
            Safe account
          </DropdownMenuItem>
          {pageItem('addressBook', 'Contact', BookUser)}
          {pageItem('policies', 'Policy', Landmark)}
          {pageItem('members', 'Member', UsersRound)}
          <DropdownMenuItem className={ITEM_CLASS} onClick={() => void router.push(AppRoutes.welcome.createSpace)}>
            <Building2 aria-hidden />
            Workspace
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const getNewLabel = ({ isWorkspace, workspace }: Shell): string =>
  !isWorkspace && workspace.safes.length === 1 ? 'New transaction' : 'New'

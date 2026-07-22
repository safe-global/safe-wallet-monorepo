import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import css from '@/components/common/ConnectWallet/styles.module.css'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import WalletOverview from '../WalletOverview'
import WalletInfo from '@/components/common/WalletInfo'

const AccountCenter = ({ wallet }: { wallet: ConnectedWallet }) => {
  const [open, setOpen] = useState(false)
  const { balance } = wallet

  const closeWalletInfo = () => {
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<button type="button" className="flex self-stretch text-left" />}
        data-testid="open-account-center"
      >
        <div className={`${css.buttonContainer} ${css.connectedButton}`}>
          <WalletOverview wallet={wallet} balance={balance} showBalance />

          <div className="ml-auto flex items-center justify-end text-[var(--color-border-main)]">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown data-testid="ExpandMoreIcon" className="size-4" />}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="center"
        side="bottom"
        sideOffset={0}
        className="w-auto overflow-hidden rounded-3xl border-0 p-0 ring-0 shadow-none"
      >
        <div className={css.popoverContainer}>
          <WalletInfo wallet={wallet} handleClose={closeWalletInfo} balance={balance} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default AccountCenter

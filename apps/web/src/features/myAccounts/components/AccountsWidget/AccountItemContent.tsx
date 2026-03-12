import type { ReactElement, ReactNode } from 'react'
import { useMemo } from 'react'
import { isAddress } from 'ethers'
import { blo } from 'blo'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'
import { AccountItem } from '../AccountItem'
import type { Account } from './types'

const getInitial = (name: string): string => name.charAt(0).toUpperCase()

interface AccountItemContentProps {
  account: Account
  children: ReactNode
}

const AccountItemContent = ({ account, children }: AccountItemContentProps): ReactElement => {
  const fullAddress = account.safes[0]?.address
  const identiconSrc = useMemo(() => {
    try {
      if (!fullAddress || !isAddress(fullAddress)) {
        return undefined
      }

      return blo(fullAddress as `0x${string}`)
    } catch {
      /* empty */
    }
    return undefined
  }, [fullAddress])

  return (
    <>
      <div className="flex w-[220px] items-center gap-4">
        <Avatar>
          {identiconSrc && <AvatarImage src={identiconSrc} alt={account.name} />}
          <AvatarFallback className="bg-[#f0fdf4] text-sm font-semibold">{getInitial(account.name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5 text-left">
          <Typography variant="paragraph-medium">{account.name}</Typography>
          <Typography variant="paragraph-mini" color="muted">
            {account.address}
          </Typography>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <AccountItem.ChainBadge safes={account.safes} />
      </div>

      {children}
    </>
  )
}

export { AccountItemContent }
export default AccountItemContent

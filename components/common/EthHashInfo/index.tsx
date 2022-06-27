import { ReactElement } from 'react'
import css from './styles.module.css'
import chains from '@/config/chains'
import { shortenAddress } from '@/utils/formatters'
import Identicon from '../Identicon'
import useChainId from '@/hooks/useChainId'
import useAddressBook from '@/hooks/useAddressBook'
import { Typography } from '@mui/material'

type EthHashInfoProps = {
  address: string
  chainId?: string
  name?: string
  showAvatar?: boolean
  showCopyButton?: boolean
  prefix?: string
  copyPrefix?: boolean
  shortAddress?: boolean
  customAvatar?: string
}

const SRCEthHashInfo = ({
  address,
  customAvatar,
  prefix,
  shortAddress = true,
  showAvatar = true,
  ...props
}: EthHashInfoProps): ReactElement => {
  return (
    <div className={css.container}>
      {showAvatar && (
        <div className={css.avatar}>
          {customAvatar ? <img src={customAvatar} alt={address} /> : <Identicon address={address} />}
        </div>
      )}

      <div>
        {props.name && <b>{props.name}</b>}
        <Typography>
          {prefix && <b>{prefix}:</b>}
          {shortAddress ? shortenAddress(address) : address}
        </Typography>
      </div>

      {props.showCopyButton && <div className={css.copy}>{/* TODO */}</div>}
    </div>
  )
}

const EthHashInfo = (props: EthHashInfoProps): ReactElement => {
  const chainId = useChainId()
  const addressBook = useAddressBook()
  const name = addressBook[props.address]
  const prefix = Object.keys(chains).find((key) => chains[key] === chainId)

  return <SRCEthHashInfo {...props} prefix={prefix} name={name} />
}

export default EthHashInfo

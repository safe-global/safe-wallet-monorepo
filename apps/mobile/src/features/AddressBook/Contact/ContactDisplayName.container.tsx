import { useAppSelector } from '@/src/store/hooks'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { ContactName } from './components/ContactName'
import { type TextProps } from 'tamagui'

type Props = {
  address: `0x${string}`
  textProps?: Partial<TextProps>
}

export const ContactDisplayNameContainer = ({ address, textProps }: Props) => {
  const contact = useAppSelector(selectContactByAddress(address))
  return <ContactName name={contact?.name} address={address} textProps={textProps} />
}

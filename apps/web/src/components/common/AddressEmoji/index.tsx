import { type ReactElement, memo } from 'react'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import css from './styles.module.css'

// Define the Unicode ranges for plant, food, animal, sports, and music emojis
const unicodeRanges = [
  [0x1f331, 0x1f333], // Plant
  [0x1f334, 0x1f335], // Plant
  [0x1f340, 0x1f341], // Plant
  [0x1f34f, 0x1f37f], // Food
  [0x1f950, 0x1f96b], // Food
  [0x1f400, 0x1f43e], // Animal
  [0x1f981, 0x1f984], // Animal
  [0x1f3b0, 0x1f3bd], // Sports
]

// Calculate the total number of emojis
let totalEmojis = 0
for (const range of unicodeRanges) {
  totalEmojis += range[1] - range[0] + 1
}

export function ethereumAddressToEmoji(address: string): string {
  // Convert the Ethereum address from hexadecimal to decimal
  const decimal = BigInt(address.slice(0, 6))

  // Calculate the index by taking the modulo of the decimal by the number of emojis
  let index = Number(decimal % BigInt(totalEmojis))

  // Find the corresponding emoji
  for (const range of unicodeRanges) {
    if (index < range[1] - range[0] + 1) {
      return String.fromCodePoint(range[0] + index)
    } else {
      index -= range[1] - range[0] + 1
    }
  }

  return ''
}

type EmojiProps = {
  address: string
  size?: number
}

export const Emoji = memo(function Emoji({ address, size = 40 }: EmojiProps): ReactElement {
  return (
    <div className={css.emojiWrapper} style={{ fontSize: `${size * 0.7}px`, width: `${size}px`, height: `${size}px` }}>
      {ethereumAddressToEmoji(address)}
    </div>
  )
})

const AddressEmoji = (props: EmojiProps): ReactElement | null => {
  const { addressEmojis } = useAppSelector(selectSettings)
  return addressEmojis ? <Emoji {...props} /> : null
}

export default AddressEmoji

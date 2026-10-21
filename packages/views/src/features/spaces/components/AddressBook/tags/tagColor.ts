/**
 * The eight tag colours from the Safe{Wallet} colour system (tag/<name>/fg, /bg and /dot), the names
 * CGW stores. Here the colour is a hash of the tag name; CGW assigns and stores it in the app.
 */
export const TAG_PALETTE = [
  { name: 'Slate', dot: 'bg-[#7d8ea0]', fill: 'bg-[#f0f4f7] text-[#4f5c6b]' },
  { name: 'Clay', dot: 'bg-[#b08060]', fill: 'bg-[#fbf1eb] text-[#775136]' },
  { name: 'Rose', dot: 'bg-[#cd6199]', fill: 'bg-[#ffeef5] text-[#8e3665]' },
  { name: 'Lilac', dot: 'bg-[#af7de1]', fill: 'bg-[#f7f2fe] text-[#6f4198]' },
  { name: 'Iris', dot: 'bg-[#5551d8]', fill: 'bg-[#ebeefe] text-[#403caa]' },
  { name: 'Cobalt', dot: 'bg-[#276ee1]', fill: 'bg-[#e9f1fe] text-[#184da3]' },
  { name: 'Sky', dot: 'bg-[#3cb1e9]', fill: 'bg-[#edf8fe] text-[#086990]' },
  { name: 'Lagoon', dot: 'bg-[#199a8d]', fill: 'bg-[#dffbf6] text-[#05665d]' },
] as const

export const tagColorIndex = (tag: string): number => {
  const key = tag.trim().toLowerCase()
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % TAG_PALETTE.length
}

export const tagColor = (tag: string) => TAG_PALETTE[tagColorIndex(tag)]

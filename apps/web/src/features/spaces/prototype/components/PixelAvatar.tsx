import type { Persona } from '../types'

// Pixel portraits for the "Preview as" personas. K outline, H hair, A hat, S skin, E eyes, G lens, M mouth, T top, W trim.
const TEMPLATES = {
  short: [
    '................',
    '.....KKKKKK.....',
    '....KHHHHHHK....',
    '...KHHHHHHHHK...',
    '...KHHSSSSHHK...',
    '...KHSSSSSSHK...',
    '...KSSESSESSK...',
    '...KSSSSSSSSK...',
    '...KSSSMMSSSK...',
    '....KSSSSSSK....',
    '.....KSSSSK.....',
    '......KSSK......',
    '...KKKTSSTKKK...',
    '..KTTTTWWTTTTK..',
    '..KTTTTTTTTTTK..',
    '..KTTTTTTTTTTK..',
  ],
  glasses: [
    '................',
    '.....KKKKKK.....',
    '....KHHHHHHK....',
    '...KHHHHHHHHK...',
    '...KHHSSSSHHK...',
    '...KHSSSSSSHK...',
    '...KKGEKKGEKK...',
    '...KSSSSSSSSK...',
    '...KSSSMMSSSK...',
    '....KSSSSSSK....',
    '.....KSSSSK.....',
    '......KSSK......',
    '...KKKTSSTKKK...',
    '..KTTTTWWTTTTK..',
    '..KTTTTTTTTTTK..',
    '..KTTTTTTTTTTK..',
  ],
  long: [
    '................',
    '.....KKKKKK.....',
    '....KHHHHHHK....',
    '...KHHHHHHHHK...',
    '..KHHHSSSSHHHK..',
    '..KHHSSSSSSHHK..',
    '..KHSSESSESSHK..',
    '..KHSSSSSSSSHK..',
    '..KHSSSMMSSSHK..',
    '..KHHSSSSSSHHK..',
    '..KHHHSSSSHHHK..',
    '..KHHHKSSKHHHK..',
    '..KHKKTSSTKKHK..',
    '..KTTTTWWTTTTK..',
    '..KTTTTTTTTTTK..',
    '..KTTTTTTTTTTK..',
  ],
  cap: [
    '................',
    '.....KKKKKK.....',
    '....KAAAWWAK....',
    '...KAAAAAAAAK...',
    '...KAAAAAAAAAKK.',
    '...KHSSSSSSKKK..',
    '...KSSESSESSK...',
    '...KSSSSSSSSK...',
    '...KSSSMMSSSK...',
    '....KSSSSSSK....',
    '.....KSSSSK.....',
    '......KSSK......',
    '...KKKTSSTKKK...',
    '..KTTTWTTWTTTK..',
    '..KTTTWTTWTTTK..',
    '..KTTTWTTWTTTK..',
  ],
}

type Look = { template: keyof typeof TEMPLATES; hair: string; skin: string; top: string; hat?: string; trim: string }

// Fixed art colours, like an NFT avatar: they stay the same in light and dark mode.
const LOOKS: Record<Persona, Look> = {
  owner: { template: 'short', hair: '#2b1d14', skin: '#b07a52', top: '#4f6fa8', trim: '#f2f2f2' },
  single: { template: 'cap', hair: '#1a1a1a', skin: '#6b4528', top: '#c9c9c9', hat: '#262626', trim: '#ffffff' },
  security: { template: 'glasses', hair: '#3a2a1e', skin: '#d9a77f', top: '#1f2937', trim: '#4b5563' },
  member: { template: 'long', hair: '#141414', skin: '#e6bfa0', top: '#333333', trim: '#555555' },
  admin: { template: 'long', hair: '#4a3222', skin: '#9c6a48', top: '#a34a55', trim: '#e8e8e8' },
}

export function PixelAvatar({ persona, size = 48 }: { persona: Persona; size?: number }) {
  const look = LOOKS[persona]
  const colors: Record<string, string> = {
    K: '#000000',
    E: '#000000',
    M: '#3b2417',
    H: look.hair,
    A: look.hat ?? look.hair,
    S: look.skin,
    T: look.top,
    W: look.trim,
    G: '#bfe0f5',
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className="shrink-0 rounded-md"
      // Inline size: menu items shrink unsized icons to 16px.
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <rect width={16} height={16} fill="#e5e5e5" />
      {TEMPLATES[look.template].flatMap((row, y) =>
        [...row].map((pixel, x) =>
          colors[pixel] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={colors[pixel]} /> : null,
        ),
      )}
    </svg>
  )
}

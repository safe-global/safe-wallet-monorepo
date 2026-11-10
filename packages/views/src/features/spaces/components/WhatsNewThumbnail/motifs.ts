export type MotifTone = 'accent' | 'key' | 'light'

export type MotifShape = [tone: MotifTone, x: number, y: number, width: number, height: number]

const networks = (): MotifShape[] => {
  const lines: MotifShape[] = [
    ...[1.5, 5, 8.5].map((y): MotifShape => ['accent', 1.5, y - 0.15, 7, 0.3]),
    ...[1.5, 5, 8.5].map((x): MotifShape => ['accent', x - 0.15, 1.5, 0.3, 7]),
  ]
  const nodes = [1.5, 5, 8.5].flatMap((y) => [1.5, 5, 8.5].map((x) => [x, y]))
  const nodeTone = (index: number): MotifTone => (index === 4 ? 'key' : index === 2 || index === 6 ? 'accent' : 'light')
  return [...lines, ...nodes.map(([x, y], index): MotifShape => [nodeTone(index), x - 0.7, y - 0.7, 1.4, 1.4])]
}

const safeStandard = (): MotifShape[] =>
  Array.from({ length: 16 }, (_, index): MotifShape => {
    const row = Math.floor(index / 4)
    const col = index % 4
    const tone: MotifTone = row === 1 && col === 2 ? 'key' : row === 2 && col === 1 ? 'light' : 'accent'
    return [tone, 0.25 + col * 2.5, 0.25 + row * 2.5, 2, 2]
  })

// Same 10-unit grid data as the asset generator's blog hero motifs
export const MOTIFS = {
  announcement: [
    ['accent', 4.5, 1, 1, 1],
    ['accent', 4.5, 8, 1, 1],
    ['accent', 1, 4.5, 1, 1],
    ['accent', 8, 4.5, 1, 1],
    ['accent', 2.25, 2.25, 1, 1],
    ['accent', 6.75, 2.25, 1, 1],
    ['accent', 2.25, 6.75, 1, 1],
    ['accent', 6.75, 6.75, 1, 1],
    ['key', 3.75, 3.75, 2.5, 2.5],
  ],
  institutions: [
    ['light', 0.9, 6.5, 1.6, 3],
    ['accent', 3.1, 4.5, 1.6, 5],
    ['accent', 5.3, 2.5, 1.6, 7],
    ['key', 7.5, 0.5, 1.6, 9],
  ],
  multisig: [
    ['accent', 0.5, 1.5, 4.2, 1.6],
    ['accent', 0.5, 4.2, 4.2, 1.6],
    ['accent', 0.5, 6.9, 4.2, 1.6],
    ['key', 4.7, 2.05, 1, 0.5],
    ['key', 4.7, 4.75, 1, 0.5],
    ['key', 4.7, 7.45, 1, 0.5],
    ['key', 5.7, 2.5, 3.8, 5],
    ['light', 7, 4.4, 1.2, 1.2],
  ],
  networks: networks(),
  safeStandard: safeStandard(),
  security: [
    ['accent', 1, 1, 8, 8],
    ['light', 2.75, 2.75, 4.5, 4.5],
    ['key', 4.1, 4.1, 1.8, 1.8],
  ],
} satisfies Record<string, MotifShape[]>

export type MotifName = keyof typeof MOTIFS

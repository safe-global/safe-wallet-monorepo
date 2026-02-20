declare module 'tinycolor2' {
  interface HSL {
    h: number
    s: number
    l: number
  }

  interface TinyColor {
    toHexString(): string
    triad(): TinyColor[]
  }

  function tinycolor(color: string | HSL): TinyColor
  export = tinycolor
}

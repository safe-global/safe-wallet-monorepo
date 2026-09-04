export const formatNumber = (value: number): string =>
  value >= 10000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value).toLocaleString('en-US')

export const formatSeconds = (seconds: number): string => {
  const s = Math.max(0, Math.ceil(seconds))
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`
}

export const formatDuration = (seconds: number): string => {
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export const hexColor = (color: number): string => `#${color.toString(16).padStart(6, '0')}`

export const dps = (damage: number, cooldown: number): number => (cooldown > 0 ? damage / cooldown : 0)

import type { FiatChangeDirection } from '@safe-global/utils/utils/fiatChange'

export const getFiatChangeColor = (direction: FiatChangeDirection) => {
  switch (direction) {
    case 'up':
      return '$success'
    case 'down':
      return '$error'
    default:
      return '$colorSecondary'
  }
}

/** formatPercentage uses signDisplay: 'never', so the sign is rendered separately. */
export const getFiatChangeSign = (direction: FiatChangeDirection) => {
  switch (direction) {
    case 'up':
      return '+'
    case 'down':
      return '-'
    default:
      return ''
  }
}

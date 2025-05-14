import { render } from '@/tests/test-utils'
import SafeAppIconCard from '.'

describe('SafeAppIconCard', () => {
  it('should render an icon', () => {
    const src = 'https://safe-transaction-assets.safe.global/safe_apps/160/icon.png'
    const { queryByAltText } = render(
      <SafeAppIconCard src={src} fallback="/fallback.png" height={100} width={100} alt="test" />,
    )

    const img = queryByAltText('test')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', src)
    expect(img).toHaveAttribute('height', '100')
    expect(img).toHaveAttribute('width', '100')
    expect(img).not.toHaveAttribute('crossorigin')
  })
})

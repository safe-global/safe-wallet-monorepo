import { render } from '@/src/tests/test-utils'
import { SignersCard } from '.'
import { Text } from 'tamagui'

const fakeAddress = '0x0000000000000000000000000000000000000000'

describe('AssetsCard', () => {
  it('should render the default markup', () => {
    const { getByText } = render(<SignersCard name="Ether" address={fakeAddress} />)

    expect(getByText('Nevinhoso')).toBeTruthy()
    expect(getByText(fakeAddress)).toBeTruthy()
  })

  it('should render the rightNode of the asset', () => {
    const { getByText } = render(
      <SignersCard name="Nevinhoso" rightNode={<Text>rightNode</Text>} address={fakeAddress} />,
    )

    expect(getByText('Nevinhoso')).toBeTruthy()
    expect(getByText('rightNode')).toBeTruthy()
  })
})

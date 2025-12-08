import { blo } from 'blo'
import { act } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import { fireEvent, render, waitFor } from '@/tests/test-utils'
import * as useAllAddressBooks from '@/hooks/useAllAddressBooks'
import * as useChainId from '@/hooks/useChainId'
import * as store from '@/store'
import * as useChains from '@/hooks/useChains'
import EthHashInfo from '.'
import { ContactSource } from '@/hooks/useAllAddressBooks'

const originalClipboard = { ...global.navigator.clipboard }

const MOCK_SAFE_ADDRESS = '0x0000000000000000000000000000000000005AFE'
const MOCK_CHAIN_ID = '4'

jest.mock('@/hooks/useAllAddressBooks')
jest.mock('@/hooks/useChainId')
jest.mock('@/hooks/useChains')

describe('EthHashInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useAllAddressBooks, 'default').mockImplementation(() => ({
      [MOCK_CHAIN_ID]: {
        [MOCK_SAFE_ADDRESS]: 'Address book name',
      },
    }))

    jest.spyOn(useAllAddressBooks, 'useAddressBookItem').mockImplementation(() => ({
      name: 'Address book name',
      chainIds: [MOCK_CHAIN_ID],
      address: MOCK_SAFE_ADDRESS,
      createdBy: '0x123',
      lastUpdatedBy: '0x123',
      source: ContactSource.local,
    }))

    //@ts-ignore
    global.navigator.clipboard = {
      writeText: jest.fn(() => Promise.resolve()),
    }
  })

  afterEach(() => {
    //@ts-ignore
    global.navigator.clipboard = originalClipboard
  })

  describe('address', () => {
    it('renders a shortened address by default', () => {
      const { queryAllByText } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} />)

      expect(queryAllByText('0x0000...5AFE')[0]).toBeInTheDocument()
    })

    it('renders a full address', () => {
      const { queryByText } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} shortAddress={false} />)

      expect(queryByText(MOCK_SAFE_ADDRESS)).toBeInTheDocument()
    })
  })

  describe('prefix', () => {
    it('renders the current chain prefix by default', () => {
      jest.spyOn(useChainId, 'default').mockReturnValue('4')

      jest.spyOn(useChains, 'useChain').mockReturnValue({ chainId: '4', shortName: 'rin' } as Chain)

      jest.spyOn(store, 'useAppSelector').mockReturnValue({
        shortName: {
          copy: true,
        },
      })

      const { queryByText } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} />)

      expect(queryByText('rin:')).toBeInTheDocument()
    })

    it('renders the chain prefix associated with the given chainId', () => {
      jest.spyOn(useChains, 'useChain').mockReturnValue({ chainId: '100', shortName: 'gno' } as Chain)

      jest.spyOn(store, 'useAppSelector').mockReturnValue({
        shortName: {
          copy: true,
        },
      })

      const { queryByText } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} chainId="100" />)

      expect(queryByText('gno:')).toBeInTheDocument()
    })

    it('renders a custom prefix', () => {
      jest.spyOn(store, 'useAppSelector').mockReturnValue({
        shortName: {
          copy: true,
        },
      })

      const { queryByText } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} prefix="test" />)

      expect(queryByText('test:')).toBeInTheDocument()
    })

    it("doesn't prefix non-addresses", () => {
      jest.spyOn(useChainId, 'default').mockReturnValue('4')

      jest.spyOn(useChains, 'useChain').mockReturnValue({ chainId: '4', shortName: 'rin' } as Chain)

      jest.spyOn(store, 'useAppSelector').mockReturnValue({
        shortName: {
          copy: true,
        },
      })

      const result1 = render(
        <EthHashInfo address="0xe26920604f9a02c5a877d449faa71b7504f0c2508dcc7c0384078a024b8e592f" />,
      )

      expect(result1.queryByText('rin:')).not.toBeInTheDocument()

      const result2 = render(<EthHashInfo address="0x123" />)

      expect(result2.queryByText('rin:')).not.toBeInTheDocument()
    })

    it('should not render the prefix when disabled in the props', () => {
      const { queryByText } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} showPrefix={false} />)

      expect(queryByText('rin:')).not.toBeInTheDocument()
    })
  })

  describe('name', () => {
    it('renders a name by default', () => {
      jest.spyOn(useAllAddressBooks, 'useAddressBookItem').mockReturnValue(undefined)
      const { queryByText } = render(<EthHashInfo address="0x1234" name="Test name" />)

      expect(queryByText('Test name')).toBeInTheDocument()
    })

    it('renders a name from the address book even if a name is passed', () => {
      const { queryByText } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} name="Fallback name" />)

      expect(queryByText('Address book name')).toBeInTheDocument()
    })

    it('renders a name from the address book', () => {
      const { queryByText } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} />)

      expect(queryByText('Address book name')).toBeInTheDocument()
    })

    it('hides a name', () => {
      const { queryByText } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} name="Test" showName={false} />)

      expect(queryByText('Test')).not.toBeInTheDocument()
      expect(queryByText('Address book name')).not.toBeInTheDocument()
    })
  })

  describe('avatar', () => {
    it('renders an avatar by default', () => {
      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} />)

      expect(container.querySelector('.icon')).toHaveAttribute(
        'style',
        `background-image: url(${blo(MOCK_SAFE_ADDRESS)}); width: 40px; height: 40px;`,
      )
    })

    it('allows for sizing of avatars', () => {
      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} avatarSize={100} />)

      expect(container.querySelector('.icon')).toHaveAttribute(
        'style',
        `background-image: url(${blo(MOCK_SAFE_ADDRESS)}); width: 100px; height: 100px;`,
      )
    })

    it('renders a custom avatar', () => {
      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} customAvatar="./test.jpg" />)

      expect(container.querySelector('img')).toHaveAttribute('src', './test.jpg')
    })

    it('allows for sizing of custom avatars', () => {
      const { container } = render(
        <EthHashInfo address={MOCK_SAFE_ADDRESS} customAvatar="./test.jpg" avatarSize={100} />,
      )

      const avatar = container.querySelector('img')

      expect(avatar).toHaveAttribute('src', './test.jpg')
      expect(avatar).toHaveAttribute('width', '100')
      expect(avatar).toHaveAttribute('height', '100')
    })

    it('falls back to an identicon', async () => {
      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} customAvatar="" />)

      await waitFor(() => {
        expect(container.querySelector('.icon')).toBeInTheDocument()
      })
    })

    it('hides the avatar', () => {
      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} showAvatar={false} />)

      expect(container.querySelector('.icon')).not.toBeInTheDocument()
    })
  })

  describe('copy button', () => {
    it("doesn't show the copy button by default", () => {
      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} />)

      expect(container.querySelector('button')).not.toBeInTheDocument()
    })

    it('shows the copy button', () => {
      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} showCopyButton />)

      expect(container.querySelector('button')).toBeInTheDocument()
    })

    it("doesn't copy the prefix with non-addresses", async () => {
      jest.spyOn(useChainId, 'default').mockReturnValue('4')

      jest.spyOn(useChains, 'useChain').mockReturnValue({ chainId: '4', shortName: 'rin' } as Chain)

      jest.spyOn(store, 'useAppSelector').mockReturnValue({
        shortName: {
          copy: true,
        },
      })

      const { container } = render(
        <EthHashInfo address="0xe26920604f9a02c5a877d449faa71b7504f0c2508dcc7c0384078a024b8e592f" showCopyButton />,
      )

      const button = container.querySelector('button')

      act(() => {
        fireEvent.click(button!)
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        '0xe26920604f9a02c5a877d449faa71b7504f0c2508dcc7c0384078a024b8e592f',
      )
    })

    it('copies the default prefixed address', async () => {
      jest.spyOn(useChainId, 'default').mockReturnValue('4')

      jest.spyOn(useChains, 'useChain').mockReturnValue({ chainId: '4', shortName: 'rin' } as Chain)

      jest.spyOn(store, 'useAppSelector').mockReturnValue({
        shortName: {
          copy: true,
        },
      })

      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} showCopyButton />)

      const button = container.querySelector('button')

      act(() => {
        fireEvent.click(button!)
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`rin:${MOCK_SAFE_ADDRESS}`)
    })

    it('copies the prefix even if it is hidden', async () => {
      jest.spyOn(useChainId, 'default').mockReturnValue('4')

      jest.spyOn(useChains, 'useChain').mockReturnValue({ chainId: '4', shortName: 'rin' } as Chain)

      jest.spyOn(store, 'useAppSelector').mockReturnValue({
        shortName: {
          copy: true,
        },
      })

      const { container, queryByText } = render(
        <EthHashInfo address={MOCK_SAFE_ADDRESS} showCopyButton showPrefix={false} />,
      )

      expect(queryByText('rin:')).not.toBeInTheDocument()

      const button = container.querySelector('button')

      act(() => {
        fireEvent.click(button!)
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`rin:${MOCK_SAFE_ADDRESS}`)
    })

    it('copies the selected chainId prefix', async () => {
      jest.spyOn(useChains, 'useChain').mockReturnValue({ chainId: '100', shortName: 'gno' } as Chain)

      jest.spyOn(store, 'useAppSelector').mockReturnValue({
        shortName: {
          copy: true,
        },
      })

      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} showCopyButton chainId="100" />)

      const button = container.querySelector('button')

      act(() => {
        fireEvent.click(button!)
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`gno:${MOCK_SAFE_ADDRESS}`)
    })

    it('copies the raw address', async () => {
      jest.spyOn(useChains, 'useChain').mockReturnValue(undefined)

      jest.spyOn(store, 'useAppSelector').mockReturnValue({
        shortName: {
          copy: false,
        },
      })

      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} showCopyButton />)

      const button = container.querySelector('button')

      act(() => {
        fireEvent.click(button!)
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(MOCK_SAFE_ADDRESS)
    })
  })

  describe('block explorer', () => {
    it("doesn't render the block explorer link by default", () => {
      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} />)

      expect(container.querySelector('a')).not.toBeInTheDocument()
    })
    it('renders the block explorer link', () => {
      jest.spyOn(useChains, 'useChain').mockReturnValue({
        chainId: '4',
        blockExplorerUriTemplate: { address: 'https://rinkeby.etherscan.io/address/{{address}}' },
      } as Chain)

      jest.spyOn(store, 'useAppSelector').mockReturnValue({ shortName: {} })

      const { container } = render(<EthHashInfo address={MOCK_SAFE_ADDRESS} hasExplorer />)

      expect(container.querySelector('a')).toHaveAttribute(
        'href',
        'https://rinkeby.etherscan.io/address/0x0000000000000000000000000000000000005AFE',
      )
    })
  })

  describe('Safe Shield icon', () => {
    it('renders shield icon when showShieldIcon is true and name is not undefined', () => {
      jest.spyOn(useAllAddressBooks, 'useAddressBookItem').mockReturnValue(undefined)

      const { container, queryByText } = render(
        <EthHashInfo address={MOCK_SAFE_ADDRESS} showShieldIcon={true} name="My Safe Account" />,
      )

      expect(queryByText('My Safe Account')).toBeInTheDocument()

      const nameBox = container.querySelector('.ethHashInfo-name')
      expect(nameBox).toBeInTheDocument()

      if (nameBox) {
        const styles = window.getComputedStyle(nameBox)
        // Should have bold font weight (indicates shield styling is applied)
        expect(styles.fontWeight).toBe('700')
        // Should have border radius (part of shield styling)
        expect(styles.borderRadius).toBeTruthy()
      }

      // Shield icon should be rendered (check for bold styling which indicates shield container)
      const boxes = Array.from(container.querySelectorAll('*')).filter((el) => {
        const styles = window.getComputedStyle(el)
        return styles.fontWeight === '700' || styles.fontWeight === 'bold'
      })

      expect(boxes.length).toBeGreaterThan(0)
    })

    it('renders shield icon when showShieldIcon is true and name is undefined', () => {
      jest.spyOn(useAllAddressBooks, 'useAddressBookItem').mockReturnValue(undefined)

      const { container } = render(
        <EthHashInfo address={MOCK_SAFE_ADDRESS} showShieldIcon={true} name={undefined} showName={false} />,
      )

      // Check that the shield icon container has bold styling (accountStylesWithShieldEnabled)
      // This confirms the shield icon Box is rendered even without a name
      const boxes = Array.from(container.querySelectorAll('*')).filter((el) => {
        const styles = window.getComputedStyle(el)
        return styles.fontWeight === '700' || styles.fontWeight === 'bold'
      })

      expect(boxes.length).toBeGreaterThan(0)
    })

    it('does not render shield icon when showShieldIcon is false and name is undefined', () => {
      jest.spyOn(useAllAddressBooks, 'useAddressBookItem').mockReturnValue(undefined)

      const { container } = render(
        <EthHashInfo address={MOCK_SAFE_ADDRESS} showShieldIcon={false} name={undefined} showName={false} />,
      )

      // When showShieldIcon is false, there should be no Box with bold font weight
      const boxes = Array.from(container.querySelectorAll('*')).filter((el) => {
        const styles = window.getComputedStyle(el)
        return styles.fontWeight === '700' || styles.fontWeight === 'bold'
      })

      expect(boxes.length).toBe(0)
    })
  })
})

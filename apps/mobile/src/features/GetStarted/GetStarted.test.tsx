import React from 'react'
import { render } from '@/src/tests/test-utils'
import { GetStarted } from './GetStarted'
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/src/config/constants'

type MockLinkProps = {
  href: string
  target?: string
  rel?: string
  children?: React.ReactNode
}

jest.mock('expo-router', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')

  return {
    useRouter: () => ({ navigate: jest.fn() }),
    Link: ({ href, target, rel, children }: MockLinkProps) =>
      ReactLib.createElement(View, { testID: `link-${href}`, target, rel }, children),
  }
})

describe('GetStarted', () => {
  it.each([
    ['User Terms', TERMS_OF_USE_URL],
    ['Privacy Policy', PRIVACY_POLICY_URL],
  ])('opens the %s link in a new tab without leaking the referrer', (_label, url) => {
    const { getByTestId } = render(<GetStarted />)

    const link = getByTestId(`link-${url}`)

    expect(link.props.target).toBe('_blank')
    // Without rel, a _blank link hands the opened page a reference back to this
    // one via window.opener when the app runs on web.
    expect(link.props.rel).toBe('noreferrer')
  })
})

import React from 'react'
import { render } from '@/src/tests/test-utils'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders circular badge', () => {
    const view = render(<Badge content="12+" testID="badge" />)
    expect(view).toMatchSnapshot()
  })

  it('renders non-circular badge', () => {
    const view = render(<Badge content="Label" circular={false} testID="badge" />)
    expect(view).toMatchSnapshot()
  })

  it('renders badge with custom size and theme', () => {
    const view = render(<Badge content="ok" circleSize="$8" themeName="badge_success" testID="badge" />)
    expect(view).toMatchSnapshot()
  })
})

import type * as ReactModule from 'react'
import { render, screen } from '@/tests/test-utils'
import SearchSection from '../SearchSection'

let mockIsActive = true

// The real sections are hook-using components assigned directly to renderItem,
// so the mock must also call hooks in its body to cover the rules-of-hooks contract
jest.mock('../sectionItems', () => {
  const { useState, createElement } = jest.requireActual<typeof ReactModule>('react')

  const MockStatefulSection = ({ label }: { label: string; query: string }) => {
    const [content] = useState(`${label} content`)
    return createElement('div', null, content)
  }

  // Like the real activation hooks (useIsQualifiedSafe etc.), this must call a
  // hook itself for React to detect a hook-count mismatch on deactivation
  const useToggleableActivate = () => {
    useState(false)
    return mockIsActive
  }

  return {
    sectionItems: [
      {
        label: 'Always on',
        useActivate: () => true,
        renderItem: MockStatefulSection,
      },
      {
        label: 'Toggleable',
        useActivate: useToggleableActivate,
        renderItem: MockStatefulSection,
      },
    ],
  }
})

describe('SearchSection', () => {
  beforeEach(() => {
    mockIsActive = true
  })

  it('renders all active sections', () => {
    render(<SearchSection query="" />)

    expect(screen.getByText('Always on content')).toBeInTheDocument()
    expect(screen.getByText('Toggleable content')).toBeInTheDocument()
  })

  it('removes a section without violating the rules of hooks when it deactivates', () => {
    const { rerender } = render(<SearchSection query="" />)

    expect(screen.getByText('Toggleable content')).toBeInTheDocument()

    mockIsActive = false

    expect(() => rerender(<SearchSection query="" />)).not.toThrow()
    expect(screen.queryByText('Toggleable content')).not.toBeInTheDocument()
    expect(screen.getByText('Always on content')).toBeInTheDocument()
  })
})

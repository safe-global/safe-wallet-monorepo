import React from 'react'
import { render } from '@/tests/test-utils'
import { withRole } from './withRole'
import * as useHasRoles from '../hooks/useHasRoles'
import { Role } from '../config'

describe('withRole', () => {
  const useHasRolesSpy = jest.spyOn(useHasRoles, 'useHasRoles')

  const MockComponent = ({ hasRole, foo }: { hasRole?: boolean; foo?: string }) => (
    <div>
      {hasRole !== undefined && <span>hasRole: {hasRole.toString()}</span>}
      {foo && <span>{foo}</span>}
    </div>
  )

  const WrappedComponent = withRole(MockComponent, Role.Owner)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render WrappedComponent if user has role', () => {
    useHasRolesSpy.mockReturnValue(true)

    const { getByText } = render(<WrappedComponent foo="Hello" />)

    expect(getByText('hasRole: true')).toBeInTheDocument()
    expect(getByText('Hello')).toBeInTheDocument()
    expect(useHasRolesSpy).toHaveBeenCalledWith([Role.Owner], undefined)
  })

  it('should not render WrappedComponent if user does not have role and forceRender is false', () => {
    useHasRolesSpy.mockReturnValue(false)

    const { queryByText } = render(<WrappedComponent foo="Hello" />)

    expect(queryByText('hasRole: false')).not.toBeInTheDocument()
    expect(queryByText('Hello')).not.toBeInTheDocument()
    expect(useHasRolesSpy).toHaveBeenCalledWith([Role.Owner], undefined)
  })

  it('should render WrappedComponent if user does not have role but forceRender is true', () => {
    useHasRolesSpy.mockReturnValue(false)

    const { getByText } = render(<WrappedComponent foo="Hello" forceRender />)

    expect(getByText('hasRole: false')).toBeInTheDocument()
    expect(getByText('Hello')).toBeInTheDocument()
    expect(useHasRolesSpy).toHaveBeenCalledWith([Role.Owner], undefined)
  })

  it('should pass exclusive prop to useHasRoles', () => {
    useHasRolesSpy.mockReturnValue(true)

    const { getByText } = render(<WrappedComponent foo="Hello" exclusive />)

    expect(getByText('hasRole: true')).toBeInTheDocument()
    expect(getByText('Hello')).toBeInTheDocument()
    expect(useHasRolesSpy).toHaveBeenCalledWith([Role.Owner], true)
  })
})

import React from 'react'
import { render } from '@/tests/test-utils'
import { withPermission } from './withPermission'
import * as useHasPermission from '../hooks/useHasPermission'
import { Permission } from '../config'

describe('withPermission', () => {
  const useHasPermissionSpy = jest.spyOn(useHasPermission, 'useHasPermission')

  const MockComponent = ({ hasPermission, foo }: { hasPermission?: boolean; foo?: string }) => (
    <div>
      {hasPermission !== undefined && <span>hasPermission: {hasPermission.toString()}</span>}
      {foo && <span>{foo}</span>}
    </div>
  )

  const WrappedComponent = withPermission(MockComponent, Permission.ProposeTransaction)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render WrappedComponent if user has permission', () => {
    useHasPermissionSpy.mockReturnValue(true)

    const { getByText } = render(<WrappedComponent foo="Hello" />)

    expect(getByText('hasPermission: true')).toBeInTheDocument()
    expect(getByText('Hello')).toBeInTheDocument()
    expect(useHasPermissionSpy).toHaveBeenCalledWith(Permission.ProposeTransaction)
  })

  it('should not render WrappedComponent if user does not have permission and forceRender is false', () => {
    useHasPermissionSpy.mockReturnValue(false)

    const { queryByText } = render(<WrappedComponent foo="Hello" />)

    expect(queryByText('hasPermission: false')).not.toBeInTheDocument()
    expect(queryByText('Hello')).not.toBeInTheDocument()
    expect(useHasPermissionSpy).toHaveBeenCalledWith(Permission.ProposeTransaction)
  })

  it('should render WrappedComponent if user does not have permission but forceRender is true', () => {
    useHasPermissionSpy.mockReturnValue(false)

    const { getByText } = render(<WrappedComponent foo="Hello" forceRender />)

    expect(getByText('hasPermission: false')).toBeInTheDocument()
    expect(getByText('Hello')).toBeInTheDocument()
    expect(useHasPermissionSpy).toHaveBeenCalledWith(Permission.ProposeTransaction)
  })

  it('should pass permissionProps to useHasPermission', () => {
    const permissionProps = { someProp: 'value' }
    useHasPermissionSpy.mockReturnValue(true)

    const { getByText } = render(<WrappedComponent foo="Hello" permissionProps={permissionProps as any} />)

    expect(getByText('hasPermission: true')).toBeInTheDocument()
    expect(getByText('Hello')).toBeInTheDocument()
    expect(useHasPermissionSpy).toHaveBeenCalledWith(Permission.ProposeTransaction, permissionProps)
  })
})

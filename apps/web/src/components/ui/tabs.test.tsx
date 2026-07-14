import { render, screen } from '@testing-library/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

describe('TabsList', () => {
  it('renders the segmented variant on a paper track', () => {
    render(
      <Tabs defaultValue="accounts">
        <TabsList data-testid="list" variant="segmented">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts">Accounts panel</TabsContent>
        <TabsContent value="workspaces">Workspaces panel</TabsContent>
      </Tabs>,
    )

    const list = screen.getByTestId('list')
    expect(list).toHaveAttribute('data-variant', 'segmented')
    expect(list).toHaveClass('bg-[var(--color-background-paper)]', 'p-1', 'h-auto', 'gap-1')
    // the default muted track must not leak into the segmented variant
    expect(list).not.toHaveClass('bg-muted')
  })

  it('defaults to the muted track', () => {
    render(
      <Tabs defaultValue="one">
        <TabsList data-testid="list">
          <TabsTrigger value="one">One</TabsTrigger>
        </TabsList>
        <TabsContent value="one">One panel</TabsContent>
      </Tabs>,
    )

    const list = screen.getByTestId('list')
    expect(list).toHaveAttribute('data-variant', 'default')
    expect(list).toHaveClass('bg-muted')
  })
})

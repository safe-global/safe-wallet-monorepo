import { render, screen } from '@testing-library/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

describe('TabsList', () => {
  it('renders the toggle lg look on a muted track', () => {
    render(
      <Tabs defaultValue="accounts">
        <TabsList data-testid="list" variant="toggle" size="lg">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts">Accounts panel</TabsContent>
        <TabsContent value="workspaces">Workspaces panel</TabsContent>
      </Tabs>,
    )

    const list = screen.getByTestId('list')
    expect(list).toHaveAttribute('data-variant', 'segmented')
    // large segmented switch: a muted track with a roomy gutter (vs the compact default track)
    expect(list).toHaveClass('bg-muted', 'p-1', 'h-auto', 'gap-1')
  })

  it('renders the underline brand look for page nav', () => {
    render(
      <Tabs defaultValue="assets">
        <TabsList data-testid="list" variant="underline" tone="brand">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="assets">Assets panel</TabsContent>
        <TabsContent value="settings">Settings panel</TabsContent>
      </Tabs>,
    )

    const list = screen.getByTestId('list')
    expect(list).toHaveAttribute('data-variant', 'nav')
    expect(list).not.toHaveClass('bg-muted')
  })

  it('renders the underline neutral look by default', () => {
    render(
      <Tabs defaultValue="members">
        <TabsList data-testid="list" variant="underline">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
        <TabsContent value="members">Members panel</TabsContent>
        <TabsContent value="pending">Pending panel</TabsContent>
      </Tabs>,
    )

    const list = screen.getByTestId('list')
    expect(list).toHaveAttribute('data-variant', 'line')
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

import { render, screen } from '@testing-library/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

describe('TabsList', () => {
  it('maps the toggle variant to the segmented track', () => {
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
  })

  it('maps the underline brand variant to page nav', () => {
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
  })

  it('maps the underline variant to the neutral line by default', () => {
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

  it('spaces nav triggers with padding and keeps the first one flush left', () => {
    render(
      <Tabs defaultValue="assets">
        <TabsList data-testid="list" variant="underline" tone="brand">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="assets">Assets panel</TabsContent>
      </Tabs>,
    )

    expect(screen.getByTestId('list').className).not.toMatch(/(^|\s)gap-/)
    expect(screen.getByRole('tab', { name: 'Assets' })).toHaveClass(
      'group-data-[variant=nav]/tabs-list:px-6',
      'group-data-[variant=nav]/tabs-list:first:pl-0',
    )
  })

  it('scrolls nav tabs that do not fit instead of overflowing the page', () => {
    render(
      <Tabs defaultValue="assets">
        <TabsList data-testid="list" variant="underline" tone="brand">
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>
        <TabsContent value="assets">Assets panel</TabsContent>
      </Tabs>,
    )

    const list = screen.getByTestId('list')
    expect(list).toHaveClass('w-full', 'min-w-0', 'overflow-x-auto', 'justify-start')
    expect(list.className).not.toMatch(/(^|\s)w-fit(\s|$)/)
  })

  it('maps underline brand lg to text-width nav tabs', () => {
    render(
      <Tabs defaultValue="queue">
        <TabsList data-testid="list" variant="underline" tone="brand" size="lg">
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="queue">Queue panel</TabsContent>
      </Tabs>,
    )

    const list = screen.getByTestId('list')
    expect(list).toHaveAttribute('data-variant', 'nav-lg')
    expect(list).toHaveClass(
      'gap-8',
      'w-auto',
      'min-w-0',
      'justify-start',
      'group-data-horizontal/tabs:h-11',
      'overflow-x-auto',
    )
    expect(list.className).not.toMatch(/(^|\s)(w-fit|w-full|justify-center|group-data-horizontal\/tabs:h-9)(\s|$)/)
    expect(screen.getByRole('tab', { name: 'Queue' })).toHaveClass(
      'group-data-[variant=nav-lg]/tabs-list:h-11',
      'group-data-[variant=nav-lg]/tabs-list:flex-none',
      'group-data-[variant=nav-lg]/tabs-list:items-end',
      'group-data-[variant=nav-lg]/tabs-list:px-0',
      'group-data-[variant=nav-lg]/tabs-list:pb-2.5',
      'group-data-[variant=nav-lg]/tabs-list:focus-visible:-outline-offset-1',
    )
    expect(screen.getByRole('tab', { name: 'Queue' }).className).not.toMatch(/nav-lg\]\/tabs-list:font-bold/)
  })

  it('keeps underline brand on the bold nav look when no size is set', () => {
    render(
      <Tabs defaultValue="assets">
        <TabsList data-testid="list" variant="underline" tone="brand">
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>
        <TabsContent value="assets">Assets panel</TabsContent>
      </Tabs>,
    )

    const list = screen.getByTestId('list')
    expect(list).toHaveAttribute('data-variant', 'nav')
    expect(list).toHaveClass('w-full', 'h-auto')
    expect(list).not.toHaveClass('gap-8')
    expect(screen.getByRole('tab', { name: 'Assets' })).toHaveClass(
      'group-data-[variant=nav]/tabs-list:font-bold',
      'group-data-[variant=nav]/tabs-list:px-6',
    )
  })

  it('ignores size lg on the neutral underline', () => {
    render(
      <Tabs defaultValue="members">
        <TabsList data-testid="list" variant="underline" size="lg">
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="members">Members panel</TabsContent>
      </Tabs>,
    )

    expect(screen.getByTestId('list')).toHaveAttribute('data-variant', 'line')
  })

  it('defaults to the default variant', () => {
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
  })
})

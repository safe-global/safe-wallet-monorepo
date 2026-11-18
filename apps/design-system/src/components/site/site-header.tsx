'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Github, Menu, Search } from 'lucide-react'
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch'
import { useSearchContext } from 'fumadocs-ui/contexts/search'
import { Button } from '@safe-global/ui/primitives/button'
import { Kbd, KbdGroup } from '@safe-global/ui/primitives/kbd'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@safe-global/ui/primitives/sheet'
import { cn } from '@safe-global/ui/utils'
import { GITHUB_URL, NAV_ITEMS, isActive } from '@/lib/site'
import { Logo } from './logo'

function SearchBox() {
  const { setOpenSearch } = useSearchContext()
  return (
    <button
      type="button"
      onClick={() => setOpenSearch(true)}
      className="hidden h-8 w-64 items-center gap-2 whitespace-nowrap rounded-lg border bg-muted/60 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
      data-search-box
    >
      <Search className="size-4" aria-hidden />
      <span className="flex-1 truncate text-left">Search documentation…</span>
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </button>
  )
}

function NavLinks({
  pathname,
  onNavigate,
  vertical,
}: {
  pathname: string
  onNavigate?: () => void
  vertical?: boolean
}) {
  return (
    <nav aria-label="Main" className={cn('flex', vertical ? 'flex-col gap-1' : 'items-center gap-1')}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item, pathname)
        return (
          <Link
            key={item.title}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md text-sm transition-colors hover:text-foreground',
              vertical ? 'px-2 py-2 text-base' : 'px-2.5 py-1.5',
              active ? 'font-medium text-foreground' : 'text-muted-foreground',
            )}
          >
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const { setOpenSearch } = useSearchContext()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40 h-(--site-header-height) w-full border-b bg-background/80 backdrop-blur-md"
      data-site-header
    >
      <div className="mx-auto flex h-full max-w-(--site-max-width) items-center gap-4 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu />
        </Button>
        <Logo />
        <div className="hidden lg:block">
          <NavLinks pathname={pathname} />
        </div>
        <div className="ms-auto flex items-center gap-2">
          <SearchBox />
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Search documentation"
            onClick={() => setOpenSearch(true)}
          >
            <Search />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="GitHub repository"
            render={<a href={GITHUB_URL} target="_blank" rel="noreferrer" />}
            nativeButton={false}
          >
            <Github />
          </Button>
          <ThemeSwitch className="hidden sm:inline-flex" />
          <span className="brand hidden sm:inline-flex">
            <Button size="sm" render={<Link href="/create/" />} nativeButton={false}>
              New project
            </Button>
          </span>
        </div>
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" data-mobile-menu>
          <SheetHeader>
            <SheetTitle>
              <Logo />
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 px-4">
            <NavLinks pathname={pathname} vertical onNavigate={() => setMenuOpen(false)} />
            <div className="flex items-center justify-between">
              <ThemeSwitch />
              <span className="brand inline-flex">
                <Button
                  size="sm"
                  render={<Link href="/create/" />}
                  nativeButton={false}
                  onClick={() => setMenuOpen(false)}
                >
                  New project
                </Button>
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

import { createRef, useRef, type ReactNode, type RefObject } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../dialog'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../sheet'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'

const CopyButton = () => <button type="button">Copy to clipboard</button>

describe('popup initial focus', () => {
  describe.each([
    {
      name: 'DialogContent',
      Wrapper: ({ children, initialFocus }: { children: ReactNode; initialFocus?: RefObject<HTMLElement | null> }) => (
        <Dialog open>
          <DialogContent showCloseButton={false} initialFocus={initialFocus}>
            <DialogTitle>Title</DialogTitle>
            {children}
          </DialogContent>
        </Dialog>
      ),
    },
    {
      name: 'SheetContent',
      Wrapper: ({ children, initialFocus }: { children: ReactNode; initialFocus?: RefObject<HTMLElement | null> }) => (
        <Sheet open>
          <SheetContent showCloseButton={false} initialFocus={initialFocus}>
            <SheetTitle>Title</SheetTitle>
            {children}
          </SheetContent>
        </Sheet>
      ),
    },
    {
      name: 'PopoverContent',
      Wrapper: ({ children, initialFocus }: { children: ReactNode; initialFocus?: RefObject<HTMLElement | null> }) => (
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent initialFocus={initialFocus}>{children}</PopoverContent>
        </Popover>
      ),
    },
  ])('$name', ({ Wrapper }) => {
    it('focuses the popup itself, not its first control', async () => {
      render(
        <Wrapper>
          <CopyButton />
        </Wrapper>,
      )

      await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus())
      expect(screen.getByRole('button', { name: 'Copy to clipboard' })).not.toHaveFocus()
    })

    it('focuses the element that initialFocus names', async () => {
      const WithTarget = () => {
        const confirmRef = useRef<HTMLButtonElement>(null)
        return (
          <Wrapper initialFocus={confirmRef}>
            <CopyButton />
            <button type="button" ref={confirmRef}>
              Confirm
            </button>
          </Wrapper>
        )
      }
      render(<WithTarget />)

      await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus())
    })

    it('keeps the focus on an autoFocus input', async () => {
      render(
        <Wrapper>
          <CopyButton />
          <input aria-label="Name" autoFocus />
        </Wrapper>,
      )

      await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus())
    })
  })

  it("still hands the popup to the caller's ref", async () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent ref={ref}>
          <CopyButton />
        </PopoverContent>
      </Popover>,
    )

    await waitFor(() => expect(ref.current).toBe(screen.getByRole('dialog')))
  })

  describe.each([
    {
      name: 'DialogContent',
      Opener: () => (
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Title</DialogTitle>
            <CopyButton />
          </DialogContent>
        </Dialog>
      ),
    },
    {
      name: 'SheetContent',
      Opener: () => (
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent showCloseButton={false}>
            <SheetTitle>Title</SheetTitle>
            <CopyButton />
          </SheetContent>
        </Sheet>
      ),
    },
    {
      name: 'PopoverContent',
      Opener: () => (
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <CopyButton />
          </PopoverContent>
        </Popover>
      ),
    },
  ])('$name opened from the keyboard', ({ Opener }) => {
    it('focuses its first control, so a keyboard user can act at once', async () => {
      const user = userEvent.setup()
      render(<Opener />)

      await user.tab()
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
      await user.keyboard('{Enter}')

      await waitFor(() => expect(screen.getByRole('button', { name: 'Copy to clipboard' })).toHaveFocus())
    })
  })
})

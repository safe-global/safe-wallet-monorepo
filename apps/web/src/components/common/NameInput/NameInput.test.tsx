import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { type ReactNode } from 'react'
import { DISALLOWED_CHARACTER_MESSAGE, DISALLOWED_CHARACTER_SHORT_MESSAGE } from '@safe-global/utils/validation/names'
import NameInput from './index'

const Wrapper = ({ children, defaultName = '' }: { children: ReactNode; defaultName?: string }) => {
  const methods = useForm({ mode: 'onChange', defaultValues: { name: defaultName } })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('NameInput', () => {
  describe('without validateCharset (legacy behavior)', () => {
    it('does not reject disallowed characters', async () => {
      render(
        <Wrapper>
          <NameInput name="name" label="Name" />
        </Wrapper>,
      )

      const input = screen.getByRole('textbox', { name: 'Name' })
      // A plain disallowed charset character (not script injection, which the shadcn Input sanitizes separately).
      fireEvent.change(input, { target: { value: 'Alice~' } })

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true')
      })
      expect(screen.queryByText(DISALLOWED_CHARACTER_SHORT_MESSAGE)).not.toBeInTheDocument()
    })

    it('shows the "Maximum 50 symbols" label above 50 characters', async () => {
      render(
        <Wrapper>
          <NameInput name="name" label="Name" />
        </Wrapper>,
      )

      const input = screen.getByRole('textbox', { name: 'Name' })
      fireEvent.change(input, { target: { value: 'a'.repeat(51) } })

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: 'Maximum 50 symbols' })).toBeInTheDocument()
      })
    })

    it('trims the value on blur', async () => {
      render(
        <Wrapper>
          <NameInput name="name" label="Name" />
        </Wrapper>,
      )

      const input = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement
      fireEvent.change(input, { target: { value: '  Alice  ' } })
      fireEvent.blur(input)

      await waitFor(() => {
        expect(input.value).toBe('Alice')
      })
    })
  })

  describe('with validateCharset', () => {
    it('rejects disallowed characters with a short label and full tooltip', async () => {
      render(
        <Wrapper>
          <NameInput name="name" label="Name" validateCharset />
        </Wrapper>,
      )

      const input = screen.getByRole('textbox', { name: 'Name' })
      // A plain disallowed charset character (not script injection, which the shadcn Input sanitizes separately).
      fireEvent.change(input, { target: { value: 'Alice~' } })

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true')
      })
      expect(input).toHaveAccessibleName('Name')
      expect(screen.getByTitle(DISALLOWED_CHARACTER_MESSAGE)).toBeInTheDocument()
      expect(screen.getByText(DISALLOWED_CHARACTER_SHORT_MESSAGE)).toBeInTheDocument()
    })

    it('accepts a valid UTF-8 name', async () => {
      render(
        <Wrapper>
          <NameInput name="name" label="Name" validateCharset />
        </Wrapper>,
      )

      const input = screen.getByRole('textbox', { name: 'Name' })
      fireEvent.change(input, { target: { value: 'José' } })

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true')
      })
      expect(screen.queryByText(DISALLOWED_CHARACTER_SHORT_MESSAGE)).not.toBeInTheDocument()
    })

    it('enforces minLength only when provided', async () => {
      render(
        <Wrapper>
          <NameInput name="name" label="Name" validateCharset minLength={3} />
        </Wrapper>,
      )

      const input = screen.getByRole('textbox', { name: 'Name' })
      fireEvent.change(input, { target: { value: 'Jo' } })

      await waitFor(() => {
        expect(screen.getByText('Names must be at least 3 character(s) long')).toBeInTheDocument()
      })
    })

    it('enforces maxLength', async () => {
      render(
        <Wrapper>
          <NameInput name="name" label="Name" validateCharset maxLength={5} />
        </Wrapper>,
      )

      const input = screen.getByRole('textbox', { name: 'Name' })
      fireEvent.change(input, { target: { value: 'abcdef' } })

      await waitFor(() => {
        expect(screen.getByText('Names must be at most 5 characters long')).toBeInTheDocument()
      })
    })

    it('sanitizes the value on blur', async () => {
      render(
        <Wrapper>
          <NameInput name="name" label="Name" validateCharset />
        </Wrapper>,
      )

      const input = screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement
      fireEvent.change(input, { target: { value: '  O’Brien  ' } })
      fireEvent.blur(input)

      await waitFor(() => {
        expect(input.value).toBe("O'Brien")
      })
    })

    it('shows Required when a required field is cleared', async () => {
      render(
        <Wrapper defaultName="Alice">
          <NameInput name="name" label="Name" validateCharset required />
        </Wrapper>,
      )

      const input = screen.getByRole('textbox', { name: 'Name' })
      fireEvent.change(input, { target: { value: '' } })

      await waitFor(() => {
        expect(screen.getByText('Required')).toBeInTheDocument()
      })
      expect(input).toHaveAccessibleName('Name')
    })
  })
})

import { NAME_MIN_LENGTH, DISALLOWED_CHARACTER_MESSAGE } from '@safe-global/utils/validation/names'
import { useForm, FormProvider } from 'react-hook-form'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import NameInput from '.'

const TestForm = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({ mode: 'onChange', defaultValues: { name: '' } })
  return <FormProvider {...methods}>{children}</FormProvider>
}

const renderNameInput = (props: Partial<React.ComponentProps<typeof NameInput>> = {}) =>
  render(
    <TestForm>
      <NameInput name="name" label="Name" {...props} />
    </TestForm>,
  )

const typeName = (value: string) => {
  const input = screen.getByLabelText('Name', { exact: false })
  fireEvent.change(input, { target: { value } })
  return input
}

describe('NameInput', () => {
  it('accepts a valid name', async () => {
    renderNameInput({ minLength: NAME_MIN_LENGTH })
    typeName('Alice')

    await waitFor(() => {
      expect(screen.queryByText(DISALLOWED_CHARACTER_MESSAGE)).not.toBeInTheDocument()
    })
  })

  it('shows the disallowed-character message for invalid input', async () => {
    renderNameInput({ minLength: NAME_MIN_LENGTH })
    typeName('Alice<script>')

    expect((await screen.findAllByText(DISALLOWED_CHARACTER_MESSAGE)).length).toBeGreaterThan(0)
  })

  it('enforces the minimum length when minLength is set', async () => {
    renderNameInput({ minLength: NAME_MIN_LENGTH })
    typeName('Jo')

    expect((await screen.findAllByText('Names must be at least 3 character(s) long')).length).toBeGreaterThan(0)
  })

  it('does not enforce a minimum length by default', async () => {
    renderNameInput()
    typeName('Jo')

    await waitFor(() => {
      expect(screen.queryByText(/at least/)).not.toBeInTheDocument()
    })
  })

  it('enforces the maximum length', async () => {
    renderNameInput({ maxLength: 5 })
    typeName('abcdef')

    expect((await screen.findAllByText('Names must be at most 5 characters long')).length).toBeGreaterThan(0)
  })

  it('sanitizes the value on blur', async () => {
    renderNameInput()
    const input = typeName('  O’Brien  ') as HTMLInputElement
    fireEvent.blur(input)

    await waitFor(() => {
      expect(input.value).toBe("O'Brien")
    })
  })

  it('shows Required when empty and required', async () => {
    renderNameInput({ required: true })
    const input = typeName('abc')
    fireEvent.change(input, { target: { value: '' } })

    expect((await screen.findAllByText('Required')).length).toBeGreaterThan(0)
  })
})

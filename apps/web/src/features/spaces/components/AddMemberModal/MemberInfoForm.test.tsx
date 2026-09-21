import { render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import MemberInfoForm from './MemberInfoForm'
import { MemberRole } from '@/features/spaces'

const Wrapper = () => {
  const methods = useForm({ defaultValues: { name: '', role: MemberRole.MEMBER } })
  return (
    <FormProvider {...methods}>
      <MemberInfoForm />
    </FormProvider>
  )
}

describe('MemberInfoForm', () => {
  it('renders the name field and the role select', () => {
    render(<Wrapper />)

    expect(screen.getByTestId('member-name-input')).toBeInTheDocument()
    expect(screen.getByLabelText('Role')).toBeInTheDocument()
  })

  // Both consumers (Add member, Edit member) are ModalDialogs. A select backdrop paints above the
  // dialog, so it would blur the form the dropdown belongs to — the dialog's own backdrop already
  // dims the page, locks scroll and handles the outside click.
  it('does not add a second scrim on top of the dialog it lives in', () => {
    render(<Wrapper />)

    expect(document.querySelector('[data-slot="select-backdrop"]')).toBeNull()
  })
})

import { render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import type { ReactNode } from 'react'

import NameInput from './index'

const FormWrapper = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: { name: '' } })

  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('NameInput rendering', () => {
  it('passes inputSize and variant to a plain input', () => {
    render(
      <FormWrapper>
        <NameInput name="name" label="Name" inputSize="hero" variant="surface" />
      </FormWrapper>,
    )

    expect(screen.getByLabelText('Name')).toHaveClass('h-[66px]', 'bg-card')
  })

  it('passes inputSize and variant to an adorned input group', () => {
    const { container } = render(
      <FormWrapper>
        <NameInput name="name" label="Name" inputSize="hero" variant="surface" InputProps={{ endAdornment: 'ETH' }} />
      </FormWrapper>,
    )

    expect(container.querySelector('[data-slot="input-group"]')).toHaveClass('h-[66px]', 'bg-card')
  })
})

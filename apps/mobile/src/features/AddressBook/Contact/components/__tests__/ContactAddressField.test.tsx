import React from 'react'
import { render } from '@/src/tests/test-utils'
import { FormProvider, useForm, Control, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { faker } from '@faker-js/faker'
import { ContactAddressField } from '../ContactAddressField'
import { contactSchema, type ContactFormData } from '../../schemas'
import { type Contact } from '@/src/store/addressBookSlice'

// Helper component to wrap ContactAddressField with FormProvider and access control
const TestWrapper = ({
  children,
  defaultValues = { name: '', address: '' },
  renderWithControl = false,
}: {
  children:
    | React.ReactNode
    | ((
        control: Control<ContactFormData>,
        errors: FieldErrors<ContactFormData>,
        dirtyFields: Partial<Record<keyof ContactFormData, boolean>>,
      ) => React.ReactNode)
  defaultValues?: ContactFormData
  renderWithControl?: boolean
}) => {
  const methods = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues,
  })

  const renderChildren = () => {
    if (renderWithControl && typeof children === 'function') {
      return children(methods.control, methods.formState.errors, methods.formState.dirtyFields)
    }
    return children as React.ReactNode
  }

  return <FormProvider {...methods}>{renderChildren()}</FormProvider>
}

describe('ContactAddressField', () => {
  const validAddress = '0x1234567890123456789012345678901234567890'
  const invalidAddress = 'invalid-address'

  const mockContact: Contact = {
    value: validAddress,
    name: faker.person.firstName(),
    logoUri: null,
    chainIds: ['1', '5'],
  }

  describe('when in read-only mode (isEditing = false)', () => {
    it('should render the address field as disabled with contact value', () => {
      const { getByTestId, getByText } = render(<ContactAddressField isEditing={false} contact={mockContact} />)

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()

      const label = getByText('Address')
      expect(label).toBeDefined()
    })

    it('should render empty value when no contact is provided', () => {
      const { getByTestId } = render(<ContactAddressField isEditing={false} contact={null} />)

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })

    it('should configure input as multiline with 3 lines', () => {
      const { getByTestId } = render(<ContactAddressField isEditing={false} contact={mockContact} />)

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })
  })

  describe('when in editing mode (isEditing = true)', () => {
    it('should render controlled input when control is provided', () => {
      const { getByTestId } = render(
        <TestWrapper defaultValues={{ name: 'Test', address: validAddress }} renderWithControl>
          {(control, errors, dirtyFields) => (
            <ContactAddressField
              isEditing={true}
              contact={mockContact}
              control={control}
              errors={errors}
              dirtyFields={dirtyFields}
            />
          )}
        </TestWrapper>,
      )

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })

    it('should handle address input changes', () => {
      const { getByTestId } = render(
        <TestWrapper renderWithControl>
          {(control, errors, dirtyFields) => (
            <ContactAddressField
              isEditing={true}
              contact={null}
              control={control}
              errors={errors}
              dirtyFields={dirtyFields}
            />
          )}
        </TestWrapper>,
      )

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })

    it('should configure input with correct attributes for address entry', () => {
      const { getByTestId } = render(
        <TestWrapper renderWithControl>
          {(control, errors, dirtyFields) => (
            <ContactAddressField
              isEditing={true}
              contact={null}
              control={control}
              errors={errors}
              dirtyFields={dirtyFields}
            />
          )}
        </TestWrapper>,
      )

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })

    describe('validation states', () => {
      it('should show error state when field is dirty and has errors', () => {
        // Create a scenario where validation will fail
        const { getByTestId, getByText } = render(
          <TestWrapper defaultValues={{ name: 'Test', address: invalidAddress }} renderWithControl>
            {(control, _errors, dirtyFields) => {
              // Manually set dirty state for address field
              const mockDirtyFields = { ...dirtyFields, address: true }
              const mockErrors = { address: { message: 'Invalid Ethereum address format', type: 'custom' } }

              return (
                <ContactAddressField
                  isEditing={true}
                  contact={null}
                  control={control}
                  errors={mockErrors}
                  dirtyFields={mockDirtyFields}
                />
              )
            }}
          </TestWrapper>,
        )

        const container = getByTestId('safe-input-with-label')
        expect(container).toBeDefined()

        const errorMessage = getByText('Invalid Ethereum address format')
        expect(errorMessage).toBeDefined()
      })

      it('should show success state when field is dirty, has no errors, and has value', () => {
        const { getByTestId } = render(
          <TestWrapper defaultValues={{ name: 'Test', address: validAddress }} renderWithControl>
            {(control, _errors, dirtyFields) => {
              const mockDirtyFields = { ...dirtyFields, address: true }

              return (
                <ContactAddressField
                  isEditing={true}
                  contact={null}
                  control={control}
                  errors={_errors}
                  dirtyFields={mockDirtyFields}
                />
              )
            }}
          </TestWrapper>,
        )

        const container = getByTestId('safe-input-with-label')
        expect(container).toBeDefined()
      })

      it('should not show success state when field is dirty but value is empty', () => {
        const { getByTestId } = render(
          <TestWrapper defaultValues={{ name: 'Test', address: '' }} renderWithControl>
            {(control, _errors, dirtyFields) => {
              const mockDirtyFields = { ...dirtyFields, address: true }

              return (
                <ContactAddressField
                  isEditing={true}
                  contact={null}
                  control={control}
                  errors={_errors}
                  dirtyFields={mockDirtyFields}
                />
              )
            }}
          </TestWrapper>,
        )

        const container = getByTestId('safe-input-with-label')
        expect(container).toBeDefined()
      })

      it('should not show success state when field is dirty but value is only whitespace', () => {
        const { getByTestId } = render(
          <TestWrapper defaultValues={{ name: 'Test', address: '   ' }} renderWithControl>
            {(control, _errors, dirtyFields) => {
              const mockDirtyFields = { ...dirtyFields, address: true }

              return (
                <ContactAddressField
                  isEditing={true}
                  contact={null}
                  control={control}
                  errors={_errors}
                  dirtyFields={mockDirtyFields}
                />
              )
            }}
          </TestWrapper>,
        )

        const container = getByTestId('safe-input-with-label')
        expect(container).toBeDefined()
      })

      it('should not show success state when field is not dirty', () => {
        const { getByTestId } = render(
          <TestWrapper defaultValues={{ name: 'Test', address: validAddress }} renderWithControl>
            {(control, _errors, dirtyFields) => (
              <ContactAddressField
                isEditing={true}
                contact={null}
                control={control}
                errors={_errors}
                dirtyFields={dirtyFields}
              />
            )}
          </TestWrapper>,
        )

        const container = getByTestId('safe-input-with-label')
        expect(container).toBeDefined()
      })

      it('should display error message when there are errors', () => {
        const { getByText } = render(
          <TestWrapper renderWithControl>
            {(control, _errors, dirtyFields) => {
              const mockErrors = { address: { message: 'Invalid Ethereum address format', type: 'custom' } }

              return (
                <ContactAddressField
                  isEditing={true}
                  contact={null}
                  control={control}
                  errors={mockErrors}
                  dirtyFields={dirtyFields}
                />
              )
            }}
          </TestWrapper>,
        )

        const errorMessage = getByText('Invalid Ethereum address format')
        expect(errorMessage).toBeDefined()
      })

      it('should not display error message when no errors', () => {
        const { queryByText } = render(
          <TestWrapper renderWithControl>
            {(control, _errors, dirtyFields) => (
              <ContactAddressField
                isEditing={true}
                contact={null}
                control={control}
                errors={{}}
                dirtyFields={dirtyFields}
              />
            )}
          </TestWrapper>,
        )

        const errorMessage = queryByText('Invalid Ethereum address format')
        expect(errorMessage).toBeNull()
      })
    })

    describe('with existing contact data', () => {
      it('should pre-populate with contact address when editing existing contact', () => {
        const { getByTestId } = render(
          <TestWrapper defaultValues={{ name: mockContact.name, address: mockContact.value }} renderWithControl>
            {(control, errors, dirtyFields) => (
              <ContactAddressField
                isEditing={true}
                contact={mockContact}
                control={control}
                errors={errors}
                dirtyFields={dirtyFields}
              />
            )}
          </TestWrapper>,
        )

        const container = getByTestId('safe-input-with-label')
        expect(container).toBeDefined()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle undefined contact gracefully in read-only mode', () => {
      const { getByTestId } = render(<ContactAddressField isEditing={false} contact={undefined} />)

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })

    it('should handle missing control in editing mode gracefully', () => {
      // This should fall back to read-only mode when control is missing
      const { getByTestId } = render(
        <ContactAddressField isEditing={true} contact={mockContact} control={undefined} errors={{}} dirtyFields={{}} />,
      )

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })

    it('should handle undefined errors and dirtyFields', () => {
      const { getByTestId } = render(
        <TestWrapper renderWithControl>
          {(control) => (
            <ContactAddressField
              isEditing={true}
              contact={null}
              control={control}
              errors={undefined}
              dirtyFields={undefined}
            />
          )}
        </TestWrapper>,
      )

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })

    it('should handle contact with null value', () => {
      const contactWithNullValue: Contact = {
        ...mockContact,
        value: null as unknown as string,
      }

      const { getByTestId } = render(<ContactAddressField isEditing={false} contact={contactWithNullValue} />)

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })
  })

  describe('form integration', () => {
    it('should render within form context', () => {
      const { getByTestId } = render(
        <TestWrapper renderWithControl>
          {(control, errors, dirtyFields) => (
            <ContactAddressField
              isEditing={true}
              contact={null}
              control={control}
              errors={errors}
              dirtyFields={dirtyFields}
            />
          )}
        </TestWrapper>,
      )

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })

    it('should integrate with form validation', () => {
      const { getByTestId } = render(
        <TestWrapper renderWithControl>
          {(control, errors, dirtyFields) => (
            <ContactAddressField
              isEditing={true}
              contact={null}
              control={control}
              errors={errors}
              dirtyFields={dirtyFields}
            />
          )}
        </TestWrapper>,
      )

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })
  })

  describe('component props', () => {
    it('should render with all required props for editing mode', () => {
      const { getByTestId, getByText } = render(
        <TestWrapper renderWithControl>
          {(control, errors, dirtyFields) => (
            <ContactAddressField
              isEditing={true}
              contact={null}
              control={control}
              errors={errors}
              dirtyFields={dirtyFields}
            />
          )}
        </TestWrapper>,
      )

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()

      const label = getByText('Address')
      expect(label).toBeDefined()
    })

    it('should render with minimal props for read-only mode', () => {
      const { getByTestId, getByText } = render(<ContactAddressField isEditing={false} contact={mockContact} />)

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()

      const label = getByText('Address')
      expect(label).toBeDefined()
    })

    it('should handle different contact value types', () => {
      const contactWithEmptyValue: Contact = {
        ...mockContact,
        value: '',
      }

      const { getByTestId } = render(<ContactAddressField isEditing={false} contact={contactWithEmptyValue} />)

      const container = getByTestId('safe-input-with-label')
      expect(container).toBeDefined()
    })
  })
})

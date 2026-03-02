import type { Meta, StoryObj } from '@storybook/react'
import { Field, FieldLabel, FieldDescription, FieldError, FieldLegend, FieldSet, FieldContent } from '../field'
import { Input } from '../input'
import { Label } from '../label'
import { Checkbox } from '../checkbox'

/**
 * Field Component Stories
 *
 * Figma: No Figma design available
 */
const meta = {
  title: 'UI/Field',
  component: Field,
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal', 'responsive'],
    },
  },
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div style={{ display: 'block' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Orientations</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <Field orientation="vertical">
              <FieldLabel>
                <Label>Email</Label>
              </FieldLabel>
              <FieldContent>
                <Input type="email" placeholder="Enter email" />
                <FieldDescription>Enter your email address</FieldDescription>
              </FieldContent>
            </Field>
          </div>
          <div style={{ width: '400px' }}>
            <Field orientation="horizontal">
              <FieldLabel>
                <Label>Name</Label>
              </FieldLabel>
              <FieldContent>
                <Input placeholder="Enter name" />
              </FieldContent>
            </Field>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">With Error</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <Field orientation="vertical" data-invalid="true">
              <FieldLabel>
                <Label>Email</Label>
              </FieldLabel>
              <FieldContent>
                <Input type="email" placeholder="Enter email" aria-invalid />
                <FieldError>Please enter a valid email address</FieldError>
              </FieldContent>
            </Field>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Field Set</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <FieldSet>
              <FieldLegend>Notifications</FieldLegend>
              <Field>
                <FieldLabel>
                  <Label>
                    <Checkbox />
                    Email notifications
                  </Label>
                </FieldLabel>
              </Field>
              <Field>
                <FieldLabel>
                  <Label>
                    <Checkbox />
                    Push notifications
                  </Label>
                </FieldLabel>
              </Field>
            </FieldSet>
          </div>
        </div>
      </div>
    </div>
  ),
}

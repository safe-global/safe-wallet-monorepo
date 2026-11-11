import type { Meta, StoryObj } from '@storybook/react'
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
  FieldContent,
  FieldGroup,
  FieldSeparator,
  FieldTitle,
} from '../field'
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
  tags: ['skip-visual-test'],
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
          <div style={{ width: '400px' }}>
            <FieldGroup>
              <Field orientation="responsive">
                <FieldLabel>
                  <Label>Username</Label>
                </FieldLabel>
                <FieldContent>
                  <Input placeholder="Enter username" />
                  <FieldDescription>Stacks below on narrow widths, inline when wide</FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Disabled</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <Field data-disabled="true">
              <FieldLabel>
                <Label>Email</Label>
              </FieldLabel>
              <FieldContent>
                <Input type="email" placeholder="Enter email" disabled />
                <FieldDescription>This field is disabled</FieldDescription>
              </FieldContent>
            </Field>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Field Title</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Marketing emails</FieldTitle>
                <FieldDescription>Receive occasional product updates and offers</FieldDescription>
              </FieldContent>
              <Checkbox />
            </Field>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 className="mb-4 text-lg font-semibold">Separator</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, max-content))',
            gap: '1.5rem',
            justifyItems: 'start',
          }}
        >
          <div style={{ width: '400px' }}>
            <FieldGroup>
              <Field orientation="vertical">
                <FieldLabel>
                  <Label>Email</Label>
                </FieldLabel>
                <FieldContent>
                  <Input type="email" placeholder="Enter email" />
                </FieldContent>
              </Field>
              <FieldSeparator />
              <Field orientation="vertical">
                <FieldLabel>
                  <Label>Password</Label>
                </FieldLabel>
                <FieldContent>
                  <Input type="password" placeholder="Enter password" />
                </FieldContent>
              </Field>
              <FieldSeparator>Or continue with</FieldSeparator>
              <Field orientation="vertical">
                <FieldLabel>
                  <Label>Recovery code</Label>
                </FieldLabel>
                <FieldContent>
                  <Input placeholder="Enter recovery code" />
                </FieldContent>
              </Field>
            </FieldGroup>
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
          <div style={{ width: '400px' }}>
            <Field orientation="vertical" data-invalid="true">
              <FieldLabel>
                <Label>Password</Label>
              </FieldLabel>
              <FieldContent>
                <Input type="password" placeholder="Enter password" aria-invalid />
                <FieldError
                  errors={[
                    { message: 'Must be at least 8 characters' },
                    { message: 'Must contain a number' },
                    { message: 'Must contain a special character' },
                  ]}
                />
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
          <div style={{ width: '400px' }}>
            <FieldSet>
              <FieldLegend variant="label">Privacy (label variant)</FieldLegend>
              <Field>
                <FieldLabel>
                  <Label>
                    <Checkbox />
                    Make profile public
                  </Label>
                </FieldLabel>
              </Field>
              <Field>
                <FieldLabel>
                  <Label>
                    <Checkbox />
                    Show activity status
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

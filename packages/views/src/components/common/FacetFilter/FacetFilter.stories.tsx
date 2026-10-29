import { useState, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FacetOptionList, type FacetOption } from './index'

const categoryOptions: FacetOption[] = [
  { value: 'workspace-safe', label: 'Workspace Safe', count: 4 },
  { value: 'safe', label: 'Safe account', count: 3 },
  { value: 'contract', label: 'Contract', count: 6 },
  { value: 'eoa', label: 'EOA', count: 17 },
]

const tagOptions: FacetOption[] = [
  'Internal',
  'Vendor',
  'Payroll',
  'Investor',
  'Exchange',
  'Auditor',
  'Legal',
  'Marketing',
  'Grants',
  'Treasury ops',
].map((tag, index) => ({ value: tag, label: tag, count: (index * 7) % 13 }))

const Controlled = ({
  initial = [],
  ...props
}: Omit<ComponentProps<typeof FacetOptionList>, 'value' | 'onChange'> & { initial?: string[] }) => {
  const [value, setValue] = useState<string[]>(initial)
  return (
    <div className="border-border w-64 rounded-md border p-1">
      <FacetOptionList {...props} value={value} onChange={setValue} />
    </div>
  )
}

const EditableTags = (props: Omit<ComponentProps<typeof FacetOptionList>, 'value' | 'onChange' | 'options'>) => {
  const [options, setOptions] = useState(tagOptions)
  const [value, setValue] = useState<string[]>(['Vendor'])

  const rename = (from: string, next: string) => {
    if (!next) return 'Tags cannot be empty'
    setOptions((current) =>
      current.map((option) => (option.value === from ? { ...option, value: next, label: next } : option)),
    )
    setValue((current) => current.map((tag) => (tag === from ? next : tag)))
    return undefined
  }

  const remove = (tag: string) => {
    setOptions((current) => current.filter((option) => option.value !== tag))
    setValue((current) => current.filter((v) => v !== tag))
  }

  return (
    <div className="border-border w-64 rounded-md border p-1">
      <FacetOptionList
        {...props}
        options={options}
        value={value}
        onChange={setValue}
        onRenameOption={rename}
        onDeleteOption={remove}
        deleteConfirmation={(option) => `Remove ‘${option.value}’ from ${option.count ?? 0} contacts?`}
      />
    </div>
  )
}

const meta = {
  title: 'Components/Common/FacetOptionList',
  component: FacetOptionList,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FacetOptionList>

export default meta
type Story = StoryObj<typeof meta>

/** Three fixed options, no search box: the Role and Type dropdowns. */
export const Role: Story = {
  args: { label: 'Category', options: categoryOptions, value: [], onChange: () => {} },
  render: (args) => <Controlled {...args} />,
}

export const WithSelection: Story = {
  args: { label: 'Category', options: categoryOptions, value: [], onChange: () => {} },
  render: (args) => <Controlled {...args} initial={['safe', 'signer']} />,
}

/** A long list gets a search box automatically; `onCreate` adds the "Create '…'" row of the tag picker. */
export const SearchableWithCreate: Story = {
  args: { label: 'Tags', options: tagOptions, value: [], onChange: () => {}, onCreate: () => {} },
  render: (args) => <Controlled {...args} initial={['Internal']} searchPlaceholder="Search or create a tag" />,
}

/** Hover an option to rename or delete it in place: the workspace Tags filter for admins. */
export const EditableOptions: Story = {
  args: { label: 'Tags', options: tagOptions, value: [], onChange: () => {} },
  render: (args) => <EditableTags label={args.label} searchPlaceholder="Search tags" />,
}

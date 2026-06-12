import NameInput from '@/components/common/NameInput'
import { Controller, useFormContext } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RoleMenuItem } from './index'
import { MemberRole } from '@/features/spaces'

const MemberInfoForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const { control } = useFormContext()

  return (
    <div className="flex flex-row items-center gap-4">
      <NameInput data-testid="member-name-input" name="name" label="Name" required disabled={isEdit} />

      <Controller
        control={control}
        name="role"
        defaultValue={MemberRole.MEMBER}
        render={({ field: { value, onChange } }) => (
          <Select value={value} onValueChange={onChange} required>
            <SelectTrigger className="min-w-[150px] py-1">
              <SelectValue>{(role) => <RoleMenuItem role={role as MemberRole} />}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MemberRole.ADMIN}>
                <RoleMenuItem role={MemberRole.ADMIN} hasDescription />
              </SelectItem>
              <SelectItem value={MemberRole.MEMBER}>
                <RoleMenuItem role={MemberRole.MEMBER} hasDescription />
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      />
    </div>
  )
}

export default MemberInfoForm

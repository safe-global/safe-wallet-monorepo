import NameInput from '@/components/common/NameInput'
import { MEMBER_NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '@safe-global/utils/validation/names'
import { Controller, useFormContext } from 'react-hook-form'
import { MemberRole } from '@/features/spaces'
import { MemberInfoFormView } from '@views/features/spaces/components/AddMemberModal/MemberInfoFormView'

const MemberInfoForm = ({
  isEdit = false,
  disableName = isEdit,
  disableRole = false,
  nameMaxLength = MEMBER_NAME_MAX_LENGTH,
}: {
  isEdit?: boolean
  disableName?: boolean
  disableRole?: boolean
  nameMaxLength?: number
}) => {
  const { control } = useFormContext()

  return (
    <MemberInfoFormView
      adminRole={MemberRole.ADMIN}
      memberRole={MemberRole.MEMBER}
      disableRole={disableRole}
      renderNameInput={(props) => (
        <NameInput
          {...props}
          name="name"
          required
          disabled={disableName}
          validateCharset
          minLength={NAME_MIN_LENGTH}
          maxLength={nameMaxLength}
        />
      )}
      renderRoleField={(render) => (
        <Controller
          control={control}
          name="role"
          defaultValue={MemberRole.MEMBER}
          render={({ field: { value, onChange } }) => <>{render({ value, onChange })}</>}
        />
      )}
    />
  )
}

export default MemberInfoForm

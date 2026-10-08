import { useNewSafeNextParam } from '@/components/new-safe/getReturnUrl'
import { CreateButtonView } from '@views/features/myAccounts/components/CreateButton/CreateButtonView'

const CreateButton = ({ isPrimary, className }: { isPrimary: boolean; className?: string }) => {
  const next = useNewSafeNextParam()
  return <CreateButtonView isPrimary={isPrimary} buttonClassName={className} next={next} />
}

export default CreateButton

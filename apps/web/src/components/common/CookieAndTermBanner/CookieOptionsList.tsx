import type { ReactElement } from 'react'
import { useController, type Control } from 'react-hook-form'
import { CookieAndTermType } from '@/store/cookiesAndTermsSlice'
import { CookieOptionsListView } from '@views/components/common/CookieAndTermBanner/CookieOptionsListView'

type CookieFormData = {
  [CookieAndTermType.TERMS]: boolean
  [CookieAndTermType.NECESSARY]: boolean
  [CookieAndTermType.UPDATES]: boolean
  [CookieAndTermType.ANALYTICS]: boolean
}

const CookieOptionsList = ({ control }: { control: Control<CookieFormData> }): ReactElement => {
  const { field: updates } = useController({ name: CookieAndTermType.UPDATES, control })
  const { field: analytics } = useController({ name: CookieAndTermType.ANALYTICS, control })

  return (
    <CookieOptionsListView
      updates={{ checked: updates.value, onCheckedChange: updates.onChange }}
      analytics={{ checked: analytics.value, onCheckedChange: analytics.onChange }}
    />
  )
}

export default CookieOptionsList

import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { WidgetItemView, type WidgetItemViewProps } from '@views/features/spaces/components/SafeWidget/WidgetItemView'

interface WidgetItemProps extends WidgetItemViewProps {
  href?: string
}

const WidgetItem = ({ href, onClick, ...props }: WidgetItemProps): ReactElement => {
  const router = useRouter()

  const handleClick =
    href || onClick
      ? () => {
          onClick?.()
          href && router.push(href)
        }
      : undefined

  return <WidgetItemView {...props} onClick={handleClick} />
}

export { WidgetItem }
export type { WidgetItemProps }

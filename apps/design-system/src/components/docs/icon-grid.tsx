import * as lucide from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { ICON_STROKE } from '@safe-global/ui/utils'
import { getIcons } from '@/lib/generated'

type Icon = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>

export function IconGrid() {
  const icons = getIcons()
  const library = lucide as unknown as Record<string, Icon>
  return (
    <div className="not-prose grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-icon-grid>
      {icons.map(({ name, components }) => {
        const Icon = library[name]
        return (
          <div key={name} className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center">
            {Icon ? <Icon className="size-6" strokeWidth={ICON_STROKE} aria-hidden /> : null}
            <code className="text-xs">{name}</code>
            <span className="text-[11px] text-fd-muted-foreground">{components.join(', ')}</span>
          </div>
        )
      })}
    </div>
  )
}

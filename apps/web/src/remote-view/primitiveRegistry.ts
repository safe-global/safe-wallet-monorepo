import type { ComponentType } from 'react'
import * as accordion from '@safe-global/views/components/ui/accordion'
import * as avatar from '@safe-global/views/components/ui/avatar'
import * as badge from '@safe-global/views/components/ui/badge'
import * as button from '@safe-global/views/components/ui/button'
import * as calendar from '@safe-global/views/components/ui/calendar'
import * as checkbox from '@safe-global/views/components/ui/checkbox'
import * as collapsible from '@safe-global/views/components/ui/collapsible'
import * as dialog from '@safe-global/views/components/ui/dialog'
import * as dropdownMenu from '@safe-global/views/components/ui/dropdown-menu'
import * as input from '@safe-global/views/components/ui/input'
import * as link from '@safe-global/views/components/ui/link'
import * as popover from '@safe-global/views/components/ui/popover'
import * as progress from '@safe-global/views/components/ui/progress'
import * as select from '@safe-global/views/components/ui/select'
import * as separator from '@safe-global/views/components/ui/separator'
import * as sheet from '@safe-global/views/components/ui/sheet'
import * as tabs from '@safe-global/views/components/ui/tabs'
import * as toggle from '@safe-global/views/components/ui/toggle'
import * as tooltip from '@safe-global/views/components/ui/tooltip'

// Primitives the page draws for sandboxed views (they need the real DOM). scripts/remote-view-generate.mjs reads
// this list to give the worker a stand-in for each one.
const MODULES: Record<string, Record<string, unknown>> = {
  accordion,
  avatar,
  badge,
  button,
  calendar,
  checkbox,
  collapsible,
  dialog,
  'dropdown-menu': dropdownMenu,
  input,
  link,
  popover,
  progress,
  select,
  separator,
  sheet,
  tabs,
  toggle,
  tooltip,
}

const isComponent = (name: string, value: unknown) =>
  /^[A-Z]/.test(name) &&
  (typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value))

export const HOST_PRIMITIVES: Record<string, ComponentType<never>> = Object.fromEntries(
  Object.entries(MODULES).flatMap(([module, exports]) =>
    Object.entries(exports)
      .filter(([name, value]) => isComponent(name, value))
      .map(([name, value]) => [`${module}#${name}`, value as ComponentType<never>]),
  ),
)

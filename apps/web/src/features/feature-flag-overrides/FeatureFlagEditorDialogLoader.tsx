import type { ReactElement } from 'react'
import dynamic from 'next/dynamic'
import type { FeatureFlagEditorDialogProps } from './components/FeatureFlagEditorDialog'

// The dialog is referenced ONLY through this guarded dynamic import so its whole module
// graph is dead-code-eliminated in production. The guard MUST be the inlined process.env
// check (foldable at build time), not IS_PRODUCTION. Keep this module free of any other
// import from the feature — it is the sole boundary between the app and the editor UI. It
// lives at the feature root rather than under components/, which eslint treats as private.
const Dialog =
  process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'
    ? () => null
    : dynamic(() => import('./components/FeatureFlagEditorDialog'))

export const FeatureFlagEditorDialogLoader = (props: FeatureFlagEditorDialogProps): ReactElement => (
  <Dialog {...props} />
)

export default FeatureFlagEditorDialogLoader

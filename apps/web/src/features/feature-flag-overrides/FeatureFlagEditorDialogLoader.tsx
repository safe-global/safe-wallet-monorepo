import type { ReactElement } from 'react'
import dynamic from 'next/dynamic'
import type { FeatureFlagEditorDialogProps } from './components/FeatureFlagEditorDialog'

// Sole guarded dynamic import of the dialog, so its module graph is dead-code-eliminated in prod. The guard
// MUST be the inlined process.env check (build-time foldable), not IS_PRODUCTION. Keep this module free of
// other feature imports; it sits at the feature root since eslint treats components/ as private.
const Dialog =
  process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'
    ? () => null
    : dynamic(() => import('./components/FeatureFlagEditorDialog'))

export const FeatureFlagEditorDialogLoader = (props: FeatureFlagEditorDialogProps): ReactElement => (
  <Dialog {...props} />
)

export default FeatureFlagEditorDialogLoader

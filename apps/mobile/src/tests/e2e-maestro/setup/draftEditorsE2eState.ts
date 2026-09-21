import { createE2eStore } from '../createE2eStore'

export type DraftSetupStatus = 'idle' | 'ready' | 'failed'

/**
 * Outcome of the async draft-editor setup (SDK init + CGW fetch + compose can
 * fail); surfaced as e2e-draft-setup-* markers so flows gate on 'ready'.
 */
export const draftEditorsE2eState = createE2eStore('draftEditorsE2eState', {
  setupStatus: 'idle' as DraftSetupStatus,
})

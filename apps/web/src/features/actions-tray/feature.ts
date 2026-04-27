/**
 * Actions Tray Feature Implementation - Lazy-Loaded
 *
 * This entire file is lazy-loaded via the feature handle.
 * Use direct imports - do NOT use lazy() inside.
 */
import ActionsTray from './components/ActionsTray'
import type { ActionsTrayContract } from './contract'

const feature: ActionsTrayContract = {
  ActionsTray,
}

export default feature satisfies ActionsTrayContract

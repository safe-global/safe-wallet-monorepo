/**
 * MSW scenario handlers for Storybook stories
 *
 * Scenarios provide pre-configured handler sets for common testing situations.
 * Use these to quickly set up stories for different app states.
 */

// Empty state scenarios
export { createEmptyStateHandlers, createNewSafeHandlers } from './emptyState'

// Error state scenarios
export {
  createErrorHandlers,
  createSafeNotFoundHandlers,
  createServerErrorHandlers,
  createUnauthorizedHandlers,
  createTimeoutHandlers,
  createPartialErrorHandlers,
} from './errorState'

// Loading state scenarios
export {
  createLoadingHandlers,
  createStaggeredLoadingHandlers,
  createInfiniteLoadingHandlers,
  createPartialLoadingHandlers,
} from './loadingState'

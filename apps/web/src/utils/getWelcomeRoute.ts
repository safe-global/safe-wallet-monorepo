import isEmpty from 'lodash/isEmpty'
import { AppRoutes } from '@/config/routes'
import local from '@/services/local-storage/local'
import { addedSafesSlice, type AddedSafesState } from '@/store/addedSafesSlice'

/**
 * Picks the default welcome tab based on locally trusted (added) safes.
 *
 * A user with added safes lands on the Trusted accounts tab; everyone else
 * lands on the Workspaces tab. Reads localStorage directly, so it must only be
 * called client-side (effects, guards) — never during SSR/render.
 */
export const getWelcomeRoute = (): string => {
  const addedSafes = local.getItem<AddedSafesState>(addedSafesSlice.name)
  const hasAddedSafes = addedSafes !== null && !isEmpty(addedSafes)
  return hasAddedSafes ? AppRoutes.welcome.accounts : AppRoutes.welcome.spaces
}

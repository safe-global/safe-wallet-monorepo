import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

// TODO: Currently also checks for 404 because the /v1/spaces/<orgId> endpoint does not return 401
export const isUnauthorized = (error: FetchBaseQueryError | SerializedError | undefined) => {
  return error && 'status' in error && (error.status === 401 || error.status === 404)
}

// Environment utilities - extracted to allow mocking in tests
export const isProdEnv = (): boolean => {
  try {
    return import.meta.env.MODE === 'production'
  } catch {
    return false
  }
}

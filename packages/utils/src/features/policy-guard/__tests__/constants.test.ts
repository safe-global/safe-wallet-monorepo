const loadDelay = async (env: Record<string, string>): Promise<number> => {
  const original = { ...process.env }
  Object.assign(process.env, env)
  let delay: number | undefined
  await jest.isolateModulesAsync(async () => {
    delay = (await import('../constants')).POLICY_GUARD_DELAY_SECONDS
  })
  process.env = original
  if (delay === undefined) throw new Error('constants did not load')
  return delay
}

describe('POLICY_GUARD_DELAY_SECONDS', () => {
  it('should be 24 hours, when the web app is built for production', async () => {
    expect(await loadDelay({ NEXT_PUBLIC_IS_PRODUCTION: 'true' })).toBe(86_400)
  })

  it('should be 24 hours, when the mobile app is built for production', async () => {
    expect(await loadDelay({ EXPO_PUBLIC_IS_PRODUCTION: 'true' })).toBe(86_400)
  })

  it('should be one minute, when the app is not built for production', async () => {
    expect(await loadDelay({ NEXT_PUBLIC_IS_PRODUCTION: 'false' })).toBe(60)
  })

  it('should be the configured delay, when the env sets one', async () => {
    expect(await loadDelay({ NEXT_PUBLIC_IS_PRODUCTION: 'true', NEXT_PUBLIC_POLICY_GUARD_DELAY_SECONDS: '600' })).toBe(
      600,
    )
  })
})

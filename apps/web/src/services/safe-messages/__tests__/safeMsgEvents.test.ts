describe('safeMsgEvents', () => {
  it.each([
    [true, 1],
    [false, 0],
  ])('logs every event to the console only in development (IS_DEV=%s)', async (isDev, logCount) => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {})

    await jest.isolateModulesAsync(async () => {
      jest.doMock('@/config/constants', () => ({ ...jest.requireActual('@/config/constants'), IS_DEV: isDev }))
      const { safeMsgDispatch, SafeMsgEvent } = await import('../safeMsgEvents')
      safeMsgDispatch(SafeMsgEvent.UPDATED, { messageHash: '0x123' })
    })

    expect(info).toHaveBeenCalledTimes(logCount)
    info.mockRestore()
  })
})

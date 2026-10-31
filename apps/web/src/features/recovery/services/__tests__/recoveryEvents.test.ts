describe('recoveryEvents', () => {
  it.each([
    [true, 1],
    [false, 0],
  ])('logs every event to the console only in development (IS_DEV=%s)', async (isDev, logCount) => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {})

    await jest.isolateModulesAsync(async () => {
      jest.doMock('@/config/constants', () => ({ ...jest.requireActual('@/config/constants'), IS_DEV: isDev }))
      const { recoveryDispatch, RecoveryEvent, RecoveryTxType } = await import('../recoveryEvents')
      recoveryDispatch(RecoveryEvent.SUCCESS, { recoveryTxHash: '0x123', txType: RecoveryTxType.PROPOSAL })
    })

    expect(info).toHaveBeenCalledTimes(logCount)
    info.mockRestore()
  })
})

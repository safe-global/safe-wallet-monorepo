import notifee from '@notifee/react-native'
import Logger from '@/src/utils/logger'

class BadgeManager {
  async incrementBadgeCount(incrementBy?: number): Promise<void> {
    await notifee.incrementBadgeCount(incrementBy)
    const newCount = await notifee.getBadgeCount()
    Logger.info(`Badge incremented by ${incrementBy || 1}, new count: ${newCount}`)
  }

  async decrementBadgeCount(decrementBy?: number): Promise<void> {
    await notifee.decrementBadgeCount(decrementBy)
    const newCount = await notifee.getBadgeCount()
    Logger.info(`Badge decremented by ${decrementBy || 1}, new count: ${newCount}`)
  }

  async setBadgeCount(count: number): Promise<void> {
    await notifee.setBadgeCount(count)
    Logger.info(`Badge count set to: ${count}`)
  }

  async getBadgeCount(): Promise<number> {
    const count = await notifee.getBadgeCount()
    Logger.info(`Current badge count: ${count}`)
    return count
  }

  async clearAllBadges(): Promise<void> {
    try {
      await this.setBadgeCount(0)
      Logger.info('All badges cleared')
    } catch (error) {
      Logger.error('Failed to clear badges', error)
    }
  }
}

export default new BadgeManager()

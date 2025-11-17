import { LogBox, Pressable } from 'react-native'
import { View } from 'tamagui'
import { useDispatch } from 'react-redux'
import { useRouter } from 'expo-router'
import { setupOnboardedAccount, setupTestOnboarding, setupSeedPhraseImportAccount } from '../setup/onboardingSetup'
import { setupOnboardedAccountForAssets } from '../setup/assetsSetup'
import {
  setupAllPendingTxSafes,
  setupPendingTxsSafe1,
  setupPendingTxsSafe2,
  setupPendingTxsSafe3,
  setupPendingTxsSafe4,
} from '../setup/pendingTxSetup'
import { setupHistory, setupTransactionHistory, setupTransactionHistoryDirect } from '../setup/historySetup'

LogBox.ignoreAllLogs()

/**
 * This utility component is only included in the test simulator
 * build. It provides quick triggers that set up various test scenarios
 * to dramatically improve test execution pace.
 *
 * Each button sets up specific Redux state and navigates to the appropriate screen.
 */

const BTN = { height: 1, width: 1, backgroundColor: 'red' }

export function TestCtrls() {
  const dispatch = useDispatch()
  const router = useRouter()

  return (
    <View position={'absolute'} top={100} right={0} zIndex={99999}>
      {/* Onboarding */}
      <Pressable
        testID="e2eOnboardedAccount"
        onPress={() => setupOnboardedAccount(dispatch, router)}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eTestOnboarding"
        onPress={() => setupTestOnboarding(router)}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eSeedPhraseImportAccount"
        onPress={() => setupSeedPhraseImportAccount(dispatch, router)}
        accessibilityRole="button"
        style={BTN}
      />

      {/* Assets */}
      <Pressable
        testID="e2eOnboardedAccountTestAssets"
        onPress={() => setupOnboardedAccountForAssets(dispatch, router)}
        accessibilityRole="button"
        style={BTN}
      />

      {/* Transaction History */}
      <Pressable
        testID="e2eHistory"
        onPress={() => setupHistory(dispatch, router)}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eTransactionHistory"
        onPress={() => setupTransactionHistory(dispatch, router)}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eTransactionHistoryDirect"
        onPress={() => setupTransactionHistoryDirect(dispatch, router)}
        accessibilityRole="button"
        style={BTN}
      />

      {/* Pending Transactions - Bulk Setup */}
      <Pressable
        testID="e2ePendingTxs"
        onPress={() => setupAllPendingTxSafes(dispatch, router)}
        accessibilityRole="button"
        style={BTN}
      />

      {/* Pending Transactions - Per Safe Direct Navigation */}
      <Pressable
        testID="e2ePendingTxsSafe1"
        onPress={() => setupPendingTxsSafe1(dispatch, router)}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2ePendingTxsSafe2"
        onPress={() => setupPendingTxsSafe2(dispatch, router)}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2ePendingTxsSafe3"
        onPress={() => setupPendingTxsSafe3(dispatch, router)}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2ePendingTxsSafe4"
        onPress={() => setupPendingTxsSafe4(dispatch, router)}
        accessibilityRole="button"
        style={BTN}
      />
    </View>
  )
}

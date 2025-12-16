import { LogBox, Pressable, TextInput, StyleSheet } from 'react-native'
import { View, Text } from 'tamagui'
import { useDispatch } from 'react-redux'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { setupOnboardedAccount, setupTestOnboarding, setupSeedPhraseImportAccount } from '../setup/onboardingSetup'
import { setupOnboardedAccountForAssets } from '../setup/assetsSetup'
import {
  setupAllPendingTxSafes,
  setupPendingTxsSafe1,
  setupPendingTxsSafe2,
  setupPendingTxsSafe3,
  setupPendingTxsSafe4,
  setupSafeShieldSafe,
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

function ClipboardVerificationTrigger({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      testID="e2eClipboardVerificationTrigger"
      onPress={onPress}
      accessibilityRole="button"
      style={styles.trigger}
    />
  )
}

function ClipboardVerificationContainer({
  isVisible,
  pastedText,
  onTextChange,
  onClose,
}: {
  isVisible: boolean
  pastedText: string
  onTextChange: (text: string) => void
  onClose: () => void
}) {
  if (!isVisible) {
    return null
  }

  return (
    <View style={styles.clipboardContainer}>
      <TextInput
        testID="e2eClipboardVerificationInput"
        style={styles.textInput}
        value={pastedText}
        onChangeText={onTextChange}
        placeholder="Paste here"
        multiline
        autoFocus
      />
      <Pressable
        testID="e2eClipboardVerificationClose"
        onPress={onClose}
        style={styles.closeButton}
        accessibilityRole="button"
      >
        <Text color="$color" fontSize="$4">
          Close
        </Text>
      </Pressable>
    </View>
  )
}

export function TestCtrls() {
  const dispatch = useDispatch()
  const router = useRouter()
  const [isClipboardVisible, setIsClipboardVisible] = useState(false)
  const [pastedText, setPastedText] = useState('')

  return (
    <>
      <View position={'absolute'} top={100} right={0} zIndex={99999} pointerEvents="box-none">
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

        {/* SafeShield Test Safe (Polygon) */}
        <Pressable
          testID="e2eSafeShieldSafe"
          onPress={() => setupSafeShieldSafe(dispatch, router)}
          accessibilityRole="button"
          style={BTN}
        />

        {/* Clipboard Verification Trigger */}
        <ClipboardVerificationTrigger onPress={() => setIsClipboardVisible(true)} />
      </View>

      {/* Clipboard Verification Container - rendered outside buttons View */}
      <ClipboardVerificationContainer
        isVisible={isClipboardVisible}
        pastedText={pastedText}
        onTextChange={setPastedText}
        onClose={() => {
          setIsClipboardVisible(false)
          setPastedText('')
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    height: 1,
    width: 1,
  },
  clipboardContainer: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    zIndex: 100000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 200,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 4,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  closeButton: {
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
})

import { LogBox, Pressable, TextInput, StyleSheet, View as RNView } from 'react-native'
import { View, Text } from 'tamagui'
import { useDispatch } from 'react-redux'
import { useRouter } from 'expo-router'
import { useState, useSyncExternalStore } from 'react'
import { setupOnboardedAccount, setupTestOnboarding, setupSeedPhraseImportAccount } from '../setup/onboardingSetup'
import {
  setupConnectSignerOwner,
  setupConnectSignerNonOwner,
  switchToOwnerState,
  setupWcGateReconnect,
  setupWcGateWrongNetwork,
  setupWcGateReconnectWrongWallet,
  setupConnectSignerCollision,
} from '../setup/connectSignerSetup'
import { setupOnboardedAccountForAssets } from '../setup/assetsSetup'
import { setupPositionsTestSafe } from '../setup/positionsSetup'
import {
  setupAllPendingTxSafes,
  setupPendingTxsSafe1,
  setupPendingTxsSafe2,
  setupPendingTxsSafe3,
  setupPendingTxsSafe4,
  setupSafeShieldSafe,
} from '../setup/pendingTxSetup'
import { setupHistory, setupTransactionHistory, setupTransactionHistoryDirect } from '../setup/historySetup'
import {
  setupWcDappsBase,
  seedWcSession,
  setupWcDappsTx,
  synthSessionProposalValid,
  synthSessionProposalUnverified,
  synthSessionProposalScam,
  synthSessionDelete,
  synthTxRequest,
  synthTxBatch,
  setWcPairHang,
  armProposeFailure,
} from '../setup/walletConnectDappsSetup'
import { installProposeFetchMock } from '../setup/proposeFetchMock'
import { WcResponseIndicator } from './WcResponseIndicator'
import { appUpdateE2eState } from '@/src/features/AppUpdate/hooks/appUpdateE2eState'
import { walletKitE2eState } from '@/src/features/WalletConnect/Wallet/walletKitE2eState'

LogBox.ignoreAllLogs()

// e2e bundles only (this module is an RN_SRC_EXT override): make CGW /propose mockable.
installProposeFetchMock()

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

/**
 * Side-channel for the WalletConnect dApp reject flow: renders a 1x1 marker with
 * the `e2e-wc-reject-called` test-id once the fake rejectSession() has run.
 */
function WcRejectIndicator() {
  const rejectCalled = useSyncExternalStore(
    walletKitE2eState.subscribe,
    () => walletKitE2eState.get().rejectSessionCalled,
  )
  if (!rejectCalled) {
    return null
  }
  // Plain RN View so testID maps to accessibilityIdentifier reliably (Tamagui
  // Views aren't always exposed to iOS accessibility / Maestro).
  return <RNView testID="e2e-wc-reject-called" style={styles.marker} />
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
        <Pressable
          testID="e2ePositionsTestSafe"
          onPress={() => setupPositionsTestSafe(dispatch, router)}
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

        {/* App Update Scenarios */}
        <Pressable
          testID="e2eForceUpdate"
          onPress={() =>
            appUpdateE2eState.set({
              requiresForceUpdate: true,
              recommendsUpdate: false,
              isLoading: false,
            })
          }
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable
          testID="e2eSoftUpdate"
          onPress={() =>
            appUpdateE2eState.set({
              requiresForceUpdate: false,
              recommendsUpdate: true,
              isLoading: false,
            })
          }
          accessibilityRole="button"
          style={BTN}
        />

        {/* Connect Signer Scenarios */}
        <Pressable
          testID="e2eConnectSignerOwner"
          onPress={() => setupConnectSignerOwner(dispatch, router)}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable
          testID="e2eConnectSignerNonOwner"
          onPress={() => setupConnectSignerNonOwner(dispatch, router)}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable
          testID="e2eSwitchToOwnerState"
          onPress={() => switchToOwnerState()}
          accessibilityRole="button"
          style={BTN}
        />

        {/* WalletConnect Gate Scenarios */}
        <Pressable
          testID="e2eWcGateReconnect"
          onPress={() => setupWcGateReconnect(dispatch, router)}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable
          testID="e2eWcGateWrongNetwork"
          onPress={() => setupWcGateWrongNetwork(dispatch, router)}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable
          testID="e2eWcGateReconnectWrongWallet"
          onPress={() => setupWcGateReconnectWrongWallet(dispatch, router)}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable
          testID="e2eConnectSignerCollision"
          onPress={() => setupConnectSignerCollision(dispatch, router)}
          accessibilityRole="button"
          style={BTN}
        />

        {/* WalletConnect dApp pairing & session approval scenarios */}
        <Pressable
          testID="e2eWcDappsBase"
          onPress={() => setupWcDappsBase(dispatch, router)}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable testID="e2eWcSeedSession" onPress={() => seedWcSession()} accessibilityRole="button" style={BTN} />
        <Pressable
          testID="e2eWcSynthProposalValid"
          onPress={() => synthSessionProposalValid()}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable
          testID="e2eWcSynthProposalUnverified"
          onPress={() => synthSessionProposalUnverified()}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable
          testID="e2eWcSynthProposalScam"
          onPress={() => synthSessionProposalScam()}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable
          testID="e2eWcSynthDelete"
          onPress={() => synthSessionDelete()}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable testID="e2eWcPairHang" onPress={() => setWcPairHang()} accessibilityRole="button" style={BTN} />

        {/* WalletConnect dApp transaction-request scenarios */}
        <Pressable
          testID="e2eWcDappsTx"
          onPress={() => {
            setupWcDappsTx(dispatch, router).catch((e) => console.error('[E2E] setupWcDappsTx failed:', e))
          }}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable
          testID="e2eWcSynthTxRequest"
          onPress={() => synthTxRequest()}
          accessibilityRole="button"
          style={BTN}
        />
        <Pressable testID="e2eWcSynthTxBatch" onPress={() => synthTxBatch()} accessibilityRole="button" style={BTN} />
        <Pressable
          testID="e2eWcArmProposeFailure"
          onPress={() => armProposeFailure()}
          accessibilityRole="button"
          style={BTN}
        />

        {/* Clipboard Verification Trigger */}
        <ClipboardVerificationTrigger onPress={() => setIsClipboardVisible(true)} />

        {/* WalletConnect dApp reject + tx-response side-channels */}
        <WcRejectIndicator />
        <WcResponseIndicator />
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
  marker: {
    height: 1,
    width: 1,
    backgroundColor: 'red',
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

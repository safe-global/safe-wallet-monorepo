import { LogBox, Pressable } from 'react-native'
import { View } from 'tamagui'
import { useDispatch } from 'react-redux'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { useRouter } from 'expo-router'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { SafeInfo, Address } from '@/src/types/address'
import { updateSettings } from '@/src/store/settingsSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { addContact } from '@/src/store/addressBookSlice'

LogBox.ignoreAllLogs()

const mockedActiveAccount: SafeInfo = {
  address: '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6',
  chainId: '11155111',
}
const mockedActiveSafeInfo: SafeOverview = {
  address: { value: '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedActiveAccount.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x3336745b7EA628F5134Bd9d08aa68b4979fA3472', name: null, logoUri: null },
    { value: '0x81BdB0a66065363F704A105D67D53d090aD14fec', name: null, logoUri: null },
    { value: '0x4d5CF9E6df9a95F4c1F5398706cA27218add5949', name: null, logoUri: null },
  ],
  queued: 1,
  threshold: 1,
}

const mockedActiveAccount1: SafeInfo = {
  address: '0x9BFCA75a05175503580D593F4330b5505c594596',
  chainId: '11155111',
}
const mockedActiveSafeInfo1: SafeOverview = {
  address: { value: '0x9BFCA75a05175503580D593F4330b5505c594596', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedActiveAccount1.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x65F8236309e5A99Ff0d129d04E486EBCE20DC7B0', name: null, logoUri: null },
    { value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e', name: null, logoUri: null },
    { value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8', name: null, logoUri: null },
  ],
  queued: 1,
  threshold: 1,
}

const assetsTest: { safes: Record<string, SafeOverview> } = {
  safes: {
    Safe1: {
      address: { value: '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6', name: null, logoUri: null },
      awaitingConfirmation: null,
      chainId: mockedActiveAccount.chainId,
      fiatTotal: '0',
      owners: [
        { value: '0x3336745b7EA628F5134Bd9d08aa68b4979fA3472', name: null, logoUri: null },
        { value: '0x81BdB0a66065363F704A105D67D53d090aD14fec', name: null, logoUri: null },
        { value: '0x4d5CF9E6df9a95F4c1F5398706cA27218add5949', name: null, logoUri: null },
      ],
      queued: 1,
      threshold: 1,
    },
    Safe2: {
      address: { value: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415', name: null, logoUri: null },
      awaitingConfirmation: null,
      chainId: mockedActiveAccount.chainId,
      fiatTotal: '0',
      owners: [
        { value: '0x61a0c717d18232711bC788F19C9Cd56a43cc8872', name: null, logoUri: null },
        { value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e', name: null, logoUri: null },
      ],
      queued: 1,
      threshold: 1,
    },
  },
}

/**
 * This utility component is only included in the test simulator
 * build. It gives some quick triggers which help improve the pace
 * of the tests dramatically.
 */

const BTN = { height: 1, width: 1, backgroundColor: 'red' }

export function TestCtrls() {
  const dispatch = useDispatch()
  const router = useRouter()
  const onPressOnboardedAccount = async () => {
    dispatch(
      addSafe({
        address: mockedActiveSafeInfo.address.value as Address,
        info: { [mockedActiveSafeInfo.chainId]: mockedActiveSafeInfo },
      }),
    )
    dispatch(setActiveSafe(mockedActiveAccount))
    router.replace('/(tabs)')
  }
  const onPressTestOnboarding = async () => {
    router.replace('/onboarding')
  }

  const onPressE2eHistory = async () => {
    dispatch(updateSettings({ onboardingVersionSeen: 'v1' }))
    dispatch(updatePromptAttempts(1))
    dispatch(
      addSafe({
        info: { [mockedActiveAccount1.chainId]: mockedActiveSafeInfo1 },
        address: mockedActiveAccount1.address,
      }),
    )
    dispatch(setActiveSafe(mockedActiveAccount1))

    router.replace('/(tabs)')
  }

  return (
    <View position={'absolute'} top={100} right={0} zIndex={99999}>
      <Pressable
        testID="e2eOnboardedAccount"
        onPress={() => onPressOnboardedAccount()}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eOnboardedAccountNoNotifications"
        onPress={() => {
          const keys = Object.keys(assetsTest.safes)
          Object.values(assetsTest.safes).forEach((safe: SafeOverview, index) => {
            dispatch(
              addSafe({
                address: safe.address.value as Address,
                info: { [safe.chainId]: safe },
              }),
            )
            dispatch(
              addContact({
                value: safe.address.value as Address,
                name: keys[index],
                chainIds: [safe.chainId],
              }),
            )
          })
          dispatch(updatePromptAttempts(1))
          dispatch(setActiveSafe(mockedActiveAccount))
          router.replace('/(tabs)')
        }}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable testID="e2eTestOnboarding" onPress={onPressTestOnboarding} accessibilityRole="button" style={BTN} />
      <Pressable testID="e2eHistory" onPress={onPressE2eHistory} accessibilityRole="button" style={BTN} />
    </View>
  )
}

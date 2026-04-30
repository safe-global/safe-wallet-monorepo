import React from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'
import { Text, View } from 'tamagui'
import { MenuView, NativeActionEvent, MenuAction } from '@react-native-menu/menu'
import { useRouter } from 'expo-router'
import { useAppSelector } from '@/src/store/hooks'
import { selectSigners, Signer } from '@/src/store/signersSlice'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { clearPendingSafe } from '@/src/store/signerImportFlowSlice'
import { useAppDispatch } from '@/src/store/hooks'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle, SectionTitle } from '@/src/components/Title'
import { SafeButton } from '@/src/components/SafeButton'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import { ImportedBadge } from '@/src/features/Signers/components/SignersList/ImportedBadge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useSignersActions } from '@/src/features/Signers/components/SignersList/hooks/useSignersActions'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { useTheme } from '@/src/theme/hooks/useTheme'

const title = 'Your signers'
const subtitle =
  'Signers have full control over the accounts they are connected to. They can propose, sign and execute transactions, as well as reject them.'

function SignerRow({ signer }: { signer: Signer }) {
  const router = useRouter()
  const { isDark } = useTheme()
  const contact = useAppSelector(selectContactByAddress(signer.value))
  const actions = useSignersActions(true)
  const filteredActions = actions.filter(Boolean) as MenuAction[]
  const copy = useCopyAndDispatchToast()

  const handlePress = () => {
    router.push({
      pathname: '/signers/[address]',
      params: { address: signer.value },
    })
  }

  const onPressMenuAction = ({ nativeEvent }: NativeActionEvent) => {
    if (nativeEvent.event === 'rename') {
      router.push({
        pathname: '/signers/[address]',
        params: { address: signer.value, editMode: 'true' },
      })
      return
    }

    if (nativeEvent.event === 'copy') {
      copy(signer.value)
    }
  }

  return (
    <View position="relative" marginBottom="$2">
      <TouchableOpacity onPress={handlePress} testID={`global-signer-${signer.value}`}>
        <View backgroundColor={isDark ? '$backgroundPaper' : '$background'} borderRadius="$2" collapsable={false}>
          <SignersCard
            name={contact?.name ?? signer.name ?? ''}
            address={signer.value as `0x${string}`}
            rightNode={
              <View flexDirection="row" alignItems="center" flexShrink={0} gap="$2">
                <ImportedBadge />
                <View width={32} />
              </View>
            }
          />
        </View>
      </TouchableOpacity>

      <View
        position="absolute"
        right={0}
        top={0}
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="row"
      >
        <MenuView
          onPressAction={onPressMenuAction}
          actions={filteredActions}
          style={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingRight: 16,
            paddingLeft: 16,
          }}
          testID="global-signer-menu"
        >
          <SafeFontIcon name="options-horizontal" />
        </MenuView>
      </View>
    </View>
  )
}

export function YourSignersListContainer() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const signers = useAppSelector(selectSigners)
  const signersList = Object.values(signers)

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{title}</NavBarTitle>,
  })

  const handleAddSigner = () => {
    dispatch(clearPendingSafe())
    router.push({
      pathname: '/import-signers',
      params: { origin: '/your-signers' },
    })
  }

  return (
    <View flex={1} gap="$4">
      <View flex={1}>
        <ScrollView onScroll={handleScroll}>
          <SectionTitle title={title} description={subtitle} />

          {signersList.length > 0 && (
            <View paddingHorizontal="$3" paddingBottom="$2">
              <Text fontSize="$3" fontWeight={600} color="$colorSecondary">
                Safe signers
              </Text>
            </View>
          )}

          <View paddingHorizontal="$3">
            {signersList.map((signer) => (
              <SignerRow key={signer.value} signer={signer} />
            ))}
          </View>
        </ScrollView>
      </View>

      <SafeButton onPress={handleAddSigner} testID="add-signer-button">
        Add signer
      </SafeButton>
    </View>
  )
}

import { H3, Text, View, XStack, YStack } from 'tamagui'
import { SafeInfo } from '@/src/types/address'
import { Container } from '@/src/components/Container'
import Share from 'react-native-share'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Identicon } from '@/src/components/Identicon'
import QRCodeStyled from 'react-native-qrcode-styled'
import { StyleSheet } from 'react-native'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import React, { useCallback } from 'react'
import { ToastViewport } from '@tamagui/toast'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { ChainsDisplay } from '@/src/components/ChainsDisplay'
import { getAvailableChainsNames } from '@/src/utils/chains'
import { useAppSelector } from '@/src/store/hooks'
import { selectContactByAddress } from '@/src/store/addressBookSlice'

type ShareViewProps = {
  activeSafe: SafeInfo
  availableChains: Chain[]
}

export const ShareView = ({ activeSafe, availableChains }: ShareViewProps) => {
  const copyAndDispatchToast = useCopyAndDispatchToast()
  const contact = useAppSelector(selectContactByAddress(activeSafe.address))

  const safeAddress = activeSafe.address

  const onPressShare = async () => {
    Share.open({
      title: 'Your safe Address',
      message: safeAddress,
    }).then((res) => {
      // what to do with the result?
      console.log(res)
    })
  }

  const onPressCopy = useCallback(() => {
    copyAndDispatchToast(safeAddress)
  }, [safeAddress])

  return (
    <>
      <YStack flex={1}>
        <YStack flex={1} justifyContent={'flex-end'} alignItems={'center'} marginBottom={'$6'}>
          <H3 fontWeight={600}>{contact ? contact.name : 'Unnamed safe'}</H3>
        </YStack>
        <YStack flex={3} alignItems={'center'}>
          <Container marginHorizontal={'$10'}>
            <View>
              <View style={styles.root}>
                <QRCodeStyled
                  data={safeAddress}
                  style={styles.svg}
                  padding={22}
                  pieceSize={6}
                  pieceCornerType={'rounded'}
                  pieceBorderRadius={3}
                  isPiecesGlued
                  color={'#000'}
                  errorCorrectionLevel={'H'}
                  innerEyesOptions={styles.innerEyesOptions}
                  outerEyesOptions={styles.outerEyesOptions}
                />

                <View style={styles.logoContainer}>
                  <Identicon address={safeAddress} size={56} />
                </View>
              </View>
            </View>
            <Text
              marginTop={'$4'}
              fontSize={16}
              lineHeight={22}
              letterSpacing={0.2}
              color={'$colorLight'}
              textAlign={'center'}
            >
              {activeSafe.address}
            </Text>
            <View alignItems={'center'} marginTop={'$4'}>
              <ChainsDisplay activeChainId={activeSafe.chainId} chains={availableChains} max={5} />
            </View>
          </Container>
          <XStack gap={'$3'} marginTop={'$6'}>
            <SafeButton
              size={'$sm'}
              onPress={onPressShare}
              icon={<SafeFontIcon name={'export'} size={16} style={{ marginTop: -4 }} />}
              secondary
            >
              Share
            </SafeButton>
            <SafeButton
              size={'$sm'}
              onPress={onPressCopy}
              icon={<SafeFontIcon name={'copy'} size={16} style={{ marginTop: -4 }} />}
              secondary
            >
              Copy
            </SafeButton>
          </XStack>
        </YStack>
        <YStack flex={1} justifyContent={'flex-end'} alignItems={'center'}>
          <Text color={'$colorLight'} textAlign={'center'} fontSize={'$3'}>
            This account is only available on
            <Text color={'$color'} fontWeight={600}>
              {' '}
              {getAvailableChainsNames(availableChains)}.
            </Text>
          </Text>
        </YStack>
      </YStack>
      <ToastViewport multipleToasts={false} left={0} right={0} />
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    flex: 1,
  },
  logoContainer: {
    position: 'absolute',
    width: 64,
    height: 64,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
  },
  logo: {
    width: '90%',
    height: '90%',
    top: -2,
  },
  innerEyesOptions: {
    borderRadius: 0,
    color: '#000',
  },
  outerEyesOptions: {
    borderRadius: 15,
  },
})

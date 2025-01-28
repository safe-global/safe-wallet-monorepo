import { Dimensions, StyleSheet } from 'react-native'
import { H1, Image, View } from 'tamagui'
import Signing from '@/assets/images/illustration.png'

import TrackAnywhere from '@/assets/images/anywhere.png'
import { CarouselItem } from './CarouselItem'
import { ParticlesLogo } from '../ParticlesLogo'

const windowHeight = Dimensions.get('window').height

const styles = StyleSheet.create({
  image: {
    width: '100%',
  },
  anywhere: {
    height: Math.abs(windowHeight * 0.32),
  },
  signing: {
    height: Math.abs(windowHeight * 0.3),
  },
  notifications: {
    height: Math.abs(windowHeight * 0.32),
  },
  textContainer: {
    textAlign: 'center',
    flexDirection: 'column',
  },
})

export const items: CarouselItem[] = [
  {
    name: 'multisig',
    image: (
      <View justifyContent="flex-end" height={Math.abs(windowHeight * 0.35)}>
        <ParticlesLogo />
      </View>
    ),
    title: (
      <>
        <H1 style={styles.textContainer} fontWeight={600}>
          Your main
        </H1>
        <H1 style={styles.textContainer} fontWeight={600}>
          <H1 fontWeight={600} color="$primary">
            Safe
          </H1>{' '}
          multisig
        </H1>
        <H1 style={styles.textContainer} fontWeight={600}>
          companion
        </H1>
      </>
    ),
  },
  {
    name: 'tracking',
    image: <Image style={[styles.image, styles.anywhere]} source={TrackAnywhere} />,
    title: (
      <>
        <H1 style={styles.textContainer} fontWeight={600}>
          Track
        </H1>
        <H1 style={styles.textContainer} fontWeight={600}>
          everything.
        </H1>
        <H1 style={styles.textContainer} fontWeight={600} color="$primary">
          Anywhere.
        </H1>
      </>
    ),
    description: 'Quickly check your asset balances and portfolio performance anytime, anywhere.',
  },
  {
    name: 'signing',
    image: <Image style={[styles.image, styles.signing]} source={Signing} />,
    title: (
      <>
        <H1 style={styles.textContainer} fontWeight={600}>
          Seamless
        </H1>
        <H1 style={styles.textContainer} fontWeight={600}>
          signing
        </H1>
      </>
    ),
    description:
      'Sign and execute transactions securely from your mobile device. Ensuring your assets are protected, even on the move.',
  },
  {
    name: 'update-to-date',
    image: <View height={Math.abs(windowHeight * 0.32)} />,
    title: (
      <>
        <H1 style={styles.textContainer} fontWeight={600}>
          Stay
        </H1>
        <H1 style={styles.textContainer} fontWeight={600}>
          up-to-date
        </H1>
      </>
    ),
    description:
      'Sign and execute transactions securely from your mobile device. Ensuring your assets are protected, even on the move.',
  },
]

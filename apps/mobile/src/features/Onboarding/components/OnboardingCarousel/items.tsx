import { Dimensions, StyleSheet } from 'react-native'
import { getTokenValue, H1, Image, View } from 'tamagui'
import Signing from '@/assets/images/select-signer.png'
import PersonalisedUpdates from '@/assets/images/personalised-updates.png'

import TrackAnywhere from '@/assets/images/anywhere.png'
import { CarouselItem } from './CarouselItem'
import React from 'react'

const windowHeight = Dimensions.get('window').height
const windowWidth = Dimensions.get('window').width
const maxGoodWidth = 375
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
    letterSpacing: -0.1,
    color: getTokenValue('$color.textContrastDark'),
  },
})

export const items: CarouselItem[] = [
  {
    name: 'tracking',
    image: (
      <View height={300} width={'100%'}>
        <Image style={[styles.image, styles.anywhere]} source={TrackAnywhere} />
      </View>
    ),
    title: (
      <>
        <H1 style={styles.textContainer} fontWeight={600}>
          Track your
        </H1>
        <H1 style={styles.textContainer} fontWeight={600}>
          accounts.
        </H1>
        <H1 style={styles.textContainer} fontWeight={600} color="$primary">
          Anywhere.
        </H1>
      </>
    ),
    description: 'Easily track balances and get real-time updates on account activity - anytime.',
  },
  {
    name: 'signing',
    image: (
      <View height={300} width={'100%'}>
        <Image style={[styles.image, styles.signing]} source={Signing} />
      </View>
    ),
    title: (
      <>
        <H1 style={styles.textContainer} fontWeight={600} marginHorizontal={windowWidth <= maxGoodWidth ? -10 : 0}>
          Sign transaction
        </H1>

        <H1 style={styles.textContainer} fontWeight={600}>
          securely on-
        </H1>
        <H1 style={styles.textContainer} fontWeight={600}>
          the-go..
        </H1>
      </>
    ),
    description: 'Enjoy peace of mind with transaction checks, ensuring secure signing.',
  },
  {
    name: 'update-to-date',
    image: (
      <View height={300} width={'100%'}>
        <Image style={[styles.image, styles.signing]} source={PersonalisedUpdates} />
      </View>
    ),
    title: (
      <>
        <H1 style={styles.textContainer} fontWeight={600}>
          ...and get
        </H1>
        <H1 style={styles.textContainer} fontWeight={600}>
          personalised
        </H1>
        <H1 style={styles.textContainer} fontWeight={600}>
          updates
        </H1>
      </>
    ),
    description: 'Stay informed with personalized notifications tailored to your accounts.',
  },
]

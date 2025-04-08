import { View } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { Skeleton } from 'moti/skeleton'
import { Badge } from '@/src/components/Badge'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Address } from '@/src/types/address'

type IdenticonWithBadgeProps = {
  address: Address
  badgeContent?: string
  size?: number
  testID?: string
  fontSize?: number
  variant?: 'sm' | 'md'
}

export const IdenticonWithBadge = ({
  address,
  testID,
  badgeContent,
  fontSize = 12,
  size = 56,
  variant = 'md',
}: IdenticonWithBadgeProps) => {
  return (
    <View style={styles.container} testID={testID}>
      <Identicon address={address} size={size} />
      <View style={[variant === 'sm' ? styles.badgeSm : styles.badge]}>
        <Skeleton colorMode={'dark'} radius="round" height={28} width={28}>
          {badgeContent && (
            <Badge
              content={badgeContent}
              textContentProps={{
                fontSize,
                fontWeight: 500,
              }}
              themeName={'badge_success_variant2'}
              circleProps={{ bordered: true, borderColor: '$colorContrast' }}
            />
          )}
        </Skeleton>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
  },
  badgeSm: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
})

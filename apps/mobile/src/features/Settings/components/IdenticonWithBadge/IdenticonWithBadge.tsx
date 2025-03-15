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
}

export const IdenticonWithBadge = ({
  address,
  testID,
  badgeContent,
  fontSize = 12,
  size = 56,
}: IdenticonWithBadgeProps) => {
  return (
    <View style={styles.container} testID={testID}>
      <Identicon address={address} size={size} />
      <View style={styles.badge}>
        <Skeleton colorMode={'dark'} radius="round" height={28} width={28}>
          {badgeContent && (
            <Badge
              content={badgeContent}
              textContentProps={{
                fontSize,
                fontWeight: 500,
              }}
              themeName={'badge_success'}
              circleProps={{ bordered: true }}
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
})

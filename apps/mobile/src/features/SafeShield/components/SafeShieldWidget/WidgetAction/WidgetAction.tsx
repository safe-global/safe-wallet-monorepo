import React, { useMemo } from 'react'
import { Text, View } from 'tamagui'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { safeShieldLogoStatusMap } from './constants'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { TouchableOpacity } from 'react-native'

interface WidgetActionProps {
  loading: boolean
  error: boolean
  status: {
    severity: Severity
    title: string
  } | null
  onPress: () => void
}

const getWidgetActionContent = (
  loading: boolean,
  error: boolean,
  status: { severity: Severity; title: string } | null,
) => {
  return loading ? 'Checking transaction...' : error ? 'Checks unavailable' : status?.title
}

export function WidgetAction({ loading, error, status, onPress }: WidgetActionProps) {
  const Logo = useMemo(() => {
    const key = status?.severity || Severity.OK

    if (loading) {
      return safeShieldLogoStatusMap.OK
    }

    if (error) {
      return safeShieldLogoStatusMap.error
    }

    return safeShieldLogoStatusMap[key]
  }, [status, loading, error])

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View
        backgroundColor="$backgroundFocus"
        paddingHorizontal="$1"
        borderTopLeftRadius="$2"
        borderTopRightRadius="$2"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        gap="$0"
      >
        <View flexDirection="row" alignItems="center" justifyContent="center" gap="$1">
          {Boolean(Logo) && (
            <View marginTop="$1" width={38} height={38}>
              <Logo />
            </View>
          )}

          <Text fontWeight={600}>{getWidgetActionContent(loading, error, status)}</Text>
        </View>

        <View marginRight="$3">
          <SafeFontIcon name="chevron-right" size={16} color="$color" />
        </View>
      </View>
    </TouchableOpacity>
  )
}

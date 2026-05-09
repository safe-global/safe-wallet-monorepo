import React, { useReducer } from 'react'
import type { ReactNode } from 'react'
import { Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { TouchableOpacity } from 'react-native'

interface AnalysisDetailsDropdownProps {
  showLabel?: string
  hideLabel?: string
  children: ReactNode
  defaultExpanded?: boolean
  /** Optional wrapper for the collapsed content */
  contentWrapper?: (children: ReactNode) => ReactNode
}

export function AnalysisDetailsDropdown({
  showLabel = 'Show all',
  hideLabel = 'Hide all',
  children,
  defaultExpanded = false,
  contentWrapper,
}: AnalysisDetailsDropdownProps) {
  const [expanded, toggle] = useReducer((state: boolean) => !state, defaultExpanded)

  return (
    <View marginTop={-6}>
      <TouchableOpacity onPress={toggle} accessibilityLabel={expanded ? hideLabel : showLabel}>
        <View
          flexDirection="row"
          alignItems="center"
          width="fit-content"
          overflow="hidden"
          marginBottom={expanded ? '$1' : 0}
        >
          <Text fontSize="$3" color="$colorLight" letterSpacing={1}>
            {expanded ? hideLabel : showLabel}
          </Text>
          <View
            style={{
              transform: [{ rotate: expanded ? '180deg' : '0deg' }],
            }}
          >
            <SafeFontIcon name="chevron-down" size={16} color="$colorLight" />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && <View marginTop="$1">{contentWrapper ? contentWrapper(children) : children}</View>}
    </View>
  )
}

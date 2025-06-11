import React from 'react'
import { Text, View } from 'tamagui'

interface NetworkSelectorHeaderProps {
  isReadOnly: boolean
  isAllChainsSelected: boolean
  selectedChainCount: number
}

interface TitleProps {
  isReadOnly: boolean
}

interface SubtitleProps {
  isReadOnly: boolean
  isAllChainsSelected: boolean
  selectedChainCount: number
}

const Title = ({ isReadOnly }: TitleProps) => {
  const title = isReadOnly ? 'Available Networks' : 'Select Networks'

  return (
    <Text fontSize="$6" fontWeight="600" color="$color">
      {title}
    </Text>
  )
}

const Subtitle = ({ isReadOnly, isAllChainsSelected, selectedChainCount }: SubtitleProps) => {
  const prefix = isReadOnly ? 'Contact is available on' : 'Contact available on'

  return (
    <Text fontSize="$3" color="$colorSecondary" textAlign="center" marginTop="$2">
      {isAllChainsSelected
        ? `${prefix} all networks`
        : `${prefix} ${selectedChainCount} ${selectedChainCount === 1 ? 'network' : 'networks'}`}
    </Text>
  )
}

export const NetworkSelectorHeader = ({
  isReadOnly,
  isAllChainsSelected,
  selectedChainCount,
}: NetworkSelectorHeaderProps) => {
  return (
    <View alignItems="center" paddingHorizontal="$4" paddingVertical="$4">
      <Title isReadOnly={isReadOnly} />
      <Subtitle
        isReadOnly={isReadOnly}
        isAllChainsSelected={isAllChainsSelected}
        selectedChainCount={selectedChainCount}
      />
    </View>
  )
}

import React, { useState, useEffect, useCallback } from 'react'
import { View, TextInput, StyleSheet, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native'
import { SafeFontIcon } from '../SafeFontIcon'

interface SafeSearchBarProps {
  placeholder: string
  onSearch: (query: string) => void
  throttleTime?: number
}

const SafeSearchBar: React.FC<SafeSearchBarProps> = ({ placeholder, onSearch, throttleTime = 300 }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

  const throttleSearch = useCallback(
    (query: string) => {
      if (timer) {
        clearTimeout(timer)
      }

      const newTimer = setTimeout(() => {
        onSearch(query)
      }, throttleTime)

      setTimer(newTimer)
    },
    [onSearch, throttleTime, timer],
  )

  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [timer])

  const handleSearchChange = (text: string) => {
    setSearchQuery(text)
    throttleSearch(text)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    onSearch('')
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.searchBar}>
        <SafeFontIcon name="search" size={18} color="#999" />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={searchQuery}
          onChangeText={handleSearchChange}
          clearButtonMode="never"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <SafeFontIcon name="close-outlined" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#7676801F',
    paddingHorizontal: 8,
    height: 36,
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },

  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#999',
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
})

export default SafeSearchBar

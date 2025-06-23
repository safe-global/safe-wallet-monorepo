import useDebounce from '@/hooks/useDebounce'
import { Box } from '@mui/material'
import { createRef, type FormEvent, useState, useEffect, type ClipboardEvent, type KeyboardEvent } from 'react'
import css from './styles.module.css'

const digitRegExp = /^[0-9]$/
export const debounceTimer = 100

const useCodeInput = (length: number, onCodeChanged: (code: string) => void) => {
  const [code, setCode] = useState(Array.from(new Array(length)).map(() => ''))

  const [inputRefsArray] = useState(() => Array.from({ length }, () => createRef<HTMLInputElement>()))

  const focusNext = (index: number) => {
    if (index + 1 < length) {
      inputRefsArray[index + 1].current?.focus()
    }
  }

  const focusPrevious = (index: number) => {
    if (index > 0) {
      inputRefsArray[index - 1].current?.focus()
    }
  }

  const handleChange = (digit: string, index: number) => {
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)
    if (digit.length === 1) {
      focusNext(index)
    } else {
      // Go to previous element
      focusPrevious(index)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace') {
      const newCode = [...code]
      newCode[index] = ''
      setCode(newCode)
      focusPrevious(index)
      event.stopPropagation()
      event.preventDefault()
    }

    if (event.key === 'ArrowLeft') {
      focusPrevious(index)
      event.preventDefault()
    }

    if (event.key === 'ArrowRight') {
      focusNext(index)
      event.preventDefault()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    let input = event.clipboardData?.getData('text')
    if (!input) {
      return
    }
    const trimmedInput = input.trim()
    if (trimmedInput.length === length) {
      const newCode = trimmedInput.split('')
      if (!newCode.some((digit) => !digitRegExp.test(digit))) {
        setCode(newCode)
      }
    }
  }

  // We debounce the input because pasting a code will trigger many onInput events
  // This also gives the user the chance to see the fully input code
  const debouncedCode = useDebounce(code, debounceTimer)

  useEffect(() => {
    // Submit input if complete and valid
    if (!debouncedCode.some((digit) => !digitRegExp.test(digit))) {
      // There is no character that's not a digit, we invoke the callback
      onCodeChanged(debouncedCode.join(''))
    } else {
      onCodeChanged('')
    }
  }, [debouncedCode, onCodeChanged])

  return { code, handleChange, handlePaste, inputRefsArray, handleKeyDown }
}

const CodeInput = ({ length, onCodeChanged }: { length: number; onCodeChanged: (code: string) => void }) => {
  const { code, handleChange, handlePaste, inputRefsArray, handleKeyDown } = useCodeInput(length, onCodeChanged)
  // create a array of refs
  const onInput = (event: FormEvent<HTMLInputElement>, index: number) => {
    const value = event.currentTarget.value
    handleChange(value, index)
  }

  const onFocus = (event: FormEvent<HTMLInputElement>) => {
    event.currentTarget.select()
  }

  return (
    <Box display="inline-flex" gap={2}>
      {inputRefsArray.map((ref, idx) => (
        <input
          className={css.codeDigit}
          value={code[idx]}
          required
          ref={ref}
          onFocus={onFocus}
          onPaste={handlePaste}
          onKeyDown={(event) => handleKeyDown(event, idx)}
          onInput={(event) => onInput(event, idx)}
          data-testid={`digit-${idx}`}
          key={`digit-${idx}`}
          maxLength={1}
        />
      ))}
    </Box>
  )
}

export default CodeInput

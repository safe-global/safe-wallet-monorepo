import { sanitizeInputValue, containsScriptInjection } from './input'

describe('sanitizeInputValue', () => {
  it('should remove script tags', () => {
    expect(sanitizeInputValue('<script>alert("xss")</script>')).toBe('')
    expect(sanitizeInputValue('hello<script>alert(1)</script>world')).toBe('helloworld')
  })

  it('should remove script tags with attributes', () => {
    expect(sanitizeInputValue('<script type="text/javascript">alert(1)</script>')).toBe('')
  })

  it('should remove unclosed script tags', () => {
    expect(sanitizeInputValue('<script>alert(1)')).toBe('')
  })

  it('should remove inline event handlers', () => {
    expect(sanitizeInputValue('<img onerror="alert(1)">')).toBe('<img >')
    expect(sanitizeInputValue('<div onclick="steal()">')).toBe('<div >')
    expect(sanitizeInputValue('<body onload="malicious()">')).toBe('<body >')
  })

  it('should handle event handlers with single quotes', () => {
    expect(sanitizeInputValue("<img onerror='alert(1)'>")).toBe('<img >')
  })

  it('should not modify normal text', () => {
    expect(sanitizeInputValue('My Safe Wallet')).toBe('My Safe Wallet')
    expect(sanitizeInputValue('hello@example.com')).toBe('hello@example.com')
    expect(sanitizeInputValue('0x1234abcd')).toBe('0x1234abcd')
  })

  it('should not modify text with angle brackets in non-script context', () => {
    expect(sanitizeInputValue('a < b > c')).toBe('a < b > c')
    expect(sanitizeInputValue('5 > 3')).toBe('5 > 3')
  })

  it('should handle empty string', () => {
    expect(sanitizeInputValue('')).toBe('')
  })

  it('should be case insensitive for script tags', () => {
    expect(sanitizeInputValue('<SCRIPT>alert(1)</SCRIPT>')).toBe('')
    expect(sanitizeInputValue('<Script>alert(1)</Script>')).toBe('')
  })
})

describe('containsScriptInjection', () => {
  it('should detect script tags', () => {
    expect(containsScriptInjection('<script>alert(1)</script>')).toBe(true)
    expect(containsScriptInjection('hello<script>alert(1)</script>')).toBe(true)
    expect(containsScriptInjection('<SCRIPT>alert(1)</SCRIPT>')).toBe(true)
  })

  it('should detect inline event handlers', () => {
    expect(containsScriptInjection('<img onerror="alert(1)">')).toBe(true)
    expect(containsScriptInjection('onclick="steal()"')).toBe(true)
  })

  it('should return false for normal text', () => {
    expect(containsScriptInjection('My Safe Wallet')).toBe(false)
    expect(containsScriptInjection('hello@example.com')).toBe(false)
    expect(containsScriptInjection('0x1234abcd')).toBe(false)
    expect(containsScriptInjection('')).toBe(false)
  })
})

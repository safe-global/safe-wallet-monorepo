import { isIpOrLocalhostUrl, isHttpsUrl } from './url'

describe('url utilities', () => {
  describe('isIpOrLocalhostUrl', () => {
    it('should return true for localhost', () => {
      expect(isIpOrLocalhostUrl('http://localhost:3000')).toBe(true)
      expect(isIpOrLocalhostUrl('https://localhost')).toBe(true)
    })

    it('should return true for 127.0.0.1', () => {
      expect(isIpOrLocalhostUrl('http://127.0.0.1:8080')).toBe(true)
      expect(isIpOrLocalhostUrl('https://127.0.0.1')).toBe(true)
    })

    it('should return true for private IP ranges', () => {
      expect(isIpOrLocalhostUrl('http://192.168.1.1')).toBe(true)
      expect(isIpOrLocalhostUrl('http://10.0.0.1')).toBe(true)
      expect(isIpOrLocalhostUrl('http://172.16.0.1')).toBe(true)
    })

    it('should return false for public domains', () => {
      expect(isIpOrLocalhostUrl('https://safe.global')).toBe(false)
      expect(isIpOrLocalhostUrl('https://app.safe.global')).toBe(false)
      expect(isIpOrLocalhostUrl('https://google.com')).toBe(false)
    })

    it('should return false for invalid URLs', () => {
      expect(isIpOrLocalhostUrl('not-a-url')).toBe(false)
      expect(isIpOrLocalhostUrl('')).toBe(false)
    })

    it('should return false for public IP addresses', () => {
      expect(isIpOrLocalhostUrl('http://8.8.8.8')).toBe(false)
      expect(isIpOrLocalhostUrl('http://1.1.1.1')).toBe(false)
    })
  })

  describe('isHttpsUrl', () => {
    it('should return true for HTTPS URLs', () => {
      expect(isHttpsUrl('https://safe.global')).toBe(true)
      expect(isHttpsUrl('https://app.safe.global')).toBe(true)
      expect(isHttpsUrl('https://localhost:3000')).toBe(true)
      expect(isHttpsUrl('https://192.168.1.1')).toBe(true)
    })

    it('should return false for HTTP URLs', () => {
      expect(isHttpsUrl('http://safe.global')).toBe(false)
      expect(isHttpsUrl('http://localhost:3000')).toBe(false)
      expect(isHttpsUrl('http://192.168.1.1')).toBe(false)
    })

    it('should return false for other protocols', () => {
      expect(isHttpsUrl('ftp://example.com')).toBe(false)
      expect(isHttpsUrl('ws://example.com')).toBe(false)
      expect(isHttpsUrl('file:///path/to/file')).toBe(false)
    })

    it('should return false for invalid URLs', () => {
      expect(isHttpsUrl('not-a-url')).toBe(false)
      expect(isHttpsUrl('')).toBe(false)
      expect(isHttpsUrl('just-text')).toBe(false)
    })
  })
})

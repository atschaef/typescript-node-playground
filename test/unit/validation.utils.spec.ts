import { expect } from 'chai'

import { validateAndFormatPublicUrl } from '../../src/utils/validation.utils'

describe('-- Validation utils --', () => {
  describe('validateAndFormatPublicUrl', () => {
    it('should validate public urls', () => {
      expect(validateAndFormatPublicUrl('')).to.equal(null)
      expect(validateAndFormatPublicUrl('http://www.google.com')).to.equal('http://www.google.com')
      expect(validateAndFormatPublicUrl('https://www.google.com')).to.equal('https://www.google.com')
      expect(validateAndFormatPublicUrl('//www.google.com')).to.equal('http://www.google.com')
      expect(validateAndFormatPublicUrl('google.com')).to.equal('http://google.com')
      expect(validateAndFormatPublicUrl('www.google.com')).to.equal('http://www.google.com')
    })
  })
})

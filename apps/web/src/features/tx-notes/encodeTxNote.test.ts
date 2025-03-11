import { faker } from '@faker-js/faker'
import { encodeTxNote } from './encodeTxNote'

describe('encodeTxNote', () => {
  it('should encode tx note with an existing origin', () => {
    const note = faker.lorem.sentence()
    const url = faker.internet.url()
    const origin = JSON.stringify({ url })
    const result = encodeTxNote(note, origin)
    expect(result).toEqual(JSON.stringify({ url, note }, null, 0))
  })

  it('should encode tx note with an empty origin', () => {
    const note = faker.lorem.sentence()
    const result = encodeTxNote(note)
    expect(result).toEqual(JSON.stringify({ note }, null, 0))
  })

  it('should encode tx note with an invalid origin', () => {
    const note = faker.lorem.sentence()
    const result = encodeTxNote(note, 'sdfgdsfg')
    expect(result).toEqual(JSON.stringify({ note }, null, 0))
  })

  it('should trim the note if origin exceeds the max length', () => {
    const note = 'a'.repeat(200)
    const url = 'http://example.com'
    const result = encodeTxNote(note, JSON.stringify({ url }))
    expect(result).toEqual(JSON.stringify({ url, note: 'a'.repeat(172) }, null, 0))
  })

  it('should sanitize the note', () => {
    const note = '<b>hello<b>'
    const result = encodeTxNote(note)
    expect(result).toEqual(JSON.stringify({ note: 'hello' }, null, 0))
  })
})

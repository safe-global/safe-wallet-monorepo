import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkSlotDir, getJestWorkers, getSlotCount, isProcessAlive, joinQueue, readQueue } from './verify-slots.mjs'

const GIB = 1024 ** 3
const isPosix = process.platform !== 'win32'

let baseDir
let dir

beforeEach(() => {
  baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-slots-test-'))
  dir = path.join(baseDir, 'slots')
})

afterEach(() => {
  fs.rmSync(baseDir, { recursive: true, force: true })
})

function writeEntry(pid, startedAt, extra = {}) {
  fs.writeFileSync(
    path.join(dir, `${pid}.json`),
    JSON.stringify({ pid, startedAt, cwd: '/repo', workspace: 'web', ...extra }),
  )
}

function fakeClock(start = 1_000_000) {
  let time = start
  return {
    now: () => time,
    sleep: async (ms) => {
      time += ms
    },
  }
}

describe('getSlotCount', () => {
  it('gives one slot per 16 GiB, clamped to 1–4', () => {
    assert.equal(getSlotCount(8 * GIB), 1)
    assert.equal(getSlotCount(16 * GIB), 1)
    assert.equal(getSlotCount(36 * GIB), 2)
    assert.equal(getSlotCount(64 * GIB), 4)
    assert.equal(getSlotCount(256 * GIB), 4)
  })

  it('uses VERIFY_MAX_PARALLEL when it is set', () => {
    assert.equal(getSlotCount(8 * GIB, '6'), 6)
    assert.equal(getSlotCount(36 * GIB, ''), 2)
  })

  it('rejects an override that is not a positive integer', () => {
    for (const value of ['0', '-1', '1.5', 'two']) {
      assert.throws(() => getSlotCount(36 * GIB, value), /VERIFY_MAX_PARALLEL must be a positive integer/)
    }
  })
})

describe('getJestWorkers', () => {
  it('splits half of the cores between the slots, with at least one worker', () => {
    assert.equal(getJestWorkers(14, 2), 3)
    assert.equal(getJestWorkers(8, 1), 4)
    assert.equal(getJestWorkers(2, 4), 1)
  })
})

describe('isProcessAlive', () => {
  it('detects the current process and a process that does not exist', () => {
    assert.equal(isProcessAlive(process.pid), true)
    assert.equal(isProcessAlive(2 ** 22 + 12345), false)
  })
})

describe('checkSlotDir', () => {
  it('creates a private directory', () => {
    assert.equal(checkSlotDir(dir), null)
    if (isPosix) assert.equal(fs.statSync(dir).mode & 0o777, 0o700)
  })

  it('rejects a symlink in place of the directory', () => {
    const target = path.join(baseDir, 'elsewhere')
    fs.mkdirSync(target)
    fs.symlinkSync(target, dir)
    assert.match(checkSlotDir(dir), /not a directory/)
  })

  it('rejects a file in place of the directory', () => {
    fs.writeFileSync(dir, '')
    assert.match(checkSlotDir(dir), /not a directory/)
  })

  it('rejects a directory that other users can write to', { skip: !isPosix }, () => {
    fs.mkdirSync(dir)
    fs.chmodSync(dir, 0o777)
    assert.match(checkSlotDir(dir), /writable by other users/)
  })

  it('rejects a directory owned by another user', { skip: !isPosix }, (t) => {
    fs.mkdirSync(dir, { mode: 0o700 })
    const otherUid = process.getuid() + 1
    t.mock.method(process, 'getuid', () => otherUid)
    assert.match(checkSlotDir(dir), /owned by another user/)
  })
})

describe('readQueue', () => {
  const options = (overrides = {}) => ({ now: () => 2000, isAlive: () => true, staleAfterMs: 10_000, ...overrides })

  beforeEach(() => fs.mkdirSync(dir))

  it('returns live entries in start order', () => {
    writeEntry(30, 1500)
    writeEntry(20, 1000)
    writeEntry(10, 1000)
    assert.deepEqual(
      readQueue(dir, options()).map((e) => e.pid),
      [10, 20, 30],
    )
  })

  it('deletes entries of dead processes', () => {
    writeEntry(10, 1000)
    writeEntry(20, 1000)
    const queue = readQueue(dir, options({ isAlive: (pid) => pid !== 10 }))
    assert.deepEqual(
      queue.map((e) => e.pid),
      [20],
    )
    assert.equal(fs.existsSync(path.join(dir, '10.json')), false)
  })

  it('deletes entries older than the stale limit', () => {
    writeEntry(10, 0)
    assert.deepEqual(readQueue(dir, options({ now: () => 20_000 })), [])
    assert.equal(fs.existsSync(path.join(dir, '10.json')), false)
  })

  it('deletes entries that do not parse or have an invalid pid', () => {
    fs.writeFileSync(path.join(dir, '1.json'), 'not json')
    fs.writeFileSync(path.join(dir, '2.json'), JSON.stringify({ pid: '2; rm -rf /', startedAt: 1000 }))
    fs.writeFileSync(path.join(dir, '3.json'), JSON.stringify({ pid: -1, startedAt: 1000 }))
    fs.writeFileSync(path.join(dir, '4.json'), JSON.stringify({ pid: 4 }))
    assert.deepEqual(readQueue(dir, options()), [])
    assert.deepEqual(fs.readdirSync(dir), [])
  })

  it('ignores files that are not queue entries', () => {
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'x')
    assert.deepEqual(readQueue(dir, options()), [])
    assert.deepEqual(fs.readdirSync(dir), ['notes.txt'])
  })
})

describe('joinQueue', () => {
  beforeEach(() => fs.mkdirSync(dir))

  const baseOptions = (overrides = {}) => ({
    dir,
    slots: 2,
    info: { cwd: '/repo', workspace: 'web' },
    pid: 99,
    isAlive: () => true,
    log: () => {},
    ...fakeClock(),
    ...overrides,
  })

  const acquire = async (options) => {
    const ticket = joinQueue(options)
    await ticket.waitForTurn()
    return ticket.release
  }

  it('adds its entry before the wait starts, so a release during the wait removes it', async () => {
    writeEntry(10, 1)
    writeEntry(20, 2)
    const ticket = joinQueue(baseOptions())
    assert.equal(fs.existsSync(path.join(dir, '99.json')), true)
    ticket.release()
    assert.equal(fs.existsSync(path.join(dir, '99.json')), false)
  })

  it('takes a free slot at once and releases it', async () => {
    const release = await acquire(baseOptions())
    assert.deepEqual(fs.readdirSync(dir), ['99.json'])
    release()
    release()
    assert.deepEqual(fs.readdirSync(dir), [])
  })

  it('replaces a leftover entry with its own pid', async () => {
    writeEntry(99, 0)
    const release = await acquire(baseOptions())
    const entry = JSON.parse(fs.readFileSync(path.join(dir, '99.json'), 'utf-8'))
    assert.equal(entry.startedAt, 1_000_000)
    release()
  })

  it('waits while the slots are full and starts when one is released', async () => {
    writeEntry(10, 1)
    writeEntry(20, 2)
    const clock = fakeClock()
    const messages = []
    let polls = 0
    const release = await acquire(
      baseOptions({
        ...clock,
        log: (message) => messages.push(message),
        sleep: async (ms) => {
          polls += 1
          if (polls === 3) fs.rmSync(path.join(dir, '10.json'))
          await clock.sleep(ms)
        },
      }),
    )
    assert.equal(polls, 3)
    assert.equal(messages.length, 1)
    assert.match(messages[0], /waiting for a free slot \(2 allowed; ahead: pid 10 web in \/repo, pid 20 web/)
    release()
  })

  it('takes the slot of a dead process without waiting', async () => {
    writeEntry(10, 1)
    writeEntry(20, 2)
    let polls = 0
    const release = await acquire(
      baseOptions({
        isAlive: (pid) => pid !== 10,
        sleep: async () => {
          polls += 1
        },
      }),
    )
    assert.equal(polls, 0)
    release()
  })

  it('does not count runs that started later', async () => {
    writeEntry(10, 1)
    writeEntry(20, 2_000_000)
    writeEntry(30, 2_000_001)
    const release = await acquire(baseOptions())
    release()
  })

  it('fails with the queue and a fix when the wait is too long, and removes its entry', async () => {
    writeEntry(10, 1)
    writeEntry(20, 2)
    await assert.rejects(acquire(baseOptions({ maxWaitMs: 5000, pollMs: 2000, staleAfterMs: 10 ** 9 })), (err) => {
      assert.match(err.message, /no free slot after 0 min/)
      assert.match(err.message, /pid 10 web in \/repo/)
      assert.match(err.message, /delete .*slots/)
      assert.match(err.message, /VERIFY_MAX_PARALLEL/)
      return true
    })
    assert.equal(fs.existsSync(path.join(dir, '99.json')), false)
  })

  it('strips control characters from entries shown to the user', async () => {
    writeEntry(10, 1, { cwd: '/repo\u001b[2J\u0007' })
    const messages = []
    await assert.rejects(
      acquire(baseOptions({ slots: 1, maxWaitMs: 0, staleAfterMs: 10 ** 9, log: (message) => messages.push(message) })),
      (err) => {
        assert.doesNotMatch(err.message, /[\u0000-\u001f]/)
        assert.match(err.message, /in \/repo\[2J/)
        return true
      },
    )
  })
})

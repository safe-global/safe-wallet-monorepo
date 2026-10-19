import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as sleepMs } from 'node:timers/promises'
import { acquireSlot, checkSlotDir, getJestWorkers, getSlotCount, isProcessAlive } from './verify-slots.mjs'

const GIB = 1024 ** 3
const isPosix = process.platform !== 'win32'
const START = 1_000_000_000

let baseDir
let dir

beforeEach(() => {
  baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-slots-test-'))
  dir = path.join(baseDir, 'slots')
})

afterEach(() => {
  fs.rmSync(baseDir, { recursive: true, force: true })
})

const slotFile = (n) => path.join(dir, `slot-${n}.json`)

function touch(file, timeMs) {
  fs.utimesSync(file, timeMs / 1000, timeMs / 1000)
}

function writeSlot(n, pid, heartbeatAt, extra = {}) {
  fs.writeFileSync(slotFile(n), JSON.stringify({ pid, cwd: '/repo', workspace: 'web', ...extra }))
  touch(slotFile(n), heartbeatAt)
}

function fakeClock() {
  let time = START
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

describe('acquireSlot', () => {
  beforeEach(() => fs.mkdirSync(dir))

  const options = (overrides = {}) => ({
    dir,
    slots: 2,
    info: { cwd: '/repo', workspace: 'web' },
    pid: 99,
    isAlive: () => true,
    log: () => {},
    ...fakeClock(),
    ...overrides,
  })

  it('takes a free slot at once, leaves no ticket, and releases the slot', async () => {
    const release = await acquireSlot(options())
    assert.deepEqual(fs.readdirSync(dir), ['slot-0.json'])
    assert.equal(JSON.parse(fs.readFileSync(slotFile(0), 'utf-8')).pid, 99)

    release()
    release()
    assert.deepEqual(fs.readdirSync(dir), [])
  })

  it('never gives one slot to two runs', async () => {
    const releaseFirst = await acquireSlot(options({ slots: 1, pid: 1 }))
    await assert.rejects(acquireSlot(options({ slots: 1, pid: 2, maxWaitMs: 0 })), /no free slot/)
    assert.equal(JSON.parse(fs.readFileSync(slotFile(0), 'utf-8')).pid, 1)
    releaseFirst()
  })

  it('waits while all slots are in use and takes the one that is released', async () => {
    writeSlot(0, 10, START)
    writeSlot(1, 20, START)
    const clock = fakeClock()
    const messages = []
    let polls = 0
    const release = await acquireSlot(
      options({
        ...clock,
        log: (message) => messages.push(message),
        sleep: async (ms) => {
          polls += 1
          if (polls === 3) fs.rmSync(slotFile(1))
          await clock.sleep(ms)
        },
      }),
    )
    assert.equal(polls, 3)
    assert.deepEqual(messages, ['verify: waiting for a free slot (2 in use: pid 10 web in /repo, pid 20 web in /repo)'])
    assert.equal(JSON.parse(fs.readFileSync(slotFile(1), 'utf-8')).pid, 99)
    release()
  })

  it('takes the slot of a dead process without waiting', async () => {
    writeSlot(0, 10, START)
    writeSlot(1, 20, START)
    const release = await acquireSlot(options({ isAlive: (pid) => pid !== 10, sleep: () => assert.fail('waited') }))
    assert.equal(JSON.parse(fs.readFileSync(slotFile(0), 'utf-8')).pid, 99)
    release()
  })

  it('keeps the slot of a live run that keeps its heartbeat, however long it runs', async () => {
    writeSlot(0, 10, START)
    const clock = fakeClock()
    await assert.rejects(
      acquireSlot(
        options({
          ...clock,
          slots: 1,
          staleAfterMs: 60_000,
          maxWaitMs: 10 * 60_000,
          sleep: async (ms) => {
            await clock.sleep(ms)
            touch(slotFile(0), clock.now())
          },
        }),
      ),
      /no free slot after 10 min/,
    )
    assert.equal(JSON.parse(fs.readFileSync(slotFile(0), 'utf-8')).pid, 10)
  })

  it('takes a slot whose heartbeat stopped, even when its PID is in use again', async () => {
    writeSlot(0, 10, START - 3 * 60_000)
    const release = await acquireSlot(options({ slots: 1, staleAfterMs: 2 * 60_000 }))
    assert.equal(JSON.parse(fs.readFileSync(slotFile(0), 'utf-8')).pid, 99)
    release()
  })

  it('takes a slot whose file does not parse or has an invalid pid', async () => {
    fs.writeFileSync(slotFile(0), 'not json')
    fs.writeFileSync(slotFile(1), JSON.stringify({ pid: '1; rm -rf /' }))
    const releaseA = await acquireSlot(options({ pid: 1 }))
    const releaseB = await acquireSlot(options({ pid: 2 }))
    assert.deepEqual([0, 1].map((n) => JSON.parse(fs.readFileSync(slotFile(n), 'utf-8')).pid).sort(), [1, 2])
    releaseA()
    releaseB()
  })

  it('updates the heartbeat while it holds the slot', async () => {
    const clock = fakeClock()
    const release = await acquireSlot(options({ ...clock, heartbeatMs: 5 }))
    await clock.sleep(30_000)
    await sleepMs(50)
    assert.equal(Math.round(fs.statSync(slotFile(0)).mtimeMs), START + 30_000)
    release()
  })

  it('does not release or refresh a slot that another run took over', async () => {
    const clock = fakeClock()
    const release = await acquireSlot(options({ ...clock, slots: 1, heartbeatMs: 5 }))
    fs.rmSync(slotFile(0))
    writeSlot(0, 10, START)

    await clock.sleep(30_000)
    await sleepMs(50)
    assert.equal(Math.round(fs.statSync(slotFile(0)).mtimeMs), START)

    release()
    assert.equal(JSON.parse(fs.readFileSync(slotFile(0), 'utf-8')).pid, 10)
  })

  it('fails with the holders and a fix when the wait is too long, and leaves no ticket', async () => {
    writeSlot(0, 10, START)
    writeSlot(1, 20, START)
    await assert.rejects(acquireSlot(options({ maxWaitMs: 5000 })), (err) => {
      assert.match(err.message, /no free slot after 0 min/)
      assert.match(err.message, /pid 10 web in \/repo, pid 20 web in \/repo/)
      assert.match(err.message, /delete .*slots/)
      assert.match(err.message, /VERIFY_MAX_PARALLEL/)
      return true
    })
    assert.deepEqual(fs.readdirSync(dir).sort(), ['slot-0.json', 'slot-1.json'])
  })

  it('strips control characters from slot files shown to the user', async () => {
    writeSlot(0, 10, START, { cwd: '/repo\u001b[2J\u0007' })
    await assert.rejects(acquireSlot(options({ slots: 1, maxWaitMs: 0 })), (err) => {
      assert.doesNotMatch(err.message, /[\u0000-\u001f]/)
      assert.match(err.message, /in \/repo\[2J/)
      return true
    })
  })
})

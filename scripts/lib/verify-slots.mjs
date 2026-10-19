import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as sleepMs } from 'node:timers/promises'

const GIB = 1024 ** 3
const MEMORY_PER_SLOT_GIB = 16
const MAX_DEFAULT_SLOTS = 4
const HEARTBEAT_MS = 15 * 1000
const STALE_AFTER_MS = 2 * 60 * 1000
const MAX_WAIT_MS = 20 * 60 * 1000
const POLL_MS = 2000

export const DEFAULT_SLOT_DIR = path.join(os.tmpdir(), 'safe-wallet-verify')

/**
 * Number of verify runs allowed at the same time on this machine.
 *
 * Args:
 *   totalMemBytes: Total machine memory (os.totalmem()).
 *   override: Value of VERIFY_MAX_PARALLEL, if set.
 *
 * Returns:
 *   The override, or one slot per 16 GiB of memory, clamped to 1–4.
 */
export function getSlotCount(totalMemBytes, override) {
  if (override !== undefined && override !== '') {
    const parsed = Number(override)
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error(`VERIFY_MAX_PARALLEL must be a positive integer, got "${override}"`)
    }
    return parsed
  }
  const bySize = Math.floor(totalMemBytes / GIB / MEMORY_PER_SLOT_GIB)
  return Math.min(MAX_DEFAULT_SLOTS, Math.max(1, bySize))
}

/** Jest workers per run, so that all parallel runs together use about half of the cores. */
export function getJestWorkers(cpuCount, slotCount) {
  return Math.max(1, Math.floor(cpuCount / (2 * slotCount)))
}

export function isProcessAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    // EPERM: the process exists but belongs to another user
    return err.code === 'EPERM'
  }
}

/**
 * Creates the slot directory and checks that only the current user controls it.
 *
 * Returns:
 *   null when the directory is safe to use, otherwise the reason it is not.
 */
export function checkSlotDir(dir) {
  try {
    fs.mkdirSync(dir, { mode: 0o700 })
  } catch (err) {
    if (err.code !== 'EEXIST') return `cannot create ${dir}: ${err.message}`
  }

  const stat = fs.lstatSync(dir)
  if (!stat.isDirectory()) return `${dir} is not a directory (symlink or file)`
  if (process.platform === 'win32') return null
  if (stat.uid !== process.getuid()) return `${dir} is owned by another user`
  if ((stat.mode & 0o022) !== 0) return `${dir} is writable by other users`
  return null
}

function ignoreMissing(action) {
  try {
    return action()
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    return null
  }
}

function parseHolder(content) {
  try {
    const data = JSON.parse(content)
    if (!Number.isInteger(data.pid) || data.pid < 1) return null
    return { pid: data.pid, cwd: String(data.cwd ?? ''), workspace: String(data.workspace ?? '') }
  } catch {
    return null
  }
}

/** Reads a slot file. Returns null when the slot is free. */
function readSlot(file) {
  return ignoreMissing(() => {
    const { ino, mtimeMs } = fs.statSync(file)
    return { ino, mtimeMs, holder: parseHolder(fs.readFileSync(file, 'utf-8')) }
  })
}

/** Deletes the slot file only if it is still the one that was read, not a slot another run just took. */
function removeIfSame(file, ino) {
  ignoreMissing(() => {
    if (fs.statSync(file).ino === ino) fs.rmSync(file, { force: true })
  })
}

function touch(file, timeMs) {
  const time = timeMs / 1000
  fs.utimesSync(file, time, time)
}

/** Takes the slot atomically: link() fails with EEXIST when another run holds it. */
function tryTake(file, ticket) {
  try {
    fs.linkSync(ticket, file)
    return true
  } catch (err) {
    if (err.code === 'EEXIST') return false
    throw err
  }
}

function holdSlot(file, { now, heartbeatMs }) {
  touch(file, now())
  const { ino } = fs.statSync(file)
  const isOurs = () => ignoreMissing(() => fs.statSync(file).ino === ino)

  const heartbeat = setInterval(() => {
    if (isOurs()) touch(file, now())
  }, heartbeatMs)
  heartbeat.unref()

  return () => {
    clearInterval(heartbeat)
    removeIfSame(file, ino)
  }
}

function sanitize(text) {
  // Slot files are untrusted: strip terminal escape codes before printing
  return text.replace(/[\u0000-\u001f\u007f]/g, '')
}

function describe(holders) {
  return holders.map((h) => `pid ${h.pid} ${sanitize(h.workspace)} in ${sanitize(h.cwd)}`).join(', ')
}

/**
 * One synchronous pass over all slots. No signal handler can run inside it, so the ticket never stays behind.
 *
 * Returns:
 *   { release } when a slot was taken, otherwise { holders } of the slots in use.
 */
function tryAllSlots({ dir, slots, pid, info, now, isAlive, staleAfterMs, heartbeatMs }) {
  const ticket = path.join(dir, `.${pid}.ticket`)
  fs.writeFileSync(ticket, JSON.stringify({ pid, ...info }), { mode: 0o600 })
  try {
    const holders = []
    for (let n = 0; n < slots; n++) {
      const file = path.join(dir, `slot-${n}.json`)
      if (tryTake(file, ticket)) return { release: holdSlot(file, { now, heartbeatMs }) }

      const slot = readSlot(file)
      if (!slot) continue
      const isStale = !slot.holder || !isAlive(slot.holder.pid) || now() - slot.mtimeMs > staleAfterMs
      if (isStale) removeIfSame(file, slot.ino)
      else holders.push(slot.holder)
    }
    return { holders }
  } finally {
    fs.rmSync(ticket, { force: true })
  }
}

/**
 * Waits for a free slot and takes it. A slot is free when its file is missing, its holder is dead,
 * or its holder stopped the heartbeat (a dead process whose PID the system reused).
 *
 * Args:
 *   options.dir: Slot directory; must pass checkSlotDir().
 *   options.slots: Number of runs allowed at the same time.
 *   options.info: { cwd, workspace } shown to runs that wait.
 *   options.now, options.sleep, options.isAlive, options.log, options.pid: Overrides for tests.
 *
 * Returns:
 *   A release function. It is safe to call more than once.
 *
 * Throws:
 *   When no slot becomes free within the maximum wait time.
 */
export async function acquireSlot(options) {
  const context = {
    now: Date.now,
    sleep: sleepMs,
    isAlive: isProcessAlive,
    log: console.log,
    pid: process.pid,
    maxWaitMs: MAX_WAIT_MS,
    staleAfterMs: STALE_AFTER_MS,
    heartbeatMs: HEARTBEAT_MS,
    pollMs: POLL_MS,
    ...options,
  }
  const { dir, slots, now, sleep, log, maxWaitMs, pollMs } = context
  const waitStart = now()
  let hasAnnounced = false

  while (true) {
    const { release, holders } = tryAllSlots(context)
    if (release) return release
    // A stale slot was cleared during the pass: try again at once
    if (holders.length < slots) continue

    if (now() - waitStart > maxWaitMs) {
      throw new Error(
        `verify: no free slot after ${Math.round(maxWaitMs / 60000)} min. In use: ${describe(holders)}. ` +
          `If these runs are gone, delete ${dir}. Set VERIFY_MAX_PARALLEL to change the limit (now ${slots}).`,
      )
    }
    if (!hasAnnounced) {
      log(`verify: waiting for a free slot (${slots} in use: ${describe(holders)})`)
      hasAnnounced = true
    }
    await sleep(pollMs)
  }
}

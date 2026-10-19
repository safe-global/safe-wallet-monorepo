import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as sleepMs } from 'node:timers/promises'

const GIB = 1024 ** 3
const MEMORY_PER_SLOT_GIB = 16
const MAX_DEFAULT_SLOTS = 4
const STALE_AFTER_MS = 30 * 60 * 1000
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

function parseEntry(content) {
  try {
    const data = JSON.parse(content)
    if (!Number.isInteger(data.pid) || data.pid < 1 || typeof data.startedAt !== 'number') return null
    return {
      pid: data.pid,
      startedAt: data.startedAt,
      cwd: String(data.cwd ?? ''),
      workspace: String(data.workspace ?? ''),
    }
  } catch {
    return null
  }
}

function readEntry(file) {
  try {
    return { content: fs.readFileSync(file, 'utf-8') }
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

/** Reads the queue, deletes entries of dead or old runs, and returns the rest in start order. */
export function readQueue(dir, { now, isAlive, staleAfterMs }) {
  const queue = []
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue
    const file = path.join(dir, name)
    const raw = readEntry(file)
    if (!raw) continue

    const entry = parseEntry(raw.content)
    const isStale = !entry || !isAlive(entry.pid) || now() - entry.startedAt > staleAfterMs
    if (isStale) {
      fs.rmSync(file, { force: true })
      continue
    }
    queue.push(entry)
  }
  return queue.sort((a, b) => a.startedAt - b.startedAt || a.pid - b.pid)
}

function sanitize(text) {
  // Lock files are untrusted: strip terminal escape codes before printing
  return text.replace(/[\u0000-\u001f\u007f]/g, '')
}

function describeQueue(queue) {
  return queue.map((e) => `pid ${e.pid} ${sanitize(e.workspace)} in ${sanitize(e.cwd)}`).join(', ')
}

/**
 * Adds this process to the queue. The caller gets `release` at once, so that a signal
 * during the wait can still remove the entry.
 *
 * Args:
 *   options.dir: Slot directory; must pass checkSlotDir().
 *   options.slots: Number of runs allowed at the same time.
 *   options.info: { cwd, workspace } shown to runs that wait.
 *   options.now, options.sleep, options.isAlive, options.log, options.pid: Overrides for tests.
 *
 * Returns:
 *   { release, waitForTurn }. `release` is safe to call more than once. `waitForTurn` resolves
 *   when this process is among the first `slots` runs, and rejects (after release) when no
 *   slot becomes free within the maximum wait time.
 */
export function joinQueue(options) {
  const {
    dir,
    slots,
    info,
    now = Date.now,
    sleep = sleepMs,
    isAlive = isProcessAlive,
    log = console.log,
    pid = process.pid,
    maxWaitMs = MAX_WAIT_MS,
    staleAfterMs = STALE_AFTER_MS,
    pollMs = POLL_MS,
  } = options

  const ownFile = path.join(dir, `${pid}.json`)
  const startedAt = now()
  // A file with our own PID can only come from a dead process with a reused PID
  fs.rmSync(ownFile, { force: true })
  fs.writeFileSync(ownFile, JSON.stringify({ pid, startedAt, ...info }), { flag: 'wx', mode: 0o600 })
  const release = () => fs.rmSync(ownFile, { force: true })

  const waitForTurn = async () => {
    let hasAnnounced = false
    while (true) {
      const queue = readQueue(dir, { now, isAlive, staleAfterMs })
      const ahead = queue.filter((e) => e.startedAt < startedAt || (e.startedAt === startedAt && e.pid < pid))
      if (ahead.length < slots) return

      if (now() - startedAt > maxWaitMs) {
        release()
        throw new Error(
          `verify: no free slot after ${Math.round(maxWaitMs / 60000)} min. Runs ahead: ${describeQueue(ahead)}. ` +
            `If these runs are gone, delete ${dir}. Set VERIFY_MAX_PARALLEL to change the limit (now ${slots}).`,
        )
      }
      if (!hasAnnounced) {
        log(`verify: waiting for a free slot (${slots} allowed; ahead: ${describeQueue(ahead)})`)
        hasAnnounced = true
      }
      await sleep(pollMs)
    }
  }

  return { release, waitForTurn }
}

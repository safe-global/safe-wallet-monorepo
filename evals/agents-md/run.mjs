#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process'
import { appendFileSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

const MODEL = process.env.AGENTS_EVAL_MODEL || 'opus'
const AGENT_TOOLS = 'Read,Edit,Write,Glob,Grep'
const MAX_DIFF_CHARS = 200_000

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const casesDir = join(repoRoot, 'evals/agents-md/cases')

function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function runClaude(cwd, args, prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'claude',
      ['-p', '--model', MODEL, '--no-session-persistence', '--output-format', 'json', ...args],
      {
        cwd,
        stdio: ['pipe', 'pipe', 'inherit'],
      },
    )
    let stdout = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`claude exited with code ${code}`))
      const output = JSON.parse(stdout)
      if (output.is_error) return reject(new Error(`claude returned an error: ${output.result}`))
      resolve(output.result)
    })
    child.stdin.end(prompt)
  })
}

function createWorktree(caseName, variant) {
  const dir = mkdtempSync(join(tmpdir(), `agents-md-eval-${caseName}-${variant}-`))
  git(repoRoot, ['worktree', 'add', '--quiet', '--detach', dir, 'HEAD'])
  if (variant === 'control') {
    const contextFiles = git(dir, ['ls-files', '-z', '--', ':(glob)**/AGENTS.md', ':(glob)**/CLAUDE.md'])
      .split('\0')
      .filter(Boolean)
    git(dir, ['rm', '--quiet', '--', ...contextFiles])
    git(dir, [
      '-c',
      'user.name=agents-md-eval',
      '-c',
      'user.email=agents-md-eval@localhost',
      'commit',
      '--quiet',
      '-m',
      'control',
    ])
  }
  return dir
}

function removeWorktree(dir) {
  git(repoRoot, ['worktree', 'remove', '--force', dir])
}

async function runAgent(caseName, variant, prompt) {
  const dir = createWorktree(caseName, variant)
  try {
    await runClaude(dir, ['--tools', AGENT_TOOLS, '--permission-mode', 'acceptEdits'], prompt)
    git(dir, ['add', '--all'])
    return git(dir, ['diff', '--cached', 'HEAD'])
  } finally {
    removeWorktree(dir)
  }
}

async function judge(evalCase, diff) {
  // The judge runs outside the repository, so no AGENTS.md or CLAUDE.md is loaded, and it is not told which variant made the diff.
  const dir = mkdtempSync(join(tmpdir(), 'agents-md-eval-judge-'))
  const prompt = `You grade the result of a coding task in a monorepo. You get the task, the expected behaviour, and the diff the agent produced. Decide only whether the diff meets the expected behaviour. Ignore code quality and anything the expected behaviour does not mention.

<task>
${evalCase.prompt}
</task>

<expected_behaviour>
${evalCase.expectation}
</expected_behaviour>

<diff>
${diff.length > MAX_DIFF_CHARS ? `${diff.slice(0, MAX_DIFF_CHARS)}\n[diff cut off]` : diff || '[empty diff: the agent changed nothing]'}
</diff>

Answer with a first line that is exactly \`VERDICT: PASS\` or \`VERDICT: FAIL\`, then one short paragraph with the reason.`
  try {
    const answer = await runClaude(dir, ['--tools', ''], prompt)
    const verdict = answer.match(/^VERDICT: (PASS|FAIL)/m)
    if (!verdict) throw new Error(`judge gave no verdict: ${answer}`)
    return { pass: verdict[1] === 'PASS', reason: answer.replace(verdict[0], '').trim() }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

async function runVariant(evalCase, variant) {
  const diff = await runAgent(evalCase.name, variant, evalCase.prompt)
  const verdict = await judge(evalCase, diff)
  return { diff, ...verdict }
}

async function runCase(evalCase) {
  try {
    const [control, experiment] = await Promise.all([
      runVariant(evalCase, 'control'),
      runVariant(evalCase, 'experiment'),
    ])
    return { ...evalCase, control, experiment, ok: !control.pass && experiment.pass }
  } catch (error) {
    return { ...evalCase, error: error.message, ok: false }
  }
}

function loadCases(names) {
  const files = readdirSync(casesDir).filter((file) => file.endsWith('.json'))
  const cases = files.map((file) => ({
    name: basename(file, '.json'),
    ...JSON.parse(readFileSync(join(casesDir, file), 'utf8')),
  }))
  return names.length ? cases.filter((evalCase) => names.includes(evalCase.name)) : cases
}

function report(results) {
  for (const result of results) {
    console.log(`\n::group::${result.name}`)
    if (result.error) {
      console.log(`error: ${result.error}`)
    } else {
      for (const variant of ['control', 'experiment']) {
        console.log(
          `--- ${variant}: ${result[variant].pass ? 'PASS' : 'FAIL'}\n${result[variant].reason}\n\n${result[variant].diff}`,
        )
      }
    }
    console.log('::endgroup::')
  }

  const rows = results.map((result) =>
    result.error
      ? `| ${result.name} | error | error | ❌ ${result.error} |`
      : `| ${result.name} | ${result.control.pass ? 'PASS' : 'FAIL'} | ${result.experiment.pass ? 'PASS' : 'FAIL'} | ${result.ok ? '✅' : '❌'} |`,
  )
  const summary = [
    `AGENTS.md evals (model: ${MODEL}). A case passes when the control (no AGENTS.md or CLAUDE.md) fails and the experiment passes.`,
    '',
    '| Case | Control | Experiment | Result |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')
  console.log(`\n${summary}`)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
}

const cases = loadCases(process.argv.slice(2))
if (cases.length === 0) {
  console.error('No eval cases found')
  process.exit(1)
}
const results = await Promise.all(cases.map(runCase))
report(results)
process.exit(results.every((result) => result.ok) ? 0 : 1)

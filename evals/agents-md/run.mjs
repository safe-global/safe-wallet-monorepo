#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process'
import { appendFileSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

const MODEL = process.env.AGENTS_EVAL_MODEL || 'claude-opus-5-5'
const AGENT_TOOLS = 'Read,Edit,Write,Glob,Grep'
const MAX_DIFF_CHARS = 200_000
const MAX_SUMMARY_DIFF_CHARS = 30_000
const MIN_CASES_PER_RULE = 5
const RULE_ID_PATTERN = /^- `([A-Z][A-Z0-9_]*)`/gm
const modelsUsed = new Set()

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const casesDir = join(repoRoot, 'evals/agents-md/cases')
const rulesFile = join(repoRoot, 'AGENTS.md')

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
      Object.keys(output.modelUsage ?? {}).forEach((model) => modelsUsed.add(model))
      resolve(output.result)
    })
    child.stdin.end(prompt)
  })
}

function createWorktree(caseName, variant) {
  const dir = mkdtempSync(join(tmpdir(), `agents-md-eval-${caseName.replace('/', '-')}-${variant}-`))
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

Answer with a first line that is exactly \`VERDICT: PASS\` or \`VERDICT: FAIL\`. If the verdict is FAIL, then list each violation as one bullet: the file path, the offending code quoted in backticks, and a few words on why it breaks the expected behaviour. If the verdict is PASS, then write one short sentence on why.`
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

function loadCases(filters) {
  const ruleIds = [...readFileSync(rulesFile, 'utf8').matchAll(RULE_ID_PATTERN)].map((match) => match[1])
  const caseFolders = readdirSync(casesDir)
  const problems = [
    ...ruleIds
      .filter((ruleId) => !caseFolders.includes(ruleId))
      .map((ruleId) => `Rule ${ruleId} has no folder in evals/agents-md/cases`),
    ...caseFolders
      .filter((folder) => !ruleIds.includes(folder))
      .map((folder) => `evals/agents-md/cases/${folder} has no rule with that ID in AGENTS.md`),
  ]
  const cases = ruleIds
    .filter((ruleId) => caseFolders.includes(ruleId))
    .flatMap((ruleId) => {
      const files = readdirSync(join(casesDir, ruleId)).filter((file) => file.endsWith('.json'))
      if (files.length < MIN_CASES_PER_RULE) {
        problems.push(`Rule ${ruleId} has ${files.length} of the ${MIN_CASES_PER_RULE} required cases`)
      }
      return files.map((file) => ({
        name: `${ruleId}/${basename(file, '.json')}`,
        ...JSON.parse(readFileSync(join(casesDir, ruleId, file), 'utf8')),
      }))
    })
  if (problems.length > 0) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
  return filters.length
    ? cases.filter((evalCase) =>
        filters.some((filter) => evalCase.name === filter || evalCase.name.startsWith(`${filter}/`)),
      )
    : cases
}

const VARIANT_LABELS = { control: 'Without AGENTS.md', experiment: 'With AGENTS.md' }

function describeOutcome(result) {
  if (result.error) return `⚠️ error: ${result.error}`
  if (result.ok) return '✅ rule works'
  if (!result.experiment.pass) return '❌ rule not followed'
  return '❌ model follows it without the rule'
}

function describeVariant(variantResult) {
  return variantResult.pass ? 'follows rule' : 'breaks rule'
}

function variantDetails(result, variant) {
  const { pass, reason, diff } = result[variant]
  const shownDiff =
    diff.length > MAX_SUMMARY_DIFF_CHARS ? `${diff.slice(0, MAX_SUMMARY_DIFF_CHARS)}\n[cut off, see the job log]` : diff
  return [
    `#### ${VARIANT_LABELS[variant]}: ${describeVariant({ pass })}`,
    '',
    reason,
    '',
    '````diff',
    shownDiff || '[the agent changed nothing]',
    '````',
  ].join('\n')
}

function caseDetails(result) {
  const [ruleId, caseName] = result.name.split('/')
  return [
    `<details><summary><code>${ruleId}</code> / ${caseName}: ${describeOutcome(result)}</summary>`,
    '',
    `**Prompt:** ${result.prompt}`,
    '',
    ...(result.error ? [] : [variantDetails(result, 'control'), '', variantDetails(result, 'experiment')]),
    '',
    '</details>',
  ].join('\n')
}

function report(results) {
  for (const result of results) {
    console.log(`${describeOutcome(result)}  ${result.name}`)
    if (result.error) continue
    for (const variant of ['control', 'experiment']) {
      console.log(`::group::${result.name}: ${VARIANT_LABELS[variant]}, ${describeVariant(result[variant])}`)
      console.log(`${result[variant].reason}\n\n${result[variant].diff}`)
      console.log('::endgroup::')
    }
  }

  const rows = results.map((result) => {
    const [ruleId, caseName] = result.name.split('/')
    const variantCells = result.error
      ? '| – | – |'
      : `| ${describeVariant(result.control)} | ${describeVariant(result.experiment)} |`
    return `| \`${ruleId}\` | ${caseName} ${variantCells} ${describeOutcome(result)} |`
  })
  const table = [
    `### AGENTS.md evals`,
    '',
    `Model requested: \`${MODEL}\`. Models used: ${[...modelsUsed].map((model) => `\`${model}\``).join(', ') || 'none'}.`,
    'A case passes when the agent breaks the rule without AGENTS.md and follows it with AGENTS.md.',
    '',
    '| Rule | Case | Without AGENTS.md | With AGENTS.md | Result |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')
  console.log(`\n${table}`)
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, [table, ...results.map(caseDetails), ''].join('\n\n'))
  }
}

const cases = loadCases(process.argv.slice(2))
if (cases.length === 0) {
  console.error('No eval cases found')
  process.exit(1)
}
const results = await Promise.all(cases.map(runCase))
report(results)
// process.exit() can drop log output that is still being written to a pipe, so only set the exit code.
process.exitCode = results.every((result) => result.ok) ? 0 : 1

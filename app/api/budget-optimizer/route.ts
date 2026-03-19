import path from 'path'
import { spawn } from 'child_process'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type OptimizerMode = 'ai_optimization' | 'compare_analyze' | 'channel_cards' | 'campaign_analysis'

interface OptimizerRequestBody {
  mode: OptimizerMode
  input: Record<string, unknown>
}

interface PythonCandidate {
  command: string
  args: string[]
}

function runPythonCandidate(candidate: PythonCandidate, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(candidate.command, candidate.args, {
      cwd: process.cwd(),
      env: process.env,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', (code) => {
      if (code !== 0) {
        const message = stderr.trim() || stdout.trim() || `Python process failed with exit code ${code}`
        reject(new Error(message))
        return
      }

      resolve(stdout)
    })

    child.stdin.write(input)
    child.stdin.end()
  })
}

async function runPythonOptimizer(payload: OptimizerRequestBody): Promise<Record<string, unknown>> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'budget_optimizer.py')

  const configuredPython = process.env.PYTHON_PATH
  const candidates: PythonCandidate[] = []

  if (configuredPython) {
    candidates.push({ command: configuredPython, args: [scriptPath] })
  }

  if (process.platform === 'win32') {
    candidates.push({ command: 'python', args: [scriptPath] })
    candidates.push({ command: 'py', args: ['-3', scriptPath] })
  } else {
    candidates.push({ command: 'python3', args: [scriptPath] })
    candidates.push({ command: 'python', args: [scriptPath] })
  }

  const serializedPayload = JSON.stringify(payload)
  let lastError: unknown = null

  for (const candidate of candidates) {
    try {
      const output = await runPythonCandidate(candidate, serializedPayload)
      const parsed = JSON.parse(output) as Record<string, unknown>
      return parsed
    } catch (error) {
      lastError = error
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }

  throw new Error('Unable to execute Python optimizer.')
}

function isOptimizerMode(value: unknown): value is OptimizerMode {
  return (
    value === 'ai_optimization' ||
    value === 'compare_analyze' ||
    value === 'channel_cards' ||
    value === 'campaign_analysis'
  )
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()

    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 })
    }

    const maybeBody = rawBody as Partial<OptimizerRequestBody>

    if (!isOptimizerMode(maybeBody.mode)) {
      return NextResponse.json(
        {
          success: false,
          error: "'mode' must be 'ai_optimization', 'compare_analyze', 'channel_cards', or 'campaign_analysis'.",
        },
        { status: 400 }
      )
    }

    if (!maybeBody.input || typeof maybeBody.input !== 'object') {
      return NextResponse.json({ success: false, error: "'input' must be an object." }, { status: 400 })
    }

    const response = await runPythonOptimizer({
      mode: maybeBody.mode,
      input: maybeBody.input as Record<string, unknown>,
    })

    const success = Boolean(response.success)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: typeof response.error === 'string' ? response.error : 'Optimizer failed.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

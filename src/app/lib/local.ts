import { DEFAULT_TODOS } from '../../shared/curriculum'
import type { Me, PracticeAttempt, PracticeStatus, Todo } from '../../shared/types'

// Stand-in for the Worker API when the site is built as static files for
// GitHub Pages: the checklist and practice answers are kept in this browser.

const TODO_KEY = 'genai-path.todos.v1'
const PRACTICE_KEY = 'genai-path.practice.v1'

const GUEST: Me = {
  user: { sub: 'guest', name: 'Guest' },
  streak: 0,
  seeded: true,
  capabilities: { database: false, files: false, auth: 'development' },
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value))
  } catch {
    /* storage blocked: keep working for this session */
  }
}

function fail(status: number, message: string): never {
  throw Object.assign(new Error(message), { status })
}

function seedTodos(): Todo[] {
  const stored = readJson<Todo[] | null>(TODO_KEY, null)
  if (stored) return stored
  const t = Date.now()
  const todos: Todo[] = DEFAULT_TODOS.map((todo, index) => ({
    id: crypto.randomUUID(),
    title: todo.title,
    stageId: todo.stageId,
    done: false,
    position: index,
    createdAt: t,
    updatedAt: t,
  }))
  writeJson(TODO_KEY, todos)
  return todos
}

function readPractice(): Record<string, PracticeAttempt> {
  return readJson<Record<string, PracticeAttempt>>(PRACTICE_KEY, {})
}

export async function localRequest<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const body = (init?.json ?? {}) as Record<string, unknown>
  const todoPath = path.match(/^\/study\/todos\/?([^/]*)$/)
  const practicePath = path.match(/^\/study\/practice\/(.+)$/)

  if (path === '/me' && method === 'GET') return GUEST as unknown as T

  if (path === '/study/todos' && method === 'GET') return { items: seedTodos() } as unknown as T

  if (path === '/study/todos' && method === 'POST') {
    const title = String(body.title ?? '').trim().slice(0, 200)
    if (!title) fail(400, 'Give the task a title.')
    const todos = seedTodos()
    const t = Date.now()
    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
      stageId: (body.stageId as string | null) ?? null,
      done: false,
      position: todos.length,
      createdAt: t,
      updatedAt: t,
    }
    writeJson(TODO_KEY, [...todos, todo])
    return { todo } as unknown as T
  }

  if (todoPath?.[1] && method === 'PATCH') {
    const todos = seedTodos()
    const index = todos.findIndex((todo) => todo.id === todoPath[1])
    if (index === -1) fail(404, 'Not found.')
    const current = todos[index]
    const title = body.title === undefined ? current.title : String(body.title).trim().slice(0, 200)
    if (!title) fail(400, 'Give the task a title.')
    todos[index] = { ...current, title, done: body.done === undefined ? current.done : Boolean(body.done), updatedAt: Date.now() }
    writeJson(TODO_KEY, todos)
    return { ok: true } as unknown as T
  }

  if (todoPath?.[1] && method === 'DELETE') {
    const todos = seedTodos()
    const next = todos.filter((todo) => todo.id !== todoPath[1])
    if (next.length === todos.length) fail(404, 'Not found.')
    writeJson(TODO_KEY, next)
    return { ok: true } as unknown as T
  }

  if (path === '/study/practice' && method === 'GET') return { items: Object.values(readPractice()) } as unknown as T

  if (practicePath?.[1] && method === 'PUT') {
    const caseId = decodeURIComponent(practicePath[1])
    const map = readPractice()
    const status = (body.status as PracticeStatus) ?? 'new'
    map[caseId] = { caseId, status, answer: (body.answer as string | null) ?? null, updatedAt: Date.now() }
    writeJson(PRACTICE_KEY, map)
    return { ok: true, caseId, status } as unknown as T
  }

  fail(404, 'That feature needs the hosted version of the site.')
}

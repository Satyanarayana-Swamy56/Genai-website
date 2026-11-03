import { Hono } from 'hono'

import { privateJson } from '../auth'
import { id, now } from '../db'
import type { AppContext } from '../env'
import { DEFAULT_TODOS, PRACTICE_CASES, STAGES } from '../../shared/curriculum'
import type { PracticeAttempt, PracticeStatus, Todo } from '../../shared/types'

export const study = new Hono<AppContext>()

const STATUSES = new Set<PracticeStatus>(['new', 'attempted', 'mastered'])

type Row = Record<string, unknown>

const mapTodo = (row: Row): Todo => ({
  id: row.id as string,
  title: row.title as string,
  stageId: (row.stage_id as string | null) ?? null,
  done: Boolean(row.done),
  position: Number(row.position ?? 0),
  createdAt: Number(row.created_at),
  updatedAt: Number(row.updated_at),
})

const mapAttempt = (row: Row): PracticeAttempt => ({
  caseId: row.case_id as string,
  status: (row.status as PracticeStatus) ?? 'new',
  answer: (row.answer as string | null) ?? null,
  updatedAt: Number(row.updated_at),
})

// The default plan is written once per account. A meta row records that it
// happened, so clearing the list does not silently recreate it on reload.
async function ensurePlan(db: D1Database, owner: string) {
  const claimed = await db
    .prepare(`INSERT OR IGNORE INTO study_meta (owner_sub, plan_seeded_at) VALUES (?, ?)`)
    .bind(owner, now())
    .run()
  if (!claimed.meta.changes) return
  const t = now()
  const existing = await db.prepare(`SELECT COUNT(*) AS n FROM todos WHERE owner_sub = ?`).bind(owner).first<{ n: number }>()
  if (Number(existing?.n ?? 0) > 0) return
  const statements = DEFAULT_TODOS.map((todo, index) =>
    db
      .prepare(`INSERT INTO todos (id, owner_sub, title, stage_id, done, position, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)`)
      .bind(id(), owner, todo.title, todo.stageId, index, t, t),
  )
  for (let i = 0; i < statements.length; i += 40) await db.batch(statements.slice(i, i + 40))
}

study.get('/todos', async (c) => {
  const db = c.get('db')
  const owner = c.get('user').sub
  await ensurePlan(db, owner)
  const rows = await db.prepare(`SELECT * FROM todos WHERE owner_sub = ? ORDER BY done ASC, position ASC, created_at ASC`).bind(owner).all()
  return privateJson(c, { items: (rows.results as Row[]).map(mapTodo) })
})

study.post('/todos', async (c) => {
  const db = c.get('db')
  const owner = c.get('user').sub
  await ensurePlan(db, owner)
  const input = await c.req.json<{ title?: string; stageId?: string | null }>()
  const title = input.title?.trim().slice(0, 200)
  if (!title) return c.json({ error: 'Give the task a title.' }, 400)
  const stageId = input.stageId && STAGES.some((stage) => stage.id === input.stageId) ? input.stageId : null
  const top = await db.prepare(`SELECT COALESCE(MAX(position), -1) AS p FROM todos WHERE owner_sub = ?`).bind(owner).first<{ p: number }>()
  const t = now()
  const todoId = id()
  await db
    .prepare(`INSERT INTO todos (id, owner_sub, title, stage_id, done, position, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)`)
    .bind(todoId, owner, title, stageId, Number(top?.p ?? -1) + 1, t, t)
    .run()
  const row = await db.prepare(`SELECT * FROM todos WHERE owner_sub = ? AND id = ?`).bind(owner, todoId).first()
  return privateJson(c, { todo: mapTodo(row as Row) }, 201)
})

study.patch('/todos/:id', async (c) => {
  const db = c.get('db')
  const owner = c.get('user').sub
  const todoId = c.req.param('id')
  const input = await c.req.json<{ done?: boolean; title?: string }>()
  const existing = await db.prepare(`SELECT * FROM todos WHERE owner_sub = ? AND id = ?`).bind(owner, todoId).first<Row>()
  if (!existing) return c.json({ error: 'Not found.' }, 404)
  const done = input.done === undefined ? Boolean(existing.done) : input.done
  const title = input.title === undefined ? (existing.title as string) : input.title.trim().slice(0, 200)
  if (!title) return c.json({ error: 'Give the task a title.' }, 400)
  await db.prepare(`UPDATE todos SET title = ?, done = ?, updated_at = ? WHERE owner_sub = ? AND id = ?`).bind(title, done ? 1 : 0, now(), owner, todoId).run()
  return privateJson(c, { ok: true })
})

study.delete('/todos/:id', async (c) => {
  const result = await c.get('db').prepare(`DELETE FROM todos WHERE owner_sub = ? AND id = ?`).bind(c.get('user').sub, c.req.param('id')).run()
  if (!result.meta.changes) return c.json({ error: 'Not found.' }, 404)
  return privateJson(c, { ok: true })
})

study.get('/practice', async (c) => {
  const rows = await c.get('db').prepare(`SELECT * FROM practice_attempts WHERE owner_sub = ?`).bind(c.get('user').sub).all()
  return privateJson(c, { items: (rows.results as Row[]).map(mapAttempt) })
})

study.put('/practice/:caseId', async (c) => {
  const caseId = c.req.param('caseId')
  if (!PRACTICE_CASES.some((item) => item.id === caseId)) return c.json({ error: 'Not found.' }, 404)
  const input = await c.req.json<{ status?: PracticeStatus; answer?: string | null }>()
  const status = STATUSES.has(input.status ?? 'new') ? (input.status as PracticeStatus) : 'new'
  const answer = input.answer?.slice(0, 8000) ?? null
  const owner = c.get('user').sub
  await c
    .get('db')
    .prepare(
      `INSERT INTO practice_attempts (owner_sub, case_id, status, answer, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(owner_sub, case_id) DO UPDATE SET status = excluded.status, answer = excluded.answer, updated_at = excluded.updated_at`,
    )
    .bind(owner, caseId, status, answer, now())
    .run()
  return privateJson(c, { ok: true, caseId, status, answer })
})

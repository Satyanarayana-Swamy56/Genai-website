import { Check, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Badge, Button, Card, Checkbox, Input, Skeleton } from '../components/ui'
import { api, useApiMutation, useTodos } from '../lib/api'
import { cx } from '../lib/cx'
import { STAGE_BY_ID } from '../../shared/curriculum'
import type { Todo } from '../../shared/types'

const FILTERS = ['all', 'open', 'done'] as const

export function TodoPage() {
  const { data, isLoading } = useTodos()
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const items = data?.items ?? []
  const done = items.filter((todo) => todo.done).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0

  const add = useApiMutation((value: string) => api<{ todo: Todo }>('/study/todos', { method: 'POST', json: { title: value } }), ['todos', 'stats'], {
    onSuccess: () => setTitle(''),
  })
  const toggle = useApiMutation(
    (input: { id: string; done: boolean }) => api(`/study/todos/${input.id}`, { method: 'PATCH', json: { done: input.done } }),
    ['todos', 'stats'],
  )
  const remove = useApiMutation((todoId: string) => api(`/study/todos/${todoId}`, { method: 'DELETE' }), ['todos', 'stats'])

  const visible = items.filter((todo) => (filter === 'all' ? true : filter === 'done' ? todo.done : !todo.done))

  function submit(event: FormEvent) {
    event.preventDefault()
    const value = title.trim()
    if (value) add.mutate(value)
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="text-[26px] font-bold tracking-[-0.02em]">Study checklist</h1>
      <p className="mt-1 text-[14.5px] text-muted">A starting plan you can edit. Ticks are saved to your account.</p>

      <Card className="mt-6 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-muted">Progress</p>
            <p className="text-[24px] font-bold tabular-nums leading-tight">
              {done}
              <span className="text-[14px] font-medium text-faint"> / {items.length} done</span>
            </p>
          </div>
          <span className="text-[13px] font-semibold tabular-nums text-accent">{pct}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-[4px] bg-surface-2">
          <div className="h-full rounded-[4px] bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>

        <form onSubmit={submit} className="mt-5 flex gap-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add a task, e.g. read chapter 3 and write notes" maxLength={200} />
          <Button variant="primary" type="submit" loading={add.isPending} disabled={!title.trim()}>
            <Plus />
            Add
          </Button>
        </form>
        {add.error && <p className="mt-2 text-[13px] text-danger">{add.error.message}</p>}
      </Card>

      <div className="mt-4 flex items-center gap-1.5">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={cx(
              'h-8 rounded-tile px-3 text-[13px] font-medium capitalize transition-colors',
              filter === option ? 'bg-fg text-white' : 'bg-surface text-muted shadow-card hover:text-fg',
            )}
          >
            {option}
          </button>
        ))}
        <span className="ml-auto text-[12.5px] text-faint">{visible.length} shown</span>
      </div>

      <Card className="mt-3 divide-y divide-line">
        {isLoading &&
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-4 py-3">
              <Skeleton className="h-5 w-2/3" />
            </div>
          ))}
        {visible.map((todo) => (
          <div key={todo.id} className="group flex items-center gap-3 px-4 py-3">
            <Checkbox checked={todo.done} onChange={(event) => toggle.mutate({ id: todo.id, done: event.target.checked })} aria-label={todo.done ? 'Mark open' : 'Mark done'} />
            <span className="min-w-0 flex-1">
              <span className={cx('block text-[13.5px]', todo.done ? 'text-faint line-through' : 'text-fg')}>{todo.title}</span>
              {todo.stageId && STAGE_BY_ID.get(todo.stageId) && (
                <span className="mt-1 inline-flex">
                  <Badge tone="neutral">{STAGE_BY_ID.get(todo.stageId)?.title}</Badge>
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => remove.mutate(todo.id)}
              aria-label="Delete task"
              className="grid size-8 shrink-0 place-items-center rounded-tile text-faint opacity-0 transition-colors hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {!isLoading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid size-11 place-items-center rounded-card bg-surface-2 text-muted">
              <Check className="size-5" />
            </span>
            <p className="mt-3 text-[14.5px] font-medium">{filter === 'done' ? 'Nothing finished yet' : 'No open tasks'}</p>
            <p className="mt-1 max-w-xs text-[13px] text-muted">
              {filter === 'done' ? 'Tick something off and it will appear here.' : 'Add your own task above, or switch to Done to review what you finished.'}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

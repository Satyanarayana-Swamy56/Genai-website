import { Check, ChevronDown, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { Badge, Button, Card, LevelBadge, Textarea } from '../components/ui'
import { api, useApiMutation, usePractice } from '../lib/api'
import { cx } from '../lib/cx'
import { PRACTICE_CASES, STAGE_BY_ID } from '../../shared/curriculum'
import type { PracticeStatus } from '../../shared/types'

export function Practice() {
  const { data } = usePractice()
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('case') ?? PRACTICE_CASES[0].id
  const current = PRACTICE_CASES.find((item) => item.id === selectedId) ?? PRACTICE_CASES[0]
  const attempt = (data?.items ?? []).find((item) => item.caseId === current.id)
  const [draft, setDraft] = useState('')
  const [showModel, setShowModel] = useState(false)

  useEffect(() => {
    setDraft(attempt?.answer ?? '')
    setShowModel(false)
  }, [current.id, attempt?.updatedAt])

  const save = useApiMutation(
    (input: { status: PracticeStatus; answer: string | null }) => api(`/study/practice/${current.id}`, { method: 'PUT', json: input }),
    ['practice', 'stats'],
  )

  const mastered = (data?.items ?? []).filter((item) => item.status === 'mastered').length
  const attempted = (data?.items ?? []).filter((item) => item.status === 'attempted').length

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">Practice cases</h1>
          <p className="mt-1 max-w-[620px] text-[14.5px] text-muted">
            Text-based exercises with a checklist and a model answer. Write yours, compare, then mark it honestly.
          </p>
        </div>
        <p className="text-[13px] text-muted">
          <span className="font-semibold text-fg">{mastered}</span> mastered · <span className="font-semibold text-fg">{attempted}</span> in review ·{' '}
          {PRACTICE_CASES.length} total
        </p>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[300px_1fr]">
        <Card className="h-fit overflow-hidden lg:sticky lg:top-20">
          <div className="max-h-[560px] overflow-y-auto scrollbar-thin p-2">
            {PRACTICE_CASES.map((item) => {
              const status = (data?.items ?? []).find((entry) => entry.caseId === item.id)?.status
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setParams({ case: item.id })}
                  className={cx(
                    'flex w-full items-start gap-2.5 rounded-tile px-2.5 py-2 text-left transition-colors',
                    item.id === current.id ? 'bg-surface-2' : 'hover:bg-surface-2/70',
                  )}
                >
                  <span
                    className={cx(
                      'mt-1.5 size-1.5 shrink-0 rounded-full',
                      status === 'mastered' ? 'bg-success' : status === 'attempted' ? 'bg-warning' : 'bg-line-strong',
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium leading-snug">{item.title}</span>
                    <span className="mt-0.5 block text-[11.5px] text-faint">
                      {STAGE_BY_ID.get(item.stageId)?.title} · {item.minutes} min
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{current.id.toUpperCase()}</Badge>
            <LevelBadge level={current.level} />
            <span className="text-[12px] text-faint">{STAGE_BY_ID.get(current.stageId)?.title}</span>
            <span className="text-[12px] text-faint">· {current.minutes} min</span>
            {attempt?.status === 'mastered' && <Badge tone="success" dot>Mastered</Badge>}
            {attempt?.status === 'attempted' && <Badge tone="warning" dot>In review</Badge>}
          </div>

          <h2 className="mt-3 text-[20px] font-semibold tracking-[-0.02em]">{current.title}</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
            <span className="font-medium text-fg">Scenario. </span>
            {current.scenario}
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed">
            <span className="font-medium">Your task. </span>
            {current.task}
          </p>

          <label className="mt-5 block">
            <span className="text-[13px] font-medium">Your answer</span>
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write the prompt, the plan or the explanation you would actually ship…"
              className="mt-1.5 min-h-[160px]"
            />
          </label>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="primary" loading={save.isPending} onClick={() => save.mutate({ status: attempt?.status === 'mastered' ? 'mastered' : 'attempted', answer: draft || null })}>
              <Check />
              Save draft
            </Button>
            <Button
              loading={save.isPending}
              onClick={() => {
                save.mutate({ status: 'mastered', answer: draft || null })
                setShowModel(true)
              }}
            >
              Mark mastered
            </Button>
            <Button variant="ghost" onClick={() => setShowModel((value) => !value)}>
              <ChevronDown className={cx('size-4 transition-transform', showModel && 'rotate-180')} />
              {showModel ? 'Hide model answer' : 'Reveal model answer'}
            </Button>
            {attempt && (
              <Button
                variant="ghost"
                onClick={() => {
                  save.mutate({ status: 'new', answer: null })
                  setDraft('')
                }}
              >
                <RotateCcw />
                Reset
              </Button>
            )}
          </div>
          {save.error && <p className="mt-2 text-[13px] text-danger">{save.error.message}</p>}

          <div className="mt-6 rounded-tile bg-surface-2 p-4">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-faint">Self-check before you mark it</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {current.rubric.map((line) => (
                <li key={line} className="flex gap-2 text-[13px] text-fg/85">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {showModel && (
            <div className="mt-4 rounded-tile border border-line bg-surface p-4">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-faint">Model answer</p>
              <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed">{current.modelAnswer}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {current.tags.map((tag) => (
              <span key={tag} className="rounded-[8px] bg-surface-2 px-2 py-1 text-[11.5px] text-muted">
                #{tag}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

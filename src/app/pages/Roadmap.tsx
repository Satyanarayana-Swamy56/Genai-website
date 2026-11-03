import { ArrowRight, Clock, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'

import { Badge, Card, LevelBadge } from '../components/ui'
import { usePractice } from '../lib/api'
import { KIND_LABEL, PRACTICE_CASES, RESOURCE_BY_ID, STAGES } from '../../shared/curriculum'

export function Roadmap() {
  const { data } = usePractice()
  const attempts = new Map((data?.items ?? []).map((attempt) => [attempt.caseId, attempt.status]))

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">Generative AI roadmap</h1>
          <p className="mt-1 max-w-[640px] text-[14.5px] text-muted">
            Six stages from first principles to production. Each module lists what you should be able to do, the free resources that teach it, and the
            practice case that proves it.
          </p>
        </div>
        <Link to="/todo" className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3.5 text-[13.5px] font-medium hover:bg-surface-2">
          Study checklist
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {STAGES.map((stage) => {
          const cases = PRACTICE_CASES.filter((item) => item.stageId === stage.id)
          const mastered = cases.filter((item) => attempts.get(item.id) === 'mastered').length
          return (
            <Card key={stage.id} id={stage.id} className="scroll-mt-24 overflow-hidden">
              <details open={stage.index === 1}>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="grid size-10 shrink-0 place-items-center rounded-tile bg-fg text-[14px] font-semibold tabular-nums text-white">{stage.index}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[16px] font-semibold">{stage.title}</span>
                      <LevelBadge level={stage.level} />
                      <Badge tone="neutral">~{stage.weeks} weeks</Badge>
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted">{stage.tagline}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-[12px] text-faint">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {stage.hours} h
                    </span>
                    <span>
                      {mastered}/{cases.length} practice
                    </span>
                  </span>
                </summary>

                <div className="border-t border-line">
                  {stage.modules.map((module) => (
                    <div key={module.id} className="border-b border-line px-5 py-5 last:border-b-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-[14.5px] font-semibold">{module.title}</h3>
                        <span className="text-[12px] text-faint">
                          {module.resourceIds.length} resources · {module.practiceIds.length} practice
                        </span>
                      </div>
                      <p className="mt-1 max-w-[760px] text-[13px] leading-relaxed text-muted">{module.summary}</p>

                      <p className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-faint">What you will be able to do</p>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {module.outcomes.map((outcome) => (
                          <li key={outcome} className="flex gap-2 text-[13px] text-fg/85">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                            {outcome}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-faint">Open resources</p>
                          <ul className="mt-1.5 flex flex-col gap-1">
                            {module.resourceIds.map((resourceId) => {
                              const resource = RESOURCE_BY_ID.get(resourceId)
                              if (!resource) return null
                              return (
                                <li key={resourceId}>
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group flex items-start gap-2 rounded-tile px-2 py-1.5 -mx-2 transition-colors hover:bg-surface-2"
                                  >
                                    <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-faint group-hover:text-accent" />
                                    <span className="min-w-0">
                                      <span className="block text-[13px] font-medium leading-snug group-hover:text-accent">{resource.title}</span>
                                      <span className="block text-[11.5px] text-faint">
                                        {KIND_LABEL[resource.kind]} · {resource.source}
                                        {resource.minutes ? ` · ${resource.minutes} min` : ''}
                                      </span>
                                    </span>
                                  </a>
                                </li>
                              )
                            })}
                          </ul>
                        </div>

                        <div>
                          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-faint">Practice</p>
                          <ul className="mt-1.5 flex flex-col gap-1">
                            {module.practiceIds.map((caseId) => {
                              const item = PRACTICE_CASES.find((entry) => entry.id === caseId)
                              if (!item) return null
                              const status = attempts.get(caseId)
                              return (
                                <li key={caseId}>
                                  <Link
                                    to={`/practice?case=${caseId}`}
                                    className="group flex items-center gap-2 rounded-tile px-2 py-1.5 -mx-2 transition-colors hover:bg-surface-2"
                                  >
                                    <span
                                      className={
                                        status === 'mastered'
                                          ? 'size-1.5 shrink-0 rounded-full bg-success'
                                          : status === 'attempted'
                                            ? 'size-1.5 shrink-0 rounded-full bg-warning'
                                            : 'size-1.5 shrink-0 rounded-full bg-line-strong'
                                      }
                                    />
                                    <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug group-hover:text-accent">{item.title}</span>
                                    <span className="shrink-0 text-[11.5px] text-faint">{item.minutes} min</span>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

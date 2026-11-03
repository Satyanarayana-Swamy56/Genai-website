import { ArrowRight, BookOpen, Bot, Database, Gauge, Hammer, Play, Sliders, Sparkles, TrendingUp } from 'lucide-react'
import { Link } from 'react-router'

import { Card, LevelBadge } from '../components/ui'
import { usePractice, useTodos } from '../lib/api'
import { CURRICULUM_STATS, LEARNING_OUTCOMES, RESOURCES, STAGES } from '../../shared/curriculum'

const OUTCOME_ICONS = { book: BookOpen, hammer: Hammer, sliders: Sliders, wand: Sparkles, database: Database, bot: Bot, chart: TrendingUp, gauge: Gauge }
const FEATURED = ['r09', 'r13', 'r16', 'r28']

function Meter({ value, total }: { value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="mt-2.5 h-2 overflow-hidden rounded-[4px] bg-surface-2">
      <div className="h-full rounded-[4px] bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Home() {
  const { data: todoData } = useTodos()
  const { data: practiceData } = usePractice()
  const todos = todoData?.items ?? []
  const attempts = practiceData?.items ?? []
  const doneTodos = todos.filter((todo) => todo.done).length
  const mastered = attempts.filter((attempt) => attempt.status === 'mastered').length
  const attempted = attempts.filter((attempt) => attempt.status === 'attempted').length
  const featured = RESOURCES.filter((resource) => FEATURED.includes(resource.id))

  const stats = [
    { label: 'stages', value: CURRICULUM_STATS.stages },
    { label: 'open resources', value: CURRICULUM_STATS.resources },
    { label: 'practice cases', value: CURRICULUM_STATS.practice },
    { label: 'study hours', value: CURRICULUM_STATS.hours },
  ]

  return (
    <div>
      <section className="relative overflow-hidden rounded-card bg-fg px-6 py-9 text-white shadow-float sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-24 -top-24 size-[320px] rounded-full bg-accent/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-[280px] rounded-full bg-info/20 blur-3xl" />
        <div className="relative">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">Generative AI · scratch to advanced</p>
          <h1 className="mt-3 max-w-[680px] text-[30px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[42px]">
            Learn generative AI the slow, honest way.
          </h1>
          <p className="mt-4 max-w-[560px] text-[14.5px] leading-relaxed text-white/65">
            A six-stage roadmap built from free courses, lectures and papers — with a text-based practice case at every step, a checklist you can
            actually finish, and progress you can see.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Link
              to="/roadmap"
              className="inline-flex h-10 items-center gap-2 rounded-control bg-white px-4 text-[14px] font-semibold text-fg transition-transform hover:-translate-y-0.5"
            >
              Open the roadmap
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/practice"
              className="inline-flex h-10 items-center gap-2 rounded-control border border-white/25 px-4 text-[14px] font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              Try a practice case
            </Link>
          </div>
          <dl className="mt-9 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="text-[24px] font-bold tabular-nums leading-none">{stat.value}</dd>
                <dt className="mt-1 text-[12.5px] text-white/55">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em]">What you will learn</h2>
            <p className="mt-0.5 text-[13.5px] text-muted">Eight outcomes the roadmap is built backwards from.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LEARNING_OUTCOMES.map((outcome) => {
            const Icon = OUTCOME_ICONS[outcome.icon as keyof typeof OUTCOME_ICONS] ?? BookOpen
            return (
              <Card key={outcome.title} className="p-4">
                <span className="grid size-9 place-items-center rounded-tile bg-accent-soft text-accent">
                  <Icon className="size-4" />
                </span>
                <p className="mt-3 text-[14px] font-semibold leading-snug">{outcome.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{outcome.body}</p>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em]">The path</h2>
            <p className="mt-0.5 text-[13.5px] text-muted">Six stages, about {CURRICULUM_STATS.hours} hours of focused work.</p>
          </div>
          <Link to="/roadmap" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent">
            Full roadmap
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <Card className="mt-4 divide-y divide-line">
          {STAGES.map((stage) => (
            <Link key={stage.id} to={`/roadmap#${stage.id}`} className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-surface-2 sm:px-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-tile bg-surface-2 text-[13px] font-semibold tabular-nums text-muted group-hover:bg-accent-soft group-hover:text-accent">
                {stage.index}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[14.5px] font-semibold">{stage.title}</span>
                  <LevelBadge level={stage.level} />
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-muted">{stage.tagline}</span>
              </span>
              <span className="hidden shrink-0 text-right text-[12px] text-faint sm:block">
                {stage.modules.length} modules
                <span className="block">{stage.hours} h</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
            </Link>
          ))}
        </Card>
      </section>

      <section className="mt-10 grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.02em]">Start watching</h2>
          <p className="mt-0.5 text-[13.5px] text-muted">Four free resources that carry the first two weeks.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {featured.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="group flex gap-3 rounded-card bg-surface p-4 shadow-card transition-transform hover:-translate-y-0.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-tile bg-fg text-white">
                  <Play className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold leading-snug group-hover:text-accent">{resource.title}</span>
                  <span className="mt-1 block text-[12px] text-faint">
                    {resource.source}
                    {resource.minutes ? ` · ${resource.minutes} min` : ''}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.02em]">Your plan</h2>
          <p className="mt-0.5 text-[13.5px] text-muted">Saved to your account, so it survives a refresh.</p>
          <div className="mt-4 grid gap-3">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <Link to="/todo" className="text-[13.5px] font-semibold hover:text-accent">
                  Study checklist
                </Link>
                <span className="text-[12.5px] tabular-nums text-muted">
                  {doneTodos}/{todos.length || 16}
                </span>
              </div>
              <Meter value={doneTodos} total={todos.length || 16} />
              <p className="mt-2 text-[12px] text-faint">{todoData ? `${todos.length} tasks in your plan` : 'Loading your plan…'}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <Link to="/practice" className="text-[13.5px] font-semibold hover:text-accent">
                  Practice cases
                </Link>
                <span className="text-[12.5px] tabular-nums text-muted">
                  {mastered}/{CURRICULUM_STATS.practice}
                </span>
              </div>
              <Meter value={mastered} total={CURRICULUM_STATS.practice} />
              <p className="mt-2 text-[12px] text-faint">{attempted} in review · {mastered} mastered</p>
            </Card>
            <Card className="flex items-center justify-between p-4">
              <div>
                <p className="text-[13.5px] font-semibold">Flashcard decks</p>
                <p className="mt-0.5 text-[12px] text-faint">Spaced repetition for the vocabulary</p>
              </div>
              <Link to="/decks" className="inline-flex h-8 items-center gap-1 rounded-tile bg-surface-2 px-3 text-[13px] font-medium hover:bg-raised">
                Open
                <ArrowRight className="size-3.5" />
              </Link>
            </Card>
          </div>
        </div>
      </section>

      <p className="mt-10 text-[12px] leading-relaxed text-faint">
        Every resource links to its original, freely available source — MIT OpenCourseWare, Stanford Online, DeepLearning.AI, fast.ai, Hugging Face, arXiv
        and independent educators. Nothing here is republished.
      </p>
    </div>
  )
}

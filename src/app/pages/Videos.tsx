import { ExternalLink, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge, Input, LevelBadge } from '../components/ui'
import { cx } from '../lib/cx'
import { KIND_LABEL, RESOURCES, STAGE_BY_ID } from '../../shared/curriculum'

const LEVELS = ['all', 'beginner', 'intermediate', 'advanced'] as const

export function VideosPage() {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('all')

  const items = useMemo(() => {
    const text = query.trim().toLowerCase()
    return RESOURCES.filter((resource) => {
      if (level !== 'all' && resource.level !== level) return false
      if (!text) return true
      const stage = STAGE_BY_ID.get(resource.stageId)?.title ?? ''
      return `${resource.title} ${resource.source} ${resource.topic} ${stage}`.toLowerCase().includes(text)
    })
  }, [query, level])

  return (
    <div>
      <h1 className="text-[26px] font-bold tracking-[-0.02em]">Video library</h1>
      <p className="mt-1 max-w-[640px] text-[14.5px] text-muted">
        {RESOURCES.length} free courses, lecture series, papers and codebases, ordered by the stage where they help most. Links open the original source.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search attention, RAG, fine-tuning, Karpathy…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLevel(option)}
              className={cx(
                'h-8 rounded-tile px-3 text-[13px] font-medium capitalize transition-colors',
                level === option ? 'bg-fg text-white' : 'bg-surface text-muted shadow-card hover:text-fg',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[12.5px] text-faint">
        Showing {items.length} of {RESOURCES.length}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((resource) => (
          <a
            key={resource.id}
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge tone="accent">{KIND_LABEL[resource.kind]}</Badge>
              <span className="text-[12px] text-faint">{resource.minutes ? `${resource.minutes} min` : 'Open'}</span>
            </div>
            <p className="text-[14.5px] font-semibold leading-snug group-hover:text-accent">{resource.title}</p>
            <p className="text-[12.5px] text-muted">
              {resource.source}
              <span className="text-faint"> · {STAGE_BY_ID.get(resource.stageId)?.title}</span>
            </p>
            <div className="mt-auto flex items-center justify-between pt-1">
              <LevelBadge level={resource.level} />
              <ExternalLink className="size-3.5 text-faint group-hover:text-accent" />
            </div>
          </a>
        ))}
      </div>

      {items.length === 0 && (
        <div className="mt-10 rounded-card bg-surface p-10 text-center shadow-card">
          <p className="text-[15px] font-medium">Nothing matches “{query}”</p>
          <p className="mt-1 text-[13px] text-muted">Try “attention”, “agents”, “tokenizer” or clear the filter.</p>
        </div>
      )}
    </div>
  )
}

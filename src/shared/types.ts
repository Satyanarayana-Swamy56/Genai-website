// Types shared by the Worker (src/worker) and the app (src/app).

export const BRAND = 'GenAI Path'

export type StudyMode = 'flashcards' | 'learn' | 'match'

export interface Deck {
  id: string
  title: string
  description: string | null
  hue: number
  cardCount: number
  mastered: number
  mastery: number
  dueCount: number
  lastStudiedAt: number | null
  createdAt: number
  updatedAt: number
}

export interface Card {
  id: string
  deckId: string
  term: string
  definition: string
  hasImage: boolean
  position: number
  progress: { correct: number; incorrect: number; streak: number; mastery: number; nextDue: number | null; lastSeen: number | null }
}

export interface Session {
  id: string
  deckId: string
  deckTitle?: string
  mode: StudyMode
  score: number
  total: number
  accuracy: number
  durationMs: number
  createdAt: number
}

export interface Me {
  user: { sub: string; name?: string; email?: string; picture?: string }
  streak: number
  seeded: boolean
  capabilities: { database: boolean; files: boolean; auth: 'freebuff' | 'development' }
}

export interface Stats {
  streak: number
  longestStreak: number
  sessions: number
  cardsMastered: number
  cardsTotal: number
  minutes: number
  days: { date: string; sessions: number; accuracy: number | null }[]
  recent: Session[]
  decks: { id: string; title: string; hue: number; mastery: number; cardCount: number }[]
  plan: PlanProgress
}

export interface SessionResult {
  cardId: string
  correct: boolean
}

export type PracticeStatus = 'new' | 'attempted' | 'mastered'

export interface Todo {
  id: string
  title: string
  stageId: string | null
  done: boolean
  position: number
  createdAt: number
  updatedAt: number
}

export interface PracticeAttempt {
  caseId: string
  status: PracticeStatus
  answer: string | null
  updatedAt: number
}

export interface PlanProgress {
  practice: { mastered: number; attempted: number; total: number }
  todos: { done: number; total: number }
}

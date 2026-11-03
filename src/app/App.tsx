import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { Shell } from './components/Shell'
import { Spinner, ToastProvider } from './components/ui'
import { ApiError, useMe } from './lib/api'
import { IS_STATIC } from './lib/mode'
import { Deck } from './pages/Deck'
import { Flashcards } from './pages/Flashcards'
import { Home } from './pages/Home'
import { Learn } from './pages/Learn'
import { Library } from './pages/Library'
import { Match } from './pages/Match'
import { Practice } from './pages/Practice'
import { Roadmap } from './pages/Roadmap'
import { Settings } from './pages/Settings'
import { SetupNeeded, SignIn } from './pages/SignIn'
import { StatsPage } from './pages/Stats'
import { TodoPage } from './pages/Todo'
import { VideosPage } from './pages/Videos'

const client = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 } } })

// On GitHub Pages the app lives under /genai-path/.
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

function Gate() {
  const me = useMe()
  if (!IS_STATIC) {
    if (me.isLoading) {
      return (
        <div className="grid min-h-screen place-items-center">
          <Spinner />
        </div>
      )
    }
    if (me.error instanceof ApiError && me.error.status === 401) return <SignIn />
    if (me.error) return <SetupNeeded message={me.error.message} />
  }
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="practice" element={<Practice />} />
        <Route path="todo" element={<TodoPage />} />
        {!IS_STATIC && <Route path="decks" element={<Library />} />}
        {!IS_STATIC && <Route path="decks/:id" element={<Deck />} />}
        {!IS_STATIC && <Route path="stats" element={<StatsPage />} />}
        {!IS_STATIC && <Route path="settings" element={<Settings />} />}
      </Route>
      {!IS_STATIC && <Route path="decks/:id/flashcards" element={<Flashcards />} />}
      {!IS_STATIC && <Route path="decks/:id/learn" element={<Learn />} />}
      {!IS_STATIC && <Route path="decks/:id/match" element={<Match />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <BrowserRouter basename={BASENAME}>
          <Gate />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

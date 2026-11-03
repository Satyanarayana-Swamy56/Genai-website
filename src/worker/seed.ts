import { hueFor, id } from './db'

const DAY = 86_400_000

const decks: { title: string; description: string; cards: [string, string][] }[] = [
  {
    title: 'GenAI foundations',
    description: 'The vocabulary you need before anything else makes sense.',
    cards: [
      ['Token', 'The unit a model reads and predicts; roughly a word piece, not a character or a word'],
      ['Embedding', 'A learned vector that places a token, sentence or image in a space where distance means similarity'],
      ['Transformer', 'Architecture built on self-attention and feed-forward blocks, trained on next-token prediction'],
      ['Attention', 'A weighted lookup where each token queries the keys of other tokens and blends their values'],
      ['Context window', 'The maximum number of tokens a model can attend to in one request'],
      ['Temperature', 'A sampling scale: low is focused and repeatable, high is varied and riskier'],
      ['Pretraining', 'Learning general language statistics from a very large corpus, usually by next-token prediction'],
      ['Fine-tuning', 'Continuing training on a smaller, task-specific dataset to change behaviour or style'],
      ['RAG', 'Retrieval-augmented generation: fetch relevant passages, then answer from them with citations'],
      ['Hallucination', 'A fluent, confident claim with no support in the data or context'],
      ['Inference', 'Running a trained model to produce output, as opposed to training it'],
      ['System prompt', 'Persistent instructions that shape a conversation, separate from user input'],
    ],
  },
  {
    title: 'Transformers and attention',
    description: 'The mechanics behind the model, from tokens to logits.',
    cards: [
      ['Self-attention', 'Every token attends to every other token in the sequence to build a contextual representation'],
      ['Q, K, V', 'Queries ask, keys match, values carry the information that gets blended'],
      ['Multi-head attention', 'Several attention heads run in parallel so different relationships can be learned at once'],
      ['Causal mask', 'A mask that hides future tokens so a model can only predict what comes next'],
      ['Positional encoding', 'Information added so attention, which is order-blind, knows token order'],
      ['Residual connection', 'Adding a block input to its output so gradients and information can flow through depth'],
      ['Layer norm', 'Normalising activations per token to keep training stable'],
      ['Softmax', 'Turns raw scores into a probability distribution that sums to one'],
      ['Autoregressive decoding', 'Generating one token at a time, feeding each new token back in'],
      ['KV cache', 'Cached keys and values that make generating the next token cheap'],
      ['Logits', 'Unnormalised scores over the vocabulary, before softmax or sampling'],
      ['BPE', 'Byte-pair encoding: a tokenizer that merges frequent character pairs into larger units'],
    ],
  },
  {
    title: 'Prompting and evaluation',
    description: 'Getting reliable behaviour out of a model, and proving it.',
    cards: [
      ['Few-shot prompting', 'Including examples in the prompt so the model can copy the pattern'],
      ['Chain-of-thought', 'Asking for intermediate reasoning steps, which can improve multi-step accuracy'],
      ['Structured output', 'Constraining a response to a schema such as JSON, then validating it'],
      ['Temperature vs top-p', 'Two sampling controls: temperature flattens or sharpens the distribution, top-p trims its tail'],
      ['Eval set', 'A fixed collection of inputs with expected quality signals, rerun on every change'],
      ['Rubric', 'An explicit scoring guide so two reviewers agree on what a good answer is'],
      ['Chunking', 'Splitting documents into retrievable pieces that fit the context and stay meaningful'],
      ['Tool calling', 'Letting a model request a typed function with arguments, executed by your code'],
      ['Guardrail', 'A check outside the model that blocks, alters or escalates unsafe or invalid output'],
      ['Groundedness', 'Whether every claim in an answer is supported by the retrieved evidence'],
    ],
  },
]

export async function seedUser(db: D1Database, owner: string) {
  const t = Date.now()
  const statements: D1PreparedStatement[] = []
  const sessionDays = [0, 1, 2, 4, 5, 6, 7, 9, 12, 13]

  decks.forEach((deck, di) => {
    const deckId = id()
    const lastStudied = di === 0 ? t - 3 * 3_600_000 : di === 1 ? t - 1.2 * DAY : t - 6 * DAY
    statements.push(
      db
        .prepare(`INSERT INTO decks (id, owner_sub, title, description, hue, last_studied_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(deckId, owner, deck.title, deck.description, hueFor(deck.title), lastStudied, t - (20 - di * 4) * DAY, lastStudied),
    )
    deck.cards.forEach(([term, definition], ci) => {
      const cardId = id()
      statements.push(
        db
          .prepare(`INSERT INTO cards (id, owner_sub, deck_id, term, definition, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .bind(cardId, owner, deckId, term, definition, ci, t - (20 - di * 4) * DAY + ci),
      )
      // Progress that looks like a few sessions have happened: early cards
      // are strong, later cards are still new.
      if (di < 2 && ci < deck.cards.length * 0.7) {
        const strength = Math.max(0, 1 - ci / deck.cards.length)
        const correct = Math.round(2 + strength * 6)
        const incorrect = Math.round((1 - strength) * 3)
        const mastery = Math.min(100, Math.round(strength * 100))
        statements.push(
          db
            .prepare(`INSERT INTO card_progress (card_id, owner_sub, deck_id, correct, incorrect, streak, mastery, next_due, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(cardId, owner, deckId, correct, incorrect, Math.min(correct, 4), mastery, t + (mastery >= 80 ? 3 : mastery >= 40 ? 1 : 0) * DAY, lastStudied),
        )
      }
    })
    // A short session history so stats and streaks are furnished.
    sessionDays.forEach((daysAgo, si) => {
      if ((si + di) % 3 === 2) return
      const total = 10 + ((si * 3 + di) % 6)
      const score = Math.max(4, total - ((si + di * 2) % 5))
      const modes = ['learn', 'flashcards', 'match'] as const
      statements.push(
        db
          .prepare(`INSERT INTO sessions (id, owner_sub, deck_id, mode, score, total, duration_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(id(), owner, deckId, modes[(si + di) % 3], score, total, (90 + ((si * 37) % 200)) * 1000, t - daysAgo * DAY - (di + 1) * 2 * 3_600_000),
      )
    })
  })

  statements.push(db.prepare(`UPDATE users SET seeded_at = ? WHERE owner_sub = ?`).bind(t, owner))
  for (let i = 0; i < statements.length; i += 40) await db.batch(statements.slice(i, i + 40))
}

export async function clearUser(db: D1Database, owner: string) {
  await db.batch(['sessions', 'card_progress', 'cards', 'decks'].map((table) => db.prepare(`DELETE FROM ${table} WHERE owner_sub = ?`).bind(owner)))
  await db.prepare(`UPDATE users SET seeded_at = NULL WHERE owner_sub = ?`).bind(owner).run()
}

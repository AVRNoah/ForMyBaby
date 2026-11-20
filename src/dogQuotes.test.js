import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chooseDogQuote } from './dogQuotes.js'

test('selection reserves 10 percent for Aristotle, 5 for humor, and 85 for motivation', () => {
  const totals = { aristotle: 0, humor: 0, motivation: 0 }
  for (let index = 0; index < 1000; index++) {
    const draws = [(index + .5) / 1000, 0]
    totals[chooseDogQuote(undefined, () => draws.shift()).category]++
  }
  assert.deepEqual(totals, { aristotle: 100, humor: 50, motivation: 850 })
  for (const [roll, category] of [[.099999, 'aristotle'], [.1, 'humor'], [.149999, 'humor'], [.15, 'motivation']]) {
    const draws = [roll, 0]
    assert.equal(chooseDogQuote(undefined, () => draws.shift()).category, category)
  }
})

test('consecutive quotes differ within every category', () => {
  for (const chance of [0, .12, .9]) {
    let draws = [chance, 0]
    const first = chooseDogQuote(undefined, () => draws.shift())
    draws = [chance, 0]
    const second = chooseDogQuote(first.text, () => draws.shift())
    assert.notEqual(second.text, first.text)
    assert.equal(second.category, first.category)
  }
})

test('all requested pool sizes are reachable, including exactly five dog-themed motivations', () => {
  for (const [roll, count] of [[0, 15], [.12, 10], [.9, 50]]) {
    const quotes = new Map()
    for (let index = 0; index < 1000; index++) {
      const draws = [roll, (index + .5) / 1000]
      const quote = chooseDogQuote(undefined, () => draws.shift())
      quotes.set(quote.text, quote)
    }
    assert.equal(quotes.size, count)
    if (roll === .9) assert.equal([...quotes.values()].filter((quote) => quote.dogThemed).length, 5)
    if (roll === 0) assert.ok([...quotes.values()].every((quote) => quote.author === 'Aristotle' && quote.work))
  }
})

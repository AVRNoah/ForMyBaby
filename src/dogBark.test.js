import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldBark } from './dogBark.js'

test('barking uses exactly the lower five percent of the random range', () => {
  let barks = 0
  for (let index = 0; index < 1000; index++) {
    if (shouldBark(() => (index + .5) / 1000)) barks++
  }
  assert.equal(barks, 50)
  assert.equal(shouldBark(() => .049999), true)
  assert.equal(shouldBark(() => .05), false)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyLabelFields, resolvePreviousDetails, updateRecordField } from './recordFields.js'

const record = () => ({
  name: 'Lorazepam', className: '', dose: '', route: '',
  why: 'Old indication', info: 'Old warning', nursing: 'Old reactions',
  matches: [], lookupMessage: '', sourceUrl: 'old-source', needsReview: false,
  generatedFields: { why: 'Old indication', info: 'Old warning', nursing: 'Old reactions' },
})

test('changing drugs removes unedited old label excerpts and their source', () => {
  const updated = updateRecordField(record(), 'name', 'Acetaminophen')
  assert.equal(updated.why, '')
  assert.equal(updated.info, '')
  assert.equal(updated.nursing, '')
  assert.equal(updated.sourceUrl, '')
  assert.equal(updated.needsReview, false)
  const filled = applyLabelFields(updated, { why: 'New indication', info: '', nursing: 'New reactions' }, 'new-source')
  assert.equal(filled.why, 'New indication')
  assert.equal(filled.nursing, 'New reactions')
})

test('changing drugs preserves edited notes and dose until explicitly reviewed or cleared', () => {
  const original = { ...record(), why: 'My edited notes', dose: '5 mg' }
  const updated = updateRecordField(original, 'name', 'Acetaminophen')
  assert.equal(updated.why, 'My edited notes')
  assert.equal(updated.dose, '5 mg')
  assert.equal(updated.info, '')
  assert.equal(updated.needsReview, true)
  assert.equal(resolvePreviousDetails(updated, true).why, 'My edited notes')
  const cleared = resolvePreviousDetails(updated, false)
  assert.equal(cleared.why, '')
  assert.equal(cleared.dose, '')
  assert.equal(cleared.needsReview, false)
})

test('switching labels replaces unedited excerpts but keeps manually edited fields', () => {
  const original = { ...record(), nursing: 'My notes' }
  const updated = applyLabelFields(original, { why: 'New indication', info: '', nursing: 'New reactions' }, 'new-source')
  assert.equal(updated.why, 'New indication')
  assert.equal(updated.info, '')
  assert.equal(updated.nursing, 'My notes')
  assert.match(updated.lookupMessage, /kept/)
})

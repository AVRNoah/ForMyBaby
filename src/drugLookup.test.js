import { test } from 'node:test'
import assert from 'node:assert/strict'
import { labelFields, searchDrugNames, searchLabels } from './drugLookup.js'

test('only returns labels with an exact generic or brand name', async () => {
  const labels = [
    { openfda: { generic_name: ['ATORVASTATIN CALCIUM'] } },
    { openfda: { generic_name: ['ATORVASTATIN AND OTHER INGREDIENT'] } },
    { openfda: { brand_name: ['Atorvastatin Calcium'] } },
  ]
  const matches = await searchLabels('atorvastatin calcium', async () => ({
    ok: true, json: async () => ({ results: labels }),
  }))
  assert.deepEqual(matches, [labels[0], labels[2]])
})

test('reports API errors and refuses search syntax in medication names', async () => {
  await assert.rejects(() => searchLabels('name', async () => ({ ok: false, status: 429 })), /429/)
  await assert.rejects(() => searchLabels('name" OR patient', async () => {}), /medication name/)
  assert.deepEqual(await searchLabels('name', async () => ({ ok: false, status: 404 })), [])
})

test('only populates explicitly labeled excerpts and leaves missing sections empty', () => {
  const fields = labelFields({
    indications_and_usage: ['First indication. Second indication.'],
    adverse_reactions: ['First adverse reaction. More details.'],
  })
  assert.match(fields.why, /^Label indications \(excerpt\): First indication\.$/)
  assert.match(fields.nursing, /^Adverse reactions \(label excerpt\): First adverse reaction\.$/)
  assert.equal(fields.info, '')
})

test('does not present a cut-off sentence as a label excerpt', () => {
  const fields = labelFields({ indications_and_usage: [`${'long '.repeat(100)}end.`] })
  assert.equal(fields.why, '')
})

test('returns distinct NLM medication suggestions and reports failures', async () => {
  const names = await searchDrugNames('lip', undefined, async (url) => {
    assert.match(url, /terms=lip/)
    return { ok: true, json: async () => [2, ['LIPITOR (Oral Pill)', 'LIPITOR (Oral Pill)']] }
  })
  assert.deepEqual(names, ['LIPITOR (Oral Pill)'])
  await assert.rejects(() => searchDrugNames('lip', undefined, async () => ({ ok: false, status: 503 })), /503/)
  await assert.rejects(() => searchDrugNames('lip', undefined, async () => ({ ok: true, json: async () => ({}) })), /unexpected/)
})

test('matches an FDA salt suffix but not a combination product', async () => {
  const labels = [
    { openfda: { generic_name: ['ATORVASTATIN CALCIUM'] } },
    { openfda: { generic_name: ['ATORVASTATIN AND AMLODIPINE'] } },
  ]
  const matches = await searchLabels('atorvastatin', async () => ({
    ok: true, json: async () => ({ results: labels }),
  }))
  assert.deepEqual(matches, [labels[0]])
})

test('normalizes mixed-case names before querying FDA and matching labels', async () => {
  const label = { openfda: { brand_name: ['Lipitor'] } }
  const matches = await searchLabels('  LiPiToR  ', async (url) => {
    assert.match(new URL(url).searchParams.get('search'), /"lipitor"/)
    return { ok: true, json: async () => ({ results: [label] }) }
  })
  assert.deepEqual(matches, [label])
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseMedications } from './medicationInput.js'

test('extracts names and order details regardless of capitalization', () => {
  assert.deepEqual(parseMedications('Order Name\nATORVASTATIN calcium 10 MG Gastrostomy Tube\nbUsPiRoNe hydrochloride\n7.5 mg GT'), [
    { name: 'ATORVASTATIN calcium', dose: '10 MG', route: 'Gastrostomy Tube' },
    { name: 'bUsPiRoNe hydrochloride', dose: '7.5 mg', route: 'Gastrostomy Tube' },
  ])
})

test('keeps standalone names and does not treat drug-name fragments as routes', () => {
  assert.deepEqual(parseMedications('• LIPITOR\npotassium chloride 40 mEq\nEnoxaparin sodium 40 mg Subcutaneous (SC)'), [
    { name: 'LIPITOR', dose: '', route: '' },
    { name: 'potassium chloride', dose: '40 mEq', route: '' },
    { name: 'Enoxaparin sodium', dose: '40 mg', route: 'Subcutaneous (SC)' },
  ])
  assert.deepEqual(parseMedications(' \nOrder Name\n'), [])
})

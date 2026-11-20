const detailFields = ['className', 'dose', 'route', 'why', 'info', 'nursing']
const labelFieldNames = ['why', 'info', 'nursing']

export function updateRecordField(record, field, value) {
  if (field !== 'name' || value === record.name) return { ...record, [field]: value }

  const updated = { ...record, name: value, matches: [], lookupMessage: '', sourceUrl: '' }
  for (const key of labelFieldNames) {
    if (record.generatedFields?.[key] && record[key] === record.generatedFields[key]) {
      updated[key] = ''
    }
  }
  updated.generatedFields = {}
  updated.needsReview = record.needsReview ||
    (Boolean(record.name.trim()) && detailFields.some((key) => updated[key]?.trim()))
  return updated
}

export function resolvePreviousDetails(record, keep) {
  if (keep) return { ...record, needsReview: false, lookupMessage: '' }
  const cleared = { ...record, needsReview: false, generatedFields: {}, lookupMessage: '' }
  for (const key of detailFields) cleared[key] = ''
  return cleared
}

export function applyLabelFields(record, fields, sourceUrl) {
  const updated = { ...record, sourceUrl, matches: [], generatedFields: {} }
  let retained = false
  for (const key of labelFieldNames) {
    if (!record[key] || (record.generatedFields?.[key] && record[key] === record.generatedFields[key])) {
      updated[key] = fields[key]
      if (fields[key]) updated.generatedFields[key] = fields[key]
    } else {
      retained = true
    }
  }
  updated.lookupMessage = retained
    ? 'Label excerpts updated where possible. Your existing or edited notes were kept; check that they match this product.'
    : 'Available label excerpts were updated. Sections not available in the selected label were left blank.'
  return updated
}

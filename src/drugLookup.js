const FDA_LABEL_URL = 'https://api.fda.gov/drug/label.json'
const RXTERMS_URL = 'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search'

export async function searchDrugNames(term, signal, fetcher = fetch) {
  const params = new URLSearchParams({ terms: term.trim(), maxList: '8' })
  const response = await fetcher(`${RXTERMS_URL}?${params}`, { signal })
  if (!response.ok) throw new Error(`NLM search failed (HTTP ${response.status}).`)
  const data = await response.json()
  if (!Array.isArray(data) || !Array.isArray(data[1])) {
    throw new Error('NLM returned an unexpected response.')
  }
  return [...new Set(data[1].filter((name) => typeof name === 'string' && name.trim()))]
}

export async function searchLabels(name, fetcher = fetch) {
  const term = name.trim().toLowerCase()
  if (!term) throw new Error('Enter a medication name first.')
  if (!/^[\p{L}\p{N}\s\-'.(),]+$/u.test(term)) {
    throw new Error('Search using only a medication name, without order details.')
  }
  const search = `(openfda.generic_name:"${term}" OR openfda.brand_name:"${term}")`
  const params = new URLSearchParams({ search, limit: '50' })
  const response = await fetcher(`${FDA_LABEL_URL}?${params}`)
  if (response.status === 404) return []
  if (!response.ok) throw new Error(`FDA lookup failed (HTTP ${response.status}).`)
  const data = await response.json()
  if (!Array.isArray(data.results)) throw new Error('FDA returned an unexpected response.')
  const normalized = term.toLocaleLowerCase()
  const salts = new Set(['calcium', 'sodium', 'potassium', 'hydrochloride', 'sulfate', 'succinate', 'tartrate', 'phosphate', 'acetate', 'maleate', 'mesylate', 'fumarate'])
  return data.results.filter((label) =>
    [...(label.openfda?.generic_name || []), ...(label.openfda?.brand_name || [])]
      .some((value) => {
        const candidate = value.trim().toLocaleLowerCase()
        return candidate === normalized ||
          (candidate.startsWith(`${normalized} `) && salts.has(candidate.slice(normalized.length + 1)))
      })
  )
}

function excerpt(section) {
  if (!Array.isArray(section) || typeof section[0] !== 'string') return ''
  const text = section[0].replace(/\s+/g, ' ').trim()
  if (!text) return ''
  const match = text.match(/^.{1,450}?[.!?](?=\s|$)/)
  return match ? match[0] : ''
}

export function labelFields(label) {
  const sections = [
    ['Adverse reactions', excerpt(label.adverse_reactions)],
    ['Drug interactions', excerpt(label.drug_interactions)],
    ['Boxed warning', excerpt(label.boxed_warning)],
  ].filter(([, text]) => text).map(([title, text]) => `${title} (label excerpt): ${text}`)
  const warning = excerpt(label.warnings_and_cautions) || excerpt(label.warnings)
  return {
    why: excerpt(label.indications_and_usage) ? `Label indications (excerpt): ${excerpt(label.indications_and_usage)}` : '',
    info: warning ? `Label warning (excerpt): ${warning}` : '',
    nursing: sections.join('\n\n'),
  }
}

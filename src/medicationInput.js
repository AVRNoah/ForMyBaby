function parseLine(line) {
  const cleaned = line.replace(/^[\s•*-]+/, '').replace(/\b(pharmacy|tablets?|capsules?)\b/gi, '').trim()
  const dose = cleaned.match(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|mL|units?|meq)\b(?:\/(?:hr|day|kg))?/i)?.[0] || ''
  const route = cleaned.match(/\b(?:subcutaneous\b(?:\s*\(sc\))?|(?:gastrostomy tube|gt|sc|intravenous|iv|po|oral|g-tube)\b)/i)?.[0] || ''
  const name = cleaned.replace(dose, '').replace(route, '').replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '').trim()
  return { name, dose, route: /^gt$/i.test(route) ? 'Gastrostomy Tube' : route }
}

export function parseMedications(text) {
  const parsed = []
  for (const line of text.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)) {
    if (/^(order name|medications?|drug)$/i.test(line)) continue
    const details = parseLine(line)
    if (!details.name && (details.dose || details.route) && parsed.length) {
      const previous = parsed[parsed.length - 1]
      if (details.dose) previous.dose = details.dose
      if (details.route) previous.route = details.route
    } else if (details.name) {
      parsed.push(details)
    }
  }
  return parsed
}

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { labelFields, searchLabels } from './drugLookup'
import DrugNameInput from './DrugNameInput'
import { applyLabelFields, resolvePreviousDetails, updateRecordField } from './recordFields'
import { parseMedications } from './medicationInput'
import InteractiveDog from './InteractiveDog'
import './App.css'

const blankRecord = () => ({
  id: crypto.randomUUID(),
  name: '',
  className: '',
  dose: '',
  route: '',
  why: '',
  info: '',
  nursing: '',
  matches: [],
  lookupMessage: '',
  sourceUrl: '',
  generatedFields: {},
  needsReview: false,
})

function App() {
  const [textInput, setTextInput] = useState('')
  const [records, setRecords] = useState([blankRecord()])
  const [lookupStatus, setLookupStatus] = useState('')
  const [sourceOpen, setSourceOpen] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)

  const updateRecord = (index, field, value) => {
    setRecords((current) => current.map((record, recordIndex) =>
      recordIndex === index ? updateRecordField(record, field, value) : record
    ))
  }

  const parseText = async () => {
    const parsed = parseMedications(textInput).map((details) => ({ ...blankRecord(), ...details }))
    if (!parsed.length) {
      setLookupStatus('Paste at least one medication name before searching.')
      return
    }
    setRecords(parsed)
    setLookingUp(true)
    setLookupStatus('Recognizing medications and finding FDA labels...')
    try {
      for (const record of parsed) await lookupRecord(record)
      setLookupStatus('Search finished. Choose the matching label in each entry; unmatched names are marked below.')
    } finally {
      setLookingUp(false)
    }
  }

  const lookupRecord = async (record) => {
    if (record.needsReview) {
      setRecords((current) => current.map((item) => item.id === record.id
        ? { ...item, lookupMessage: 'Review or clear the previous details before looking up this medication.' } : item))
      return
    }
    const name = record.name.trim()
    setRecords((current) => current.map((item) => item.id === record.id
      ? { ...item, matches: [], lookupMessage: 'Searching FDA labels...' } : item))
    try {
      const matches = await searchLabels(name)
      setRecords((current) => current.map((item) => item.id === record.id && item.name.trim() === name
        ? { ...item, matches, lookupMessage: matches.length
          ? `Found ${matches.length} labels (up to 50). Choose the matching product and formulation.`
          : 'No FDA labels found for this name. Check the name or try a brand name.' }
        : item))
    } catch (error) {
      setRecords((current) => current.map((item) => item.id === record.id && item.name.trim() === name
        ? { ...item, lookupMessage: `Lookup failed: ${error.message}` } : item))
    }
  }

  const fillAll = async () => {
    setLookingUp(true)
    setLookupStatus('Searching FDA labels...')
    try {
      for (const record of records) await lookupRecord(record)
      setLookupStatus('Choose a matching product for each entry below. Review any flagged entries first.')
    } finally {
      setLookingUp(false)
    }
  }

  const applyLabel = (recordId, label) => {
    const fields = labelFields(label)
    const sourceUrl = label.set_id
      ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encodeURIComponent(label.set_id)}`
      : ''
    setRecords((current) => current.map((item) => item.id === recordId && !item.needsReview
      ? applyLabelFields(item, fields, sourceUrl) : item))
  }

  const addRecord = () => setRecords((current) => [...current, blankRecord()])

  const removeRecord = (index) => {
    setRecords((current) => current.filter((_, recordIndex) => recordIndex !== index))
  }

  const exportPdf = () => {
    if (records.some((record) => record.needsReview)) {
      setLookupStatus('Review or clear the previous details in each flagged entry before exporting.')
      return
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })
    const tableWidth = 742

    for (let pageStart = 0; pageStart < records.length; pageStart += 5) {
      if (pageStart > 0) doc.addPage()

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('Student Name: __________________________', 50, 28)
      doc.text('Clinical Instructor Name: __________________________', 320, 28)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('MEDICATION LOG', 421, 49, { align: 'center' })

      autoTable(doc, {
        startY: 58,
        margin: { left: 50, right: 50 },
        tableWidth,
        head: [[
          'DRUG NAME (GENERIC/BRAND)\nAND CLASS',
          'DOSE/ SAFE/\nADMIN. (DOSAGE RANGE)',
          'ROUTE/\nAdministration instructions',
          'WHY IS PATIENT\nRECEIVING?\n(Benefit)',
          'PERTINENT INFORMATION\nLABS/SIDE EFFECT/RISKS',
          'Major Nursing Implications',
        ]],
        body: records.slice(pageStart, pageStart + 5).map((record) => [
          `${record.name}${record.className ? `\n${record.className}` : ''}`,
          record.dose,
          record.route,
          record.why,
          record.info,
          record.nursing,
        ]),
        styles: {
          font: 'helvetica',
          fontSize: 7,
          cellPadding: 4,
          overflow: 'linebreak',
          valign: 'top',
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 6.5,
          minCellHeight: 39,
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 150 },
          1: { cellWidth: 106 },
          2: { cellWidth: 95 },
          3: { cellWidth: 145 },
          4: { cellWidth: 128 },
          5: { cellWidth: 118 },
        },
        rowPageBreak: 'avoid',
        showHead: 'firstPage',
      })

      const pageNumber = pageStart / 5 + 1
      doc.setFontSize(8)
      doc.text(String(pageNumber), 792, 575, { align: 'right' })
    }

    doc.save('Medication_Log.pdf')
  }

  return (
    <main className="app-shell">
      <header>
        <p className="eyebrow">Clinical study tool</p>
        <h1>Sara&apos;s Medication Log Builder</h1>
      </header>

      <section className={`workspace-grid${sourceOpen ? '' : ' source-collapsed'}`}>
        <aside className="source-panel">
          <button type="button" className="source-toggle" aria-expanded={sourceOpen} aria-controls="source-content" onClick={() => setSourceOpen(!sourceOpen)}>
            <span>Add medications</span>
            <span className="toggle-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" className={sourceOpen ? '' : 'collapsed'}>
                <path d="m7 10 5 5 5-5" />
              </svg>
            </span>
          </button>
          <div id="source-content" className={`source-content${sourceOpen ? ' is-open' : ''}`} inert={!sourceOpen}>
            <div className="source-content-inner">
              <label htmlFor="medication-text">Paste order names and doses</label>
              <p className="status">One medication per line; capitalization does not matter. Search sends medication names to openFDA. Do not include patient identifiers.</p>
              <textarea
                id="medication-text"
                value={textInput}
                onChange={(event) => setTextInput(event.target.value)}
                placeholder={'atorvastatin calcium 10 mg Gastrostomy Tube\nbuspirone hydrochloride 7.5 mg Gastrostomy Tube'}
              />
              <div className="button-row">
                <button type="button" disabled={lookingUp} onClick={parseText}>{lookingUp ? 'Searching...' : 'Find medications & labels'}</button>
              </div>

            </div>
          </div>
        </aside>

        <section className="records-panel">
          <div className="records-heading">
            <div>
              <h2>Medication entries</h2>
              <p className="status">Medication names typed here are sent to NLM for suggestions. Do not enter patient identifiers.</p>
              <p className="status">{lookupStatus}</p>
            </div>
            <div className="button-row">
              <button type="button" className="secondary" onClick={addRecord}>Add row</button>
              <button type="button" disabled={lookingUp} onClick={fillAll}>Find labels for all</button>
              <button type="button" className="primary" onClick={exportPdf}>Export PDF</button>
            </div>
          </div>

          <div className="record-list">
            {records.map((record, index) => (
              <article className="record-card" key={record.id}>
                <div className="card-title">
                  <strong>Medication {index + 1}</strong>
                  <button type="button" className="link-button" onClick={() => removeRecord(index)}>Remove</button>
                </div>
                <div className="form-grid">
                  <label>Drug name / brand / class
                    <DrugNameInput value={record.name} onChange={(value) => updateRecord(index, 'name', value)} />
                  </label>
                  <label>Dose
                    <input value={record.dose} onChange={(event) => updateRecord(index, 'dose', event.target.value)} />
                  </label>
                  <label>Route / administration
                    <input value={record.route} onChange={(event) => updateRecord(index, 'route', event.target.value)} />
                  </label>
                  <label>Why is patient receiving it?
                    <textarea value={record.why} onChange={(event) => updateRecord(index, 'why', event.target.value)} />
                  </label>
                  <label>Pertinent information
                    <textarea value={record.info} onChange={(event) => updateRecord(index, 'info', event.target.value)} />
                  </label>
                  <label>Major nursing implications
                    <textarea value={record.nursing} onChange={(event) => updateRecord(index, 'nursing', event.target.value)} />
                  </label>
                </div>
                {record.needsReview && (
                  <div className="review-warning" role="alert">
                    <p>The medication name changed. The remaining details may belong to the previous medication.</p>
                    <div className="button-row">
                      <button type="button" onClick={() => setRecords((current) => current.map((item) =>
                        item.id === record.id ? resolvePreviousDetails(item, false) : item
                      ))}>Clear previous details</button>
                      <button type="button" onClick={() => setRecords((current) => current.map((item) =>
                        item.id === record.id ? resolvePreviousDetails(item, true) : item
                      ))}>I reviewed these details</button>
                    </div>
                  </div>
                )}
                <button type="button" className="lookup-button" disabled={lookingUp} onClick={() => lookupRecord(record)}>
                  Find FDA labels
                </button>
                <p className="status" role="status">{record.lookupMessage}</p>
                {record.sourceUrl && <a className="source-link" href={record.sourceUrl} target="_blank" rel="noreferrer">Read full label on DailyMed</a>}
                {record.matches.length > 0 && <div className="label-matches">
                  {record.matches.map((label, labelIndex) => (
                    <button type="button" className="label-choice" key={label.id || labelIndex} onClick={() => applyLabel(record.id, label)}>
                      <strong>{label.openfda?.brand_name?.join(', ') || 'Unnamed brand'}</strong>
                      <span>{label.openfda?.generic_name?.join(', ') || 'Generic name unavailable'} · {label.openfda?.route?.join(', ') || 'Route unavailable'} · {label.openfda?.manufacturer_name?.join(', ') || 'Manufacturer unavailable'} · NDC: {label.openfda?.product_ndc?.join(', ') || 'unavailable'}</span>
                    </button>
                  ))}
                </div>}
              </article>
            ))}
          </div>
        </section>
      </section>

      <InteractiveDog />
    </main>
  )
}

export default App

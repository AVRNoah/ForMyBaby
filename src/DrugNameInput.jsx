import { useEffect, useId, useState } from 'react'
import { searchDrugNames } from './drugLookup'

export default function DrugNameInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [message, setMessage] = useState('')
  const [active, setActive] = useState(-1)
  const [selectedValue, setSelectedValue] = useState('')
  const listId = useId()

  useEffect(() => {
    const term = value.trim()
    if (!focused || term.length < 3 || term === selectedValue) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const names = await searchDrugNames(term, controller.signal)
        if (!controller.signal.aborted) {
          setSuggestions(names)
          setMessage(names.length ? '' : 'No suggestions found.')
          setActive(-1)
        }
      } catch (error) {
        if (!controller.signal.aborted) setMessage(`Suggestions unavailable: ${error.message}`)
      }
    }, 350)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value, focused, selectedValue])

  const choose = (suggestion) => {
    const name = suggestion.replace(/\s+\([^()]+\)$/, '')
    setSelectedValue(name)
    setSuggestions([])
    setMessage('')
    setActive(-1)
    onChange(name)
  }

  const handleChange = (event) => {
    setSelectedValue('')
    setSuggestions([])
    setMessage('')
    setActive(-1)
    onChange(event.target.value)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault()
      setActive((current) => Math.min(current + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault()
      setActive((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault()
      choose(suggestions[active])
    } else if (event.key === 'Escape') {
      setSuggestions([])
      setMessage('')
      setActive(-1)
    }
  }

  return (
    <div className="drug-name-control">
      <input
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setSuggestions([]); setMessage(''); setActive(-1) }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <ul className="suggestion-list" id={listId} role="listbox" aria-label="Medication name suggestions">
          {suggestions.map((suggestion, index) => (
            <li
              id={`${listId}-${index}`}
              key={suggestion}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      {message && <span className="suggestion-status" role="status">{message}</span>}
    </div>
  )
}

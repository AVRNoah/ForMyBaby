import { useEffect, useRef } from 'react'

export default function Dachshund() {
  const drawing = useRef(null)

  useEffect(() => {
    const svg = drawing.current
    const eyes = [...svg.querySelectorAll('.dog-eye')]
    const pupils = [...svg.querySelectorAll('.dog-pupil')]
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const reset = () => {
      cancelAnimationFrame(frame)
      pupils.forEach((pupil) => pupil.removeAttribute('transform'))
    }

    const track = (event) => {
      if (event.pointerType === 'touch' || reducedMotion.matches) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const scale = svg.getBoundingClientRect().width / 220
        eyes.forEach((eye, index) => {
          const bounds = eye.getBoundingClientRect()
          const dx = (event.clientX - bounds.left - bounds.width / 2) / scale
          const dy = (event.clientY - bounds.top - bounds.height / 2) / scale
          const distance = Math.hypot(dx, dy)
          const factor = distance ? Math.min(distance, 2.6) / distance : 0
          pupils[index].setAttribute('transform', `translate(${dx * factor} ${dy * factor})`)
        })
      })
    }

    window.addEventListener('pointermove', track)
    window.addEventListener('blur', reset)
    document.documentElement.addEventListener('pointerleave', reset)
    reducedMotion.addEventListener('change', reset)
    return () => {
      reset()
      window.removeEventListener('pointermove', track)
      window.removeEventListener('blur', reset)
      document.documentElement.removeEventListener('pointerleave', reset)
      reducedMotion.removeEventListener('change', reset)
    }
  }, [])

  return (
    <div className="dachshund" aria-hidden="true">
      <svg ref={drawing} viewBox="0 0 220 130" focusable="false">
        <ellipse cx="110" cy="117" rx="91" ry="7" fill="#100c16" opacity=".45" />
        <g stroke="#45291e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M37 78Q12 67 18 46Q22 64 48 64" fill="#a5683f" />
          <path d="M51 88v22q0 7 11 5h9q5-7-6-9V87M137 88v22q0 7 11 5h9q5-7-6-9V87" fill="#78452f" />
          <rect x="34" y="58" width="134" height="41" rx="21" fill="#a5683f" />
          <path d="M56 93v21q0 5 10 4h9q5-7-7-8V93M147 91v23q0 5 10 4h9q5-7-7-8V89" fill="#b8794a" />
          <path d="M56 65q34-9 68-2" fill="none" stroke="#c38a57" strokeWidth="4" />
          <path d="m151 64 12 3-7 24-12-4" fill="#74547f" />
          <path d="M151 68q-7-29 12-36 25-13 34 12l5 14q15-1 14 12-1 14-24 13l-25-3Z" fill="#b8794a" />
          <path d="M162 39q-18-6-22 11l1 29q4 13 13 5 9-11 8-45Z" fill="#74432e" />
          <path d="M176 66q10-4 22 1l4 14q-21 7-26-6" fill="#ce945e" stroke="none" />
          <path d="M204 61q14-3 12 5-6 7-12 0Z" fill="#30201e" />
          <path d="M188 77q5 4 10 0" fill="none" strokeWidth="2" />
        </g>
        <ellipse className="dog-eye" cx="177" cy="53" rx="6" ry="7" fill="#fff0db" />
        <ellipse className="dog-eye" cx="192" cy="52" rx="6" ry="7" fill="#fff0db" />
        <g className="dog-pupil">
          <circle cx="177" cy="53" r="3" fill="#30201e" />
          <circle cx="178" cy="52" r="1" fill="#fff" />
        </g>
        <g className="dog-pupil">
          <circle cx="192" cy="52" r="3" fill="#30201e" />
          <circle cx="193" cy="51" r="1" fill="#fff" />
        </g>
        <circle cx="151" cy="84" r="4" fill="#c6a575" />
      </svg>
    </div>
  )
}

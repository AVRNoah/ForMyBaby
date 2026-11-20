import { useEffect, useRef, useState } from 'react'
import { chooseDogQuote } from './dogQuotes'
import { createBarkPlayer, shouldBark } from './dogBark'
import './InteractiveDog.css'

export default function InteractiveDog() {
  const host = useRef(null)
  const [quote, setQuote] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const soundEnabledRef = useRef(true)

  useEffect(() => {
    let hideTimer
    let previousText
    let active = true
    const bark = createBarkPlayer()
    function speak(event) {
      if (event.key !== 'Escape' || event.repeat || event.isComposing) return
      const next = chooseDogQuote(previousText)
      previousText = next.text
      const barking = soundEnabledRef.current && shouldBark()
      setQuote({ ...next, barking })
      if (barking) {
        bark.play().catch((error) => {
          console.error('Unable to play the dog bark.', error)
          if (active) setQuote((current) => current ? { ...current, barking: false, audioError: error.message } : current)
        })
      }
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => setQuote(null), 6500)
    }
    window.addEventListener('keydown', speak)
    return () => {
      active = false
      clearTimeout(hideTimer)
      window.removeEventListener('keydown', speak)
      bark.dispose().catch((error) => console.error('Unable to close dog audio.', error))
    }
  }, [])

  useEffect(() => {
    const pet = host.current
    const button = pet.querySelector('.site-dog-button')
    const flip = pet.querySelector('.site-dog-flip')
    const body = pet.querySelector('.site-dog-body')
    const badge = pet.querySelector('.site-dog-status')
    const toggle = pet.querySelector('.site-dog-mode')
    const svg = pet.querySelector('svg')
    const pupils = [...pet.querySelectorAll('.site-dog-pupil')]
    const lids = [...pet.querySelectorAll('.site-dog-lid')]
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const position = { x: 16, y: Math.max(24, innerHeight - 90) }
    let target = { ...position }
    let mouse = { x: 0, y: 0 }
    let hasMouse = false
    let mode = 'roam'
    let facing = 1
    let jumping = false
    let hovered = false
    let focused = false
    let frame = 0
    let roamTimer
    let blinkTimer
    let openEyesTimer
    let jumpTimer
    let lastTime = 0

    function clamp(point) {
      return {
        x: Math.max(0, Math.min(point.x, innerWidth - 130)),
        y: Math.max(24, Math.min(point.y, Math.max(24, innerHeight - 80))),
      }
    }

    function place() {
      Object.assign(position, clamp(position))
      pet.style.transform = `translate(${position.x}px, ${position.y}px)`
      const bubbleWidth = Math.min(240, innerWidth - 16)
      pet.style.setProperty('--speech-left', `${Math.max(8 - position.x, Math.min(-55, innerWidth - position.x - bubbleWidth - 8))}px`)
      pet.dataset.bubbleBelow = String(position.y < 180)
    }

    function followMouse() {
      target = clamp({ x: mouse.x - 65, y: mouse.y + 32 })
    }

    function pickTarget() {
      clearTimeout(roamTimer)
      if (mode !== 'roam' || motion.matches || document.hidden) return
      position.y = Math.max(24, innerHeight - 90)
      target = clamp({ x: Math.random() * Math.max(0, innerWidth - 130), y: position.y })
      roamTimer = setTimeout(pickTarget, 2500 + Math.random() * 2500)
    }

    function scheduleJump() {
      jumpTimer = setTimeout(() => {
        if (!hovered && !focused && pet.dataset.speaking !== 'true') jump()
        scheduleJump()
      }, 6000 + Math.random() * 6000)
    }

    function blink() {
      lids.forEach((lid) => lid.setAttribute('height', '12'))
      openEyesTimer = setTimeout(() => lids.forEach((lid) => lid.setAttribute('height', '0')), 140)
    }

    function update(time) {
      const step = lastTime ? Math.min((time - lastTime) / 16.67, 3) : 1
      lastTime = time
      const dx = target.x - position.x
      const dy = target.y - position.y
      const walking = !hovered && !focused && pet.dataset.speaking !== 'true' && Math.hypot(dx, dy) > 3
      if (walking) {
        const speed = 1 - (1 - (mode === 'follow' ? .05 : .025)) ** step
        position.x += dx * speed
        position.y += dy * speed
        if (Math.abs(dx) > 1) facing = dx > 0 ? 1 : -1
        flip.style.transform = `scaleX(${facing})`
      }
      body.classList.toggle('is-walking', walking && !jumping)
      place()

      const matrix = svg.getScreenCTM()
      if (hasMouse && matrix) {
        const point = new DOMPoint(mouse.x, mouse.y).matrixTransform(matrix.inverse())
        pupils.forEach((pupil, index) => {
          const cx = index === 0 ? 107 : 119
          const dx = point.x - cx
          const dy = point.y - 29
          const distance = Math.hypot(dx, dy)
          const amount = distance ? Math.min(distance, 2.1) / distance : 0
          pupil.setAttribute('cx', String(cx + dx * amount))
          pupil.setAttribute('cy', String(29 + dy * amount))
        })
      }
      frame = requestAnimationFrame(update)
    }

    function track(event) {
      if (event.pointerType === 'touch') return
      mouse = { x: event.clientX, y: event.clientY }
      hasMouse = true
      if (mode === 'follow' && !motion.matches) followMouse()
    }

    function jump() {
      if (jumping || motion.matches) return
      jumping = true
      body.classList.remove('is-walking')
      body.classList.add('is-jumping')
    }

    function finishJump(event) {
      if (event.target !== body || event.animationName !== 'site-dog-jump') return
      body.classList.remove('is-jumping')
      jumping = false
    }

    function toggleMode() {
      mode = mode === 'roam' ? 'follow' : 'roam'
      pet.dataset.mode = mode
      badge.textContent = mode === 'roam' ? 'Roaming' : 'Following you'
      toggle.textContent = mode === 'roam' ? 'Follow mouse' : 'Roam'
      syncMotion()
    }

    function resize() {
      if (mode === 'roam') {
        position.y = Math.max(24, innerHeight - 90)
        target.y = position.y
      }
      place()
      target = clamp(target)
    }

    function enter() { hovered = true }
    function leave() { hovered = false }
    function focusIn() { focused = true }
    function focusOut(event) { focused = pet.contains(event.relatedTarget) }

    function syncMotion() {
      cancelAnimationFrame(frame)
      clearTimeout(roamTimer)
      clearInterval(blinkTimer)
      clearTimeout(openEyesTimer)
      clearTimeout(jumpTimer)
      body.classList.remove('is-walking', 'is-jumping')
      jumping = false
      lids.forEach((lid) => lid.setAttribute('height', '0'))
      pupils.forEach((pupil, index) => {
        pupil.setAttribute('cx', String(index === 0 ? 107 : 119))
        pupil.setAttribute('cy', '29')
      })
      if (motion.matches || document.hidden) return
      lastTime = 0
      if (mode === 'roam') {
        pickTarget()
        place()
        scheduleJump()
      }
      else if (hasMouse) followMouse()
      blinkTimer = setInterval(blink, 3600)
      frame = requestAnimationFrame(update)
    }

    place()
    syncMotion()
    window.addEventListener('pointermove', track)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', syncMotion)
    motion.addEventListener('change', syncMotion)
    button.addEventListener('click', jump)
    button.addEventListener('dblclick', toggleMode)
    body.addEventListener('animationend', finishJump)
    toggle.addEventListener('click', toggleMode)
    pet.addEventListener('pointerenter', enter)
    pet.addEventListener('pointerleave', leave)
    pet.addEventListener('focusin', focusIn)
    pet.addEventListener('focusout', focusOut)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(roamTimer)
      clearInterval(blinkTimer)
      clearTimeout(openEyesTimer)
      clearTimeout(jumpTimer)
      window.removeEventListener('pointermove', track)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', syncMotion)
      motion.removeEventListener('change', syncMotion)
      button.removeEventListener('click', jump)
      button.removeEventListener('dblclick', toggleMode)
      body.removeEventListener('animationend', finishJump)
      toggle.removeEventListener('click', toggleMode)
      pet.removeEventListener('pointerenter', enter)
      pet.removeEventListener('pointerleave', leave)
      pet.removeEventListener('focusin', focusIn)
      pet.removeEventListener('focusout', focusOut)
    }
  }, [])

  return (
    <div ref={host} className="site-dog" data-mode="roam" data-speaking={Boolean(quote)}>
      <div className="site-dog-speech" data-quote-category={quote?.category} role="status" aria-live="polite" aria-atomic="true" hidden={!quote}>
        {quote && <>
          {quote.barking && <small>Woof woof!</small>}
          <span>{quote.text}</span>
          {quote.author && <small title={quote.work}>- {quote.author}, {quote.work}</small>}
          {quote.audioError && <small>{quote.audioError}</small>}
        </>}
      </div>
      <div className="site-dog-controls">
        <span className="site-dog-status">Roaming</span>
        <button type="button" className="site-dog-mode">Follow mouse</button>
        <button type="button" className="site-dog-sound" aria-pressed={!soundEnabled} onClick={() => {
          soundEnabledRef.current = !soundEnabledRef.current
          setSoundEnabled(soundEnabledRef.current)
        }}>{soundEnabled ? 'Mute barks' : 'Unmute barks'}</button>
      </div>
      <button type="button" className="site-dog-button" aria-label="Weenie dog: click to jump, double-click to switch roaming or following">
        <span className="site-dog-flip">
          <span className="site-dog-body">
            <svg viewBox="0 0 150 90" width="130" height="80" aria-hidden="true">
              <path className="site-dog-tail" d="M24 46Q6 32 10 20" stroke="#7a3e1d" strokeWidth="5" strokeLinecap="round" fill="none" />
              <rect x="30" y="56" width="9" height="17" rx="4.5" fill="#5c2d14" />
              <rect x="86" y="56" width="9" height="17" rx="4.5" fill="#5c2d14" />
              <rect x="22" y="38" width="84" height="26" rx="13" fill="#8c4a27" />
              <path d="M32 61Q64 65 95 61" stroke="#d99b66" strokeWidth="4" strokeLinecap="round" fill="none" />
              <rect x="38" y="58" width="9" height="18" rx="4.5" fill="#8c4a27" />
              <rect x="94" y="58" width="9" height="18" rx="4.5" fill="#8c4a27" />
              <rect x="91" y="36" width="8" height="24" rx="3" fill="#e63946" transform="rotate(-12 95 48)" />
              <circle cx="99" cy="58" r="3" fill="#ffd166" />
              <circle cx="106" cy="34" r="17" fill="#8c4a27" />
              <ellipse cx="124" cy="39" rx="16" ry="10" fill="#8c4a27" />
              <ellipse cx="122" cy="42" rx="12" ry="6.5" fill="#d99b66" />
              <ellipse cx="139" cy="37" rx="4" ry="3" fill="#1e1e1e" />
              <path d="M118 44Q126 48 133 43" stroke="#3b1d0e" strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="107" cy="29" r="5.5" fill="#fff" />
              <circle cx="119" cy="29" r="5.5" fill="#fff" />
              <circle className="site-dog-pupil" cx="107" cy="29" r="2.8" fill="#1e1e1e" />
              <circle className="site-dog-pupil" cx="119" cy="29" r="2.8" fill="#1e1e1e" />
              <rect className="site-dog-lid" x="101" y="23" width="12" height="0" fill="#8c4a27" rx="3" />
              <rect className="site-dog-lid" x="113" y="23" width="12" height="0" fill="#8c4a27" rx="3" />
              <path d="M96 24C84 26 82 52 92 55C101 57 104 38 100 26Z" fill="#5c2d14" />
            </svg>
          </span>
        </span>
      </button>
    </div>
  )
}

export function shouldBark(random = Math.random) {
  return random() < 0.05
}

export function createBarkPlayer() {
  let context
  let buffer
  let disposed = false
  const voices = new Set()

  return {
    async play() {
      if (disposed) return
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext
      if (!Audio) throw new Error('This browser does not support bark audio.')
      context ||= new Audio()
      if (context.state === 'suspended') await context.resume()
      if (disposed) return
      if (context.state !== 'running') throw new Error('Bark audio could not start.')

      if (!buffer) {
        const response = await fetch(`${import.meta.env.BASE_URL}audio/dachshund-bark.mp3`)
        if (!response.ok) throw new Error(`Bark recording could not load (HTTP ${response.status}).`)
        const data = await response.arrayBuffer()
        if (disposed) return
        buffer = await context.decodeAudioData(data)
      }
      if (disposed) return

      for (const voice of voices) voice.stop()
      const voice = context.createBufferSource()
      const volume = context.createGain()
      const start = context.currentTime
      voice.buffer = buffer
      volume.gain.setValueAtTime(0, start)
      volume.gain.linearRampToValueAtTime(.45, start + .02)
      volume.gain.setValueAtTime(.45, start + 1.4)
      volume.gain.linearRampToValueAtTime(0, start + 1.5)
      voice.connect(volume).connect(context.destination)
      voices.add(voice)
      voice.onended = () => {
        voices.delete(voice)
        voice.disconnect()
        volume.disconnect()
      }
      voice.start(start, 3.6, 1.5)
    },
    async dispose() {
      disposed = true
      if (context && context.state !== 'closed') await context.close()
    },
  }
}

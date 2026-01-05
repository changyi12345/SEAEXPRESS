// Function to play order notification sound (LOUDER)
export const playOrderNotificationSound = async () => {
  try {
    // Create or get AudioContext
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported')
      return
    }

    const audioContext = new AudioContextClass()
    
    // Resume AudioContext if suspended (required by browser autoplay policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    const gainNode = audioContext.createGain()
    gainNode.connect(audioContext.destination)
    
    // Increased volume from 0.4 to 0.8 for louder sound
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)

    // Play a pleasant notification sound for new orders
    // Ascending melody: C5 -> E5 -> G5 -> C6 (louder and longer)
    const frequencies = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator()
      oscillator.connect(gainNode)
      oscillator.type = 'sine'
      const startTime = audioContext.currentTime + index * 0.12
      oscillator.frequency.setValueAtTime(freq, startTime)
      oscillator.start(startTime)
      oscillator.stop(audioContext.currentTime + 0.6)
    })

    console.log('🔔 Order notification sound played')
  } catch (error) {
    console.error('Could not play order notification sound:', error)
  }
}

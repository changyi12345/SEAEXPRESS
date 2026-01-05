import { useEffect } from 'react'

// Function to play notification sound
const playNotificationSound = (type = 'success') => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const gainNode = audioContext.createGain()
    gainNode.connect(audioContext.destination)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

    if (type === 'success') {
      // Pleasant ascending chord (C-E-G)
      const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator()
        oscillator.connect(gainNode)
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1)
        oscillator.start(audioContext.currentTime + index * 0.1)
        oscillator.stop(audioContext.currentTime + 0.4)
      })
    } else if (type === 'error') {
      // Lower, more urgent descending tone
      const oscillator = audioContext.createOscillator()
      oscillator.connect(gainNode)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime) // G4
      oscillator.frequency.exponentialRampToValueAtTime(349.23, audioContext.currentTime + 0.2) // F4
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } else {
      // Info tone - simple beep
      const oscillator = audioContext.createOscillator()
      oscillator.connect(gainNode)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(440.00, audioContext.currentTime) // A4
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    }
  } catch (error) {
    console.log('Could not play notification sound:', error)
  }
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    // Play notification sound when toast appears
    playNotificationSound(type)
  }, [type])

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const bgColor = type === 'success' 
    ? 'bg-green-500' 
    : type === 'error' 
    ? 'bg-red-500' 
    : 'bg-blue-500'

  const icon = type === 'success' 
    ? '✓' 
    : type === 'error' 
    ? '✗' 
    : 'ℹ'

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px] max-w-md`}>
        <span className="text-2xl font-bold">{icon}</span>
        <p className="flex-1 font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition text-xl font-bold"
        >
          ×
        </button>
      </div>
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}


'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MicrophoneIcon, SpeakerWaveIcon, StopIcon } from '@heroicons/react/24/outline'

interface VoiceAgentProps {
  className?: string
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

export default function VoiceAgent({ className = '' }: VoiceAgentProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [isExpanded, setIsExpanded] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startListening = useCallback(async () => {
    try {
      setVoiceState('listening')
      setTranscript('')
      setResponse('')
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' })
        await processAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 10000)

    } catch (error) {
      console.error('Error starting voice recording:', error)
      setVoiceState('idle')
    }
  }, [])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const processAudio = useCallback(async (audioBlob: Blob) => {
    setVoiceState('processing')
    
    try {
      // Convert audio to text (you would implement speech-to-text here)
      const formData = new FormData()
      formData.append('audio', audioBlob)
      
      const transcriptResponse = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      })
      
      if (!transcriptResponse.ok) {
        throw new Error('Transcription failed')
      }
      
      const { transcript: userTranscript } = await transcriptResponse.json()
      setTranscript(userTranscript)
      
      // Get AI response
      const aiResponse = await fetch('/api/voice/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: userTranscript }),
      })
      
      if (!aiResponse.ok) {
        throw new Error('AI response failed')
      }
      
      const { response: aiTextResponse, audioUrl } = await aiResponse.json()
      setResponse(aiTextResponse)
      
      // Play the AI voice response
      if (audioUrl && audioRef.current) {
        setVoiceState('speaking')
        audioRef.current.src = audioUrl
        audioRef.current.play()
      } else {
        setVoiceState('idle')
      }
      
    } catch (error) {
      console.error('Error processing audio:', error)
      setVoiceState('idle')
    }
  }, [])

  const handleAudioEnd = useCallback(() => {
    setVoiceState('idle')
  }, [])

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const getStateMessage = () => {
    switch (voiceState) {
      case 'listening':
        return 'Listening... Speak now'
      case 'processing':
        return 'Processing your message...'
      case 'speaking':
        return 'Speaking...'
      default:
        return 'Click to start voice conversation'
    }
  }

  const getStateColor = () => {
    switch (voiceState) {
      case 'listening':
        return 'bg-red-500'
      case 'processing':
        return 'bg-yellow-500'
      case 'speaking':
        return 'bg-green-500'
      default:
        return 'bg-indigo-600'
    }
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 bg-white rounded-lg shadow-xl border p-4 w-80 max-h-96 overflow-y-auto"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">AI Voice Assistant</h3>
              <p className="text-sm text-gray-600">{getStateMessage()}</p>
            </div>

            {transcript && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>You said:</strong> {transcript}
                </p>
              </div>
            )}

            {response && (
              <div className="mb-3 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>AI Response:</strong> {response}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                onClick={voiceState === 'listening' ? stopListening : startListening}
                disabled={voiceState === 'processing' || voiceState === 'speaking'}
                className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {voiceState === 'listening' ? (
                  <>
                    <StopIcon className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <MicrophoneIcon className="h-4 w-4 mr-2" />
                    Talk
                  </>
                )}
              </button>
              
              <button
                onClick={toggleExpanded}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Minimize
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isExpanded ? undefined : toggleExpanded}
        className={`
          relative w-16 h-16 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300
          ${getStateColor()}
        `}
      >
        {voiceState === 'listening' && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse" />
        )}
        
        <div className="relative z-10 flex items-center justify-center">
          {voiceState === 'speaking' ? (
            <SpeakerWaveIcon className="h-6 w-6" />
          ) : (
            <MicrophoneIcon className="h-6 w-6" />
          )}
        </div>
        
        {(voiceState === 'listening' || voiceState === 'processing') && (
          <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
        )}
      </motion.button>

      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
        className="hidden"
      />
    </div>
  )
}
interface ElevenLabsConfig {
  apiKey: string
  voiceId: string
  baseUrl?: string
}

interface VoiceSettings {
  stability: number
  similarity_boost: number
  style?: number
  use_speaker_boost?: boolean
}

interface TextToSpeechOptions {
  text: string
  voice_id?: string
  model_id?: string
  voice_settings?: VoiceSettings
}

class ElevenLabsAPI {
  private config: ElevenLabsConfig
  
  constructor(config: ElevenLabsConfig) {
    this.config = {
      baseUrl: 'https://api.elevenlabs.io/v1',
      ...config
    }
  }

  async textToSpeech(options: TextToSpeechOptions): Promise<ArrayBuffer> {
    const {
      text,
      voice_id = this.config.voiceId,
      model_id = 'eleven_monolingual_v1',
      voice_settings = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0,
        use_speaker_boost: true
      }
    } = options

    const response = await fetch(`${this.config.baseUrl}/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.config.apiKey
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings
      })
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
    }

    return response.arrayBuffer()
  }

  async getVoices() {
    const response = await fetch(`${this.config.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.config.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async streamTextToSpeech(options: TextToSpeechOptions): Promise<ReadableStream> {
    const {
      text,
      voice_id = this.config.voiceId,
      model_id = 'eleven_monolingual_v1',
      voice_settings = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0,
        use_speaker_boost: true
      }
    } = options

    const response = await fetch(`${this.config.baseUrl}/text-to-speech/${voice_id}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.config.apiKey
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings
      })
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
    }

    return response.body!
  }
}

// Default instance
const elevenlabs = new ElevenLabsAPI({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  voiceId: process.env.ELEVENLABS_VOICE_ID || ''
})

export { ElevenLabsAPI, elevenlabs }
export type { TextToSpeechOptions, VoiceSettings, ElevenLabsConfig }
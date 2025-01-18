import React, {useState, useEffect, useCallback, useRef} from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../components/ui/dropdown-menu"
import {Button} from "../components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select"
import {Maximize2, Music, Video, Play, Square} from "lucide-react"
import {keys} from "../data/keys"
import PianoKeys from "./PianoKeys"

const SAMPLE_MELODIES = {
  "Twinkle Little Star": [
    {note: "C5", duration: "4n"},
    {note: "C5", duration: "4n"},
    {note: "C5", duration: "4n"},
    {note: "G4", duration: "4n"},
    {note: "A4", duration: "4n"},
    {note: "A4", duration: "4n"},
    {note: "G4", duration: "2n"},
    {note: "E5", duration: "4n"},
    {note: "E5", duration: "4n"},
    {note: "D5", duration: "4n"},
    {note: "D5", duration: "4n"},
    {note: "C5", duration: "2n"}
  ]
}

type InstrumentName = "Piano" | "Synth" | "Strings"

type OscillatorType = "triangle" | "square" | "sine"

const INSTRUMENTS = {
  Piano: {
    type: "triangle",
    gain: 0.8
  },
  Synth: {
    type: "square",
    gain: 0.3
  },
  Strings: {
    type: "sine",
    gain: 0.5
  }
} as const

interface RecordedNote {
  note: string
  time: number
  duration: string
}

const Piano: React.FC = () => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set())
  const [isRecording, setIsRecording] = useState(false)
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([])
  const [selectedInstrument, setSelectedInstrument] =
    useState<InstrumentName>("Piano")

  const audioContext = useRef<AudioContext>()
  const activeOscillators = useRef<
    Map<string, {osc: OscillatorNode; gain: GainNode}>
  >(new Map())
  const recordStartTime = useRef<number>(0)
  const noteDurations = useRef<Map<string, number>>(new Map())

  const initializeAudioContext = () => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext()
    }
    return audioContext.current
  }

  const stopNote = useCallback(
    (note: string) => {
      const oscillatorPair = activeOscillators.current.get(note)
      if (oscillatorPair) {
        const {osc, gain} = oscillatorPair

        try {
          osc.stop()
          osc.disconnect()
          gain.disconnect()
        } catch (error) {
          console.error("Error stopping note:", error)
        }

        activeOscillators.current.delete(note)

        if (isRecording && noteDurations.current.has(note)) {
          const startTime = noteDurations.current.get(note)!
          const endTime = Date.now() - recordStartTime.current
          const duration = endTime - startTime

          setRecordedNotes(prev => [
            ...prev,
            {note, time: startTime, duration: String(duration)}
          ])
          noteDurations.current.delete(note)
        }

        setActiveKeys(prev => {
          const newSet = new Set(prev)
          newSet.delete(note)
          return newSet
        })
      }
    },
    [isRecording]
  )

  const stopAllNotes = useCallback(() => {
    Array.from(activeOscillators.current.keys()).forEach(note => {
      stopNote(note)
    })
    activeOscillators.current.clear()
    setActiveKeys(new Set())
  }, [stopNote])

  const startNote = useCallback(
    (note: string, duration?: number) => {
      const ctx = initializeAudioContext()

      if (activeOscillators.current.has(note)) {
        return
      }

      const freq = keys.find(k => k.note === note)?.freq || 440
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = INSTRUMENTS[selectedInstrument].type as OscillatorType
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime)
      gainNode.gain.setValueAtTime(
        INSTRUMENTS[selectedInstrument].gain,
        ctx.currentTime
      )

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.start()

      activeOscillators.current.set(note, {osc: oscillator, gain: gainNode})
      setActiveKeys(prev => new Set(prev).add(note))

      if (isRecording) {
        const time = Date.now() - recordStartTime.current
        noteDurations.current.set(note, time)
      }

      if (duration) {
        setTimeout(() => stopNote(note), duration)
      }
    },
    [isRecording, selectedInstrument, stopNote]
  )

  const toggleFullscreen = () => {
    console.log("active keys", activeKeys)
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const startRecording = () => {
    setIsRecording(true)
    setRecordedNotes([])
    recordStartTime.current = Date.now()
  }

  const stopRecording = () => {
    setIsRecording(false)
  }

  const playRecording = async () => {
    if (recordedNotes.length === 0) return
    initializeAudioContext()

    recordedNotes.forEach(({note, time, duration}) => {
      setTimeout(() => {
        startNote(note, parseInt(duration))
      }, time)
    })
  }

  const playMelody = async (melodyName: string) => {
    const melody = SAMPLE_MELODIES[melodyName as keyof typeof SAMPLE_MELODIES]
    initializeAudioContext()
    let currentTime = 0
    melody.forEach(({note, duration}) => {
      const durationMs =
        {
          "16n": 125,
          "8n": 250,
          "4n": 500,
          "2n": 1000,
          "1n": 2000
        }[duration] || 250

      setTimeout(() => {
        startNote(note, durationMs)
      }, currentTime)
      currentTime += durationMs
    })
  }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat) return
      const key = keys.find(k => k.key === event.key.toLowerCase())
      if (key) {
        startNote(key.note)
      }
    },
    [startNote]
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      const key = keys.find(k => k.key === event.key.toLowerCase())
      if (key) {
        stopNote(key.note)
      }
    },
    [stopNote]
  )

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllNotes()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", stopAllNotes)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", stopAllNotes)
      stopAllNotes()
    }
  }, [stopAllNotes])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      stopAllNotes()
    }
  }, [handleKeyDown, handleKeyUp, stopAllNotes])

  useEffect(() => {
    stopAllNotes()
  }, [selectedInstrument, stopAllNotes])

  return (
    <div className="w-full h-screen bg-gradient-to-b from-gray-400 to-gray-900 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-black/20">
        <div className="flex gap-4">
          <Select
            onValueChange={value =>
              setSelectedInstrument(value as InstrumentName)
            }
            defaultValue={selectedInstrument}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Instrument" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(INSTRUMENTS).map(inst => (
                <SelectItem key={inst} value={inst}>
                  {inst}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Music className="mr-2 h-4 w-4" />
                Melodies
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.keys(SAMPLE_MELODIES).map(melody => (
                <DropdownMenuItem
                  key={melody}
                  onClick={() => playMelody(melody)}
                >
                  {melody}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2">
          {!isRecording ? (
            <Button variant="outline" onClick={startRecording}>
              <Video className="mr-2 h-4 w-4" />
              Record
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopRecording}>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          )}

          <Button
            variant="outline"
            onClick={playRecording}
            disabled={recordedNotes.length === 0}
          >
            <Play className="mr-2 h-4 w-4" />
            Play
          </Button>

          <Button variant="outline" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 mx-5">
          <div className="w-full h-full overflow-x-auto overflow-y-hidden scrollbar-hide">
            <PianoKeys
              activeKeys={activeKeys}
              startNote={startNote}
              stopNote={stopNote}
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-white/10 backdrop-blur-sm border-t">
          <div className="flex justify-center items-center gap-2 flex-wrap p-4">
            {Array.from(activeKeys).map(note => (
              <div
                key={note}
                className="text-2xl font-bold px-4 py-2 bg-blue-100 rounded-lg 
                animate-note-appear"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Piano

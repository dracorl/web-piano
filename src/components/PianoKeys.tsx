import React from "react"
import {keys} from "../data/keys"

interface PianoKeysProps {
  activeKeys: Set<string>
  startNote: (note: string, freq: number) => void
  stopNote: (note: string) => void
}

const PianoKeys: React.FC<PianoKeysProps> = ({
  activeKeys,
  startNote,
  stopNote
}) => {
  return (
    <svg
      viewBox="0 0 1152 150"
      className="w-full h-full min-w-[1152px]"
      style={{
        objectFit: "contain"
      }}
    >
      {keys.map((key, index) => (
        <g
          key={key.note}
          onMouseDown={() => startNote(key.note, key.freq)}
          onMouseUp={() => stopNote(key.note)}
          onMouseLeave={() => stopNote(key.note)}
          onTouchStart={e => {
            e.preventDefault()
            startNote(key.note, key.freq)
          }}
          onTouchEnd={() => stopNote(key.note)}
        >
          <rect
            x={index * 24}
            y={0}
            width={24}
            height={key.color === "white" ? 150 : 100}
            fill={key.color}
            stroke="black"
            strokeWidth={1}
            className={`cursor-pointer transition-all duration-150 ${
              activeKeys.has(key.note)
                ? "fill-blue-200 scale-[0.98] shadow-inner animate-key-press"
                : ""
            }`}
          />
          <text
            x={index * 24 + 4}
            y={key.color === "white" ? 140 : 90}
            fontSize={8}
            fill={key.color === "white" ? "black" : "white"}
            className="select-none pointer-events-none"
          >
            {key.note}
          </text>
          {key.key && (
            <text
              x={index * 24 + 4}
              y={key.color === "white" ? 130 : 80}
              fontSize={8}
              fill={key.color === "white" ? "black" : "white"}
              className="select-none pointer-events-none"
            >
              ({key.key})
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

export default PianoKeys

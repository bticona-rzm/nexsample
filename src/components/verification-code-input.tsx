"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"

interface VerificationCodeInputProps {
  length?: number
  onComplete?: (code: string) => void
}

export function VerificationCodeInput({ length = 6, onComplete }: VerificationCodeInputProps) {
  const [code, setCode] = useState<string[]>(new Array(length).fill(""))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const processInput = (e: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    const num = e.target.value
    if (/[^0-9]/.test(num)) return

    // React 18 compatibility: Use functional updates for state
    setCode((prevCode) => {
      const newCode = [...prevCode]
      newCode[slot] = num

      // Move this inside the state update to ensure we're using the latest state
      if (newCode.every((digit) => digit !== "")) {
        // Use setTimeout to avoid state update during render
        setTimeout(() => onComplete?.(newCode.join("")), 0)
      }

      return newCode
    })

    // Focus next input after state update is complete
    if (slot !== length - 1) {
      setTimeout(() => {
        inputs.current[slot + 1]?.focus()
      }, 0)
    }
  }

  const onKeyUp = (e: KeyboardEvent<HTMLInputElement>, slot: number) => {
    if (e.key === "Backspace") {
      if (slot !== 0) {
        inputs.current[slot - 1]?.focus()
      }
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {code.map((num, idx) => (
        <Input
          key={idx}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={num}
          onChange={(e) => processInput(e, idx)}
          onKeyUp={(e) => onKeyUp(e, idx)}
          ref={(input) => (inputs.current[idx] = input)}
          className="w-12 h-12 text-center text-2xl"
          autoFocus={idx === 0}
        />
      ))}
    </div>
  )
}


"use client"

import { useState, type FormEvent, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Send } from "lucide-react"

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  isDarkMode: boolean
}

export function ChatInput({ onSend, disabled, isDarkMode }: ChatInputProps) {
  const [input, setInput] = useState("")
  const { t } = useTranslation()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSend(input)
      setInput("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, but allow Shift+Enter for new lines
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault() // Prevent default behavior (new line)
      if (input.trim()) {
        onSend(input)
        setInput("")
      }
    }
  }

  return (
    <div className={`border-t p-4 ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-[#E9EBED]"}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("askPlaceholder")}
          className={`flex-1 min-h-[50px] max-h-[200px] ${isDarkMode ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900"}`}
          disabled={disabled}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                disabled={disabled}
                className="bg-purple-600 text-white hover:bg-purple-700"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send message</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </form>
      <div className="mt-4 flex justify-between items-center">
        <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{t("disclaimer")}</div>
      </div>
    </div>
  )
}


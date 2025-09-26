"use client"

import { useMemo, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Bot, Copy, User } from "lucide-react"
import type { Message } from "@/types/chat"

interface ChatAreaProps {
  messages: Message[]
  isTyping: boolean
  isDarkMode: boolean
  searchQuery: string
  addMessage: (content: string, sender: "user" | "ai") => void
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>
}

export function ChatArea({ messages, isTyping, isDarkMode, searchQuery, addMessage, setMessages, setIsTyping }: ChatAreaProps) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const filteredMessages = useMemo(
    () => messages.filter((message) => message.content.toLowerCase().includes(searchQuery.toLowerCase())),
    [messages, searchQuery],
  )

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
    // React 18 compatibility: removed scrollRef from deps as it's a stable ref
  }, [messages, filteredMessages]) // Only re-run when messages change

  // Implement actual API calls

  return (
    <ScrollArea className={`flex-1 p-4 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      {filteredMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            {t("welcomeTitle")}
          </h1>
          <p className={`text-center max-w-md ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            {t("welcomeMessage")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 p-4 rounded-lg ${
                message.role === "assistant" ? (isDarkMode ? "bg-gray-800" : "bg-gray-100") : ""
              }`}
            >
              <Avatar>
                <AvatarFallback className={isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}>
                  {message.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className={`font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                  {message.role === "assistant" ? "TaxBrain" : "You"}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{message.content}</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(message.content)}
                      className={
                        isDarkMode
                          ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-400/60"
                      }
                      aria-label={t("copyMessage")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("copyMessage")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      )}
      {isTyping && (
        <div className="flex justify-start">
          <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
            <p>
              {t("aiTyping")}
              <span className="animate-pulse">...</span>
            </p>
          </div>
        </div>
      )}
      <div ref={scrollRef} />
    </ScrollArea>
  )
}
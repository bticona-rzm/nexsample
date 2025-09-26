import { useState } from "react"
import type { Message } from "@/types/chat"
import { Button } from "@/components/ui/button"
import { Copy, Download, CheckCheck } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([message.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `message-${message.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-3xl rounded-lg p-4 ${
          message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"
        }`}
      >
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {message.role === "assistant" && (
          <div className="mt-2 flex space-x-2">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={handleCopy}>
              {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


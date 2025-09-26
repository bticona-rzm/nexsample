import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "react-i18next"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onNewChat: () => void
  isDarkMode: boolean
}

const Logo = ({ isDarkMode, isOpen }: { isDarkMode: boolean; isOpen: boolean }) => {
  return (
    <div className="flex items-center">
      <div className="relative w-16 h-16 flex-shrink-0">
        {/* <Image
          src={
            isDarkMode
              ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TaxBrain_Logo_v4-cJneWVxTiTzv2lSmVrj2j8USHBWwsA.png"
              : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TaxBrain_Logo_v5_LM-6FEd7lUR00KwjAyWNE7JNvARHZLN6x.png"
          }
          alt="TaxBrain Logo"
          fill
          className="object-contain"
          priority
        /> */}
      </div>
      <span
        className={`ml-3 text-[2.2rem] font-bold transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      >
        <span className={isDarkMode ? "text-purple-500" : "text-purple-600"}>Tax</span>
        <span className={isDarkMode ? "text-blue-400" : "text-blue-500"}>Brain</span>
      </span>
    </div>
  )
}

export function Sidebar({ isOpen, onToggle, onNewChat, isDarkMode }: SidebarProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const { logout } = useAuth()

  const conversations = {
    today: [
      { id: "1", title: "Tax Deductions for Freelancers", date: new Date() },
      { id: "2", title: "Capital Gains Tax Calculation", date: new Date() },
    ],
    yesterday: [
      { id: "3", title: "Business Expense Categories", date: new Date(Date.now() - 86400000) },
      { id: "4", title: "Quarterly Tax Estimates", date: new Date(Date.now() - 86400000) },
    ],
  }

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 
        ${isDarkMode ? "bg-gray-800 text-gray-100" : "bg-[#E9EBED] text-gray-900 border-r border-gray-200"} 
        ${isOpen ? "w-80" : "w-20"}`}
    >
      <div className="flex items-center p-4">
        <Logo isDarkMode={isDarkMode} isOpen={isOpen} />
      </div>

      <div className={`flex-1 overflow-hidden transition-all duration-300 ${isOpen ? "w-full" : "w-0"}`}>
        <div className="p-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="w-full justify-start gap-2 bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800"
                  onClick={onNewChat}
                  aria-label={t("newChat")}
                >
                  <Plus className="h-4 w-4" />
                  <span className={isOpen ? "" : "hidden"}>{t("newChat")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("newChat")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1">
            {Object.entries(conversations).map(([period, convos]) => (
              <div key={period} className="space-y-1">
                {convos.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={`flex items-center rounded-lg px-3 py-2 text-sm transition-colors w-full text-left
                      ${
                        isDarkMode
                          ? "hover:bg-gray-700 text-gray-300 hover:text-gray-100"
                          : "hover:bg-gray-200 text-gray-700 hover:text-gray-900"
                      }`}
                    onClick={() => {
                      // TODO: Implement chat selection functionality
                      console.log(`Selected chat: ${conversation.title}`)
                    }}
                  >
                    <span className={isOpen ? "" : "hidden"}>{conversation.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}


"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Sun,
  Moon,
  Download,
  Settings,
  Search,
  ChevronDown,
  PanelRightOpen,
  PanelRightClose,
  Newspaper,
} from "lucide-react"
import { jsPDF } from "jspdf"
import { useAuth } from "@/contexts/AuthContext"
import { LanguageSelector } from "./language-selector"

interface TopBarProps {
  selectedModel: string
  setSelectedModel: (model: string) => void
  isDarkMode: boolean
  setIsDarkMode: (isDark: boolean) => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (isOpen: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function TopBar({
  selectedModel,
  setSelectedModel,
  isDarkMode,
  setIsDarkMode,
  isSidebarOpen,
  setIsSidebarOpen,
  searchQuery,
  setSearchQuery,
}: TopBarProps) {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()

  const saveAsPDF = () => {
    const doc = new jsPDF()
    doc.text("Chat History", 10, 10)
    doc.save("chat-history.pdf")
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const currentLanguage = i18n.language
  const flagSrc = currentLanguage === "en" ? "/images/us-flag.png" : "/images/es-flag.png"

  const lightModeHoverClass = "text-gray-600 hover:text-gray-900 hover:bg-gray-400/60"

  return (
    <TooltipProvider>
      <div
        className={`border-b p-4 flex items-center justify-between ${
          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-[#E9EBED]"
        }`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`gap-2 ${isDarkMode ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700" : lightModeHoverClass}`}
            >
              {selectedModel}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className={isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
          >
            <DropdownMenuItem
              onSelect={() => setSelectedModel("TaxBrain 1.0")}
              className={isDarkMode ? "text-gray-300 hover:bg-gray-700" : `text-gray-900 ${lightModeHoverClass}`}
            >
              TaxBrain 1.0
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setSelectedModel("TaxBrain 2.0")}
              className={isDarkMode ? "text-gray-300 hover:bg-gray-700" : `text-gray-900 ${lightModeHoverClass}`}
            >
              TaxBrain 2.0
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-2">
          <LanguageSelector isDarkMode={isDarkMode} lightModeHoverClass={lightModeHoverClass} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={isDarkMode ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700" : lightModeHoverClass}
                aria-label={isDarkMode ? t("lightMode") : t("darkMode")}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isDarkMode ? t("lightMode") : t("darkMode")}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={saveAsPDF}
                className={isDarkMode ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700" : lightModeHoverClass}
                aria-label={t("downloadPDF")}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("downloadPDF")}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isDarkMode ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700" : lightModeHoverClass}
                    aria-label={t("openMenu")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <line x1="4" x2="20" y1="12" y2="12" />
                      <line x1="4" x2="20" y1="6" y2="6" />
                      <line x1="4" x2="20" y1="18" y2="18" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("openMenu")}</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="end"
              className={isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
            >
              <DropdownMenuItem
                className={isDarkMode ? "text-gray-300 hover:bg-gray-700" : `text-gray-900 ${lightModeHoverClass}`}
              >
                <Newspaper className="mr-2 h-4 w-4" />
                {t("taxNews")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className={isDarkMode ? "bg-gray-700" : "bg-gray-200"} />
              <DropdownMenuItem
                className={isDarkMode ? "text-gray-300 hover:bg-gray-700" : `text-gray-900 ${lightModeHoverClass}`}
              >
                {t("upgradePlus")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={logout}
                className={isDarkMode ? "text-gray-300 hover:bg-gray-700" : `text-gray-900 ${lightModeHoverClass}`}
              >
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={isDarkMode ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700" : lightModeHoverClass}
                aria-label={t("openSettings")}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("openSettings")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className={`p-4 ${isDarkMode ? "bg-gray-800" : "bg-[#E9EBED]"}`}>
        <div className="relative flex items-center w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`mr-2 ${isDarkMode ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700" : lightModeHoverClass}`}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {isSidebarOpen ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSidebarOpen ? "Close sidebar" : "Open sidebar"}</p>
            </TooltipContent>
          </Tooltip>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${isDarkMode ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900"}`}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}


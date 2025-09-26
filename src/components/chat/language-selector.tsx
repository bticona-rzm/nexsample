import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface LanguageSelectorProps {
  isDarkMode: boolean
  lightModeHoverClass: string
}

export function LanguageSelector({ isDarkMode, lightModeHoverClass }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  const currentLanguage = i18n.language.startsWith("es") ? "es" : "en"
  const flagEmoji = currentLanguage === "en" ? getFlagEmoji("us") : getFlagEmoji("es")

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`text-2xl ${
                  isDarkMode ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700" : lightModeHoverClass
                }`}
                aria-label={t("changeLanguage")}
              >
                {flagEmoji}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("changeLanguage")}</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          align="end"
          className={isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
        >
          <DropdownMenuItem
            onClick={() => changeLanguage("en")}
            className={`gap-2 ${
              isDarkMode ? "text-gray-300 hover:bg-gray-700" : `text-gray-900 ${lightModeHoverClass}`
            } ${currentLanguage === "en" ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={currentLanguage === "en"}
          >
            <span>{getFlagEmoji("us")}</span> English
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => changeLanguage("es")}
            className={`gap-2 ${
              isDarkMode ? "text-gray-300 hover:bg-gray-700" : `text-gray-900 ${lightModeHoverClass}`
            } ${currentLanguage === "es" ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={currentLanguage === "es"}
          >
            <span>{getFlagEmoji("es")}</span> Español
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}


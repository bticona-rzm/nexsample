import Image from "next/image"

interface LogoProps {
  className?: string
  isDarkMode?: boolean
  isAuthPage?: boolean // New prop to determine which logo version to use
}

export function Logo({ className = "", isDarkMode = false, isAuthPage = false }: LogoProps) {
  // Use v6 logo for auth pages (signin/signup), v4 for others
  const logoUrl = isAuthPage
    ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TaxBrain_Logo_v6-WyvI6BJ6E9RAxFH61C1I4x3IlG21P0.png" // TaxBrain_Logo_v6
    : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TaxBrain_Logo_v4-zzZxlA5shUgGDr0DWJwKPIJJ5C8UxM.png" // TaxBrain_Logo_v4

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative w-16 h-16 flex-shrink-0">
        {/* <Image src={logoUrl || "/placeholder.svg"} alt="TaxBrain Logo" fill className="object-contain" priority /> */}
      </div>
      <span className="ml-3 text-[2.2rem] font-bold">
        {/* <span className={isDarkMode ? "text-purple-500" : "text-purple-600"}>Tax</span>
        <span className={isDarkMode ? "text-blue-400" : "text-blue-500"}>Brain</span> */}
      </span>
    </div>
  )
}


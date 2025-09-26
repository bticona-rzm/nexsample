import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <aside className={`bg-gray-800 p-4 ${isOpen ? "w-64" : "w-0"} transition-all duration-300 overflow-hidden`}>
      <Button className="w-full mb-4">New Chat</Button>
      <Input type="search" placeholder="Search chats..." className="mb-4" />
      <nav className="space-y-2">
        <Link href="#" className="block p-2 hover:bg-gray-700 rounded">
          Today
        </Link>
        <Link href="#" className="block p-2 hover:bg-gray-700 rounded">
          Yesterday
        </Link>
        <Link href="#" className="block p-2 hover:bg-gray-700 rounded">
          Previous 7 Days
        </Link>
      </nav>
      <div className="mt-8 space-y-2">
        <Link href="#" className="block p-2 hover:bg-gray-700 rounded">
          My GPTs
        </Link>
        <Link href="#" className="block p-2 hover:bg-gray-700 rounded">
          Customize AI
        </Link>
        <Link href="#" className="block p-2 hover:bg-gray-700 rounded">
          Settings
        </Link>
      </div>
    </aside>
  )
}


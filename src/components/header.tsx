import { Navigation } from "./navigation"

export function Header() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <div className="flex items-center space-x-2">
            <span className="inline-block font-bold">AI交易员</span>
          </div>
          <Navigation />
        </div>
      </div>
    </header>
  )
}

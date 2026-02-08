interface HeaderProps {
  onNavigate?: (section: string) => void
}

export default function Header({ onNavigate }: HeaderProps) {
  return (
    <header className="w-full py-6 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center bg-nexus-cream sticky top-0 z-50 border-b border-nexus-beige/50">
      {/* Logo Section */}
      <div className="text-center md:text-left mb-4 md:mb-0">
        <h1 className="font-serif text-3xl tracking-wide uppercase leading-none text-nexus-text">
          ATRIQUET
        </h1>
        <p className="text-[10px] tracking-[0.2em] text-nexus-gray uppercase mt-1">
          Style Journal
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex items-center space-x-6 md:space-x-8 text-xs font-bold tracking-widest text-nexus-text">
        <button
          onClick={() => onNavigate?.('upload')}
          className="bg-nexus-beige px-4 py-2 rounded-sm hover:bg-opacity-80 transition"
        >
          STYLE AI
        </button>
        <button
          onClick={() => onNavigate?.('home')}
          className="hover:text-nexus-brown transition"
        >
          HOME
        </button>
        <span className="hover:text-nexus-brown transition hidden sm:inline-block cursor-pointer">
          RECOMMENDATIONS
        </span>
        <span className="hover:text-nexus-brown transition hidden sm:inline-block cursor-pointer">
          MARKETPLACE
        </span>
        {/* Profile Link with Avatar */}
        <span className="flex items-center gap-2 hover:text-nexus-brown transition cursor-pointer">
          <span>PROFILE</span>
          <img
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover border border-gray-300"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIWhwuqSrSRFeFbK2PaoIgCRnVpFtj7rr4nUscT8LNaFTUlOWVFUcEnomj-7cHFORM03mmm-OzIyu5QEHrXmU-Ky-aJJTrvSyOwUXKj75i69qTKc0S-BYG9lG4CDDwYjusmLaomguyEaTmo9rxnUCZzvV-1SZXIiZ4SUH801x9y9rYSp5TH2LlHgPLZwIrLo1uuL5y2-u9gKOdg4YpoYO2XWTpkVFYkjotsdyE60RNhLO3jHNGgcFAjqZb7daEMqdx8x-EjzMFhvFh"
          />
        </span>
      </nav>
    </header>
  )
}

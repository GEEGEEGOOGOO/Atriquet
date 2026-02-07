export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">👗</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              ATRIQUET
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
              How It Works
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
              About
            </a>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}

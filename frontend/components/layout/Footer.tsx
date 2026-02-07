export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">👗</span>
              <span className="text-xl font-bold">ATRIQUET</span>
            </div>
            <p className="text-gray-400">
              AI-powered fashion recommendations tailored to your unique style
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Powered By</h4>
            <p className="text-gray-400 mb-2">Groq AI Infrastructure</p>
            <p className="text-gray-400 mb-2">Llama 3.2 Vision 90B</p>
            <p className="text-gray-400 mb-2">Llama 3.3 70B</p>
            <p className="text-gray-400">Google Gemini (Fallback)</p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 ATRIQUET. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

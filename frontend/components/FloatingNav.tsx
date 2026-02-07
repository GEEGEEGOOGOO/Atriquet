import { motion, AnimatePresence } from 'framer-motion'

interface FloatingNavProps {
    occasion: string
    style: string
    onOccasionChange: (value: string) => void
    onStyleChange: (value: string) => void
}

export default function FloatingNav({ occasion, style, onOccasionChange, onStyleChange }: FloatingNavProps) {
    const occasions = [
        { value: 'casual', label: 'Casual', icon: '👕' },
        { value: 'formal', label: 'Formal', icon: '🎩' },
        { value: 'business', label: 'Business', icon: '💼' },
        { value: 'party', label: 'Party', icon: '🎉' },
        { value: 'wedding', label: 'Wedding', icon: '💒' },
    ]

    const styles = [
        { value: 'minimalist', label: 'Minimalist', icon: '⚪' },
        { value: 'classic', label: 'Classic', icon: '🎯' },
        { value: 'trendy', label: 'Trendy', icon: '✨' },
        { value: 'bohemian', label: 'Bohemian', icon: '🌸' },
        { value: 'streetwear', label: 'Streetwear', icon: '🛹' },
    ]

    // Check if an occasion is selected
    const hasOccasionSelected = occasion !== ''

    return (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4">
            {/* Main Navbar */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="glass-strong rounded-2xl px-4 md:px-6 py-4 max-w-7xl mx-auto"
            >
                <div className="flex items-center justify-between gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-xl md:text-2xl font-bold gradient-text whitespace-nowrap">ATRIQUET</div>
                    </div>

                    {/* Center - Occasion Selector (Desktop) */}
                    <div className="hidden lg:flex items-center gap-3 flex-1 justify-center overflow-x-auto">
                        <span className="text-sm text-gray-400 whitespace-nowrap">Occasion:</span>
                        <div className="flex gap-2">
                            {occasions.map((occ) => (
                                <button
                                    key={occ.value}
                                    onClick={() => onOccasionChange(occ.value)}
                                    className={`
                    px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap
                    ${occasion === occ.value
                                            ? 'glass-strong text-white glow-border-cyan'
                                            : 'glass text-gray-400 hover:text-white hover:glass-strong'
                                        }
                  `}
                                >
                                    <span className="mr-1.5">{occ.icon}</span>
                                    {occ.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right - Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap">
                            How It Works
                        </button>
                        <button className="px-4 md:px-5 py-2 md:py-2.5 glass-strong rounded-full text-sm font-semibold hover:glow-border-cyan transition-all duration-300 whitespace-nowrap">
                            Sign In
                        </button>
                    </div>
                </div>

                {/* Mobile Occasion Selector */}
                <div className="lg:hidden mt-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {occasions.map((occ) => (
                            <button
                                key={occ.value}
                                onClick={() => onOccasionChange(occ.value)}
                                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0
                  ${occasion === occ.value
                                        ? 'glass-strong text-white glow-border-cyan'
                                        : 'glass text-gray-400'
                                    }
                `}
                            >
                                <span className="mr-1.5">{occ.icon}</span>
                                {occ.label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.nav>

            {/* Style Bar - Appears below when occasion is selected */}
            <AnimatePresence>
                {hasOccasionSelected && (
                    <motion.div
                        initial={{ y: -20, opacity: 0, height: 0 }}
                        animate={{ y: 0, opacity: 1, height: 'auto' }}
                        exit={{ y: -20, opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="mt-3 overflow-hidden"
                    >
                        <div className="glass-strong rounded-2xl px-4 md:px-6 py-4 max-w-7xl mx-auto">
                            {/* Desktop Style Selector */}
                            <div className="hidden lg:flex items-center gap-3 justify-center">
                                <span className="text-sm text-gray-400 whitespace-nowrap">Style:</span>
                                <div className="flex gap-2 flex-wrap justify-center">
                                    {styles.map((st) => (
                                        <button
                                            key={st.value}
                                            onClick={() => onStyleChange(st.value)}
                                            className={`
                        px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap
                        ${style === st.value
                                                    ? 'glass-strong text-white glow-border-cyan'
                                                    : 'glass text-gray-400 hover:text-white hover:glass-strong'
                                                }
                      `}
                                        >
                                            <span className="mr-1.5">{st.icon}</span>
                                            {st.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Style Selector */}
                            <div className="lg:hidden">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {styles.map((st) => (
                                        <button
                                            key={st.value}
                                            onClick={() => onStyleChange(st.value)}
                                            className={`
                        px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0
                        ${style === st.value
                                                    ? 'glass-strong text-white glow-border-cyan'
                                                    : 'glass text-gray-400'
                                                }
                      `}
                                        >
                                            <span className="mr-1.5">{st.icon}</span>
                                            {st.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

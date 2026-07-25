import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, Check, ChevronDown, RotateCcw, Tag, Sparkles } from 'lucide-react';

export default function GalleryFilterBar({
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    totalResults,
    onResetAll
}) {
    const [isSortOpen, setIsSortOpen] = useState(false);
    const dropdownRef = useRef(null);

    const sortOptions = [
        { id: 'recommended', label: 'Recommended', icon: Sparkles },
        { id: 'price_asc', label: 'Price: Low to High', icon: Tag },
        { id: 'price_desc', label: 'Price: High to Low', icon: Tag },
        { id: 'newest', label: 'Newest First', icon: Sparkles },
        { id: 'popular', label: 'Most Popular', icon: Sparkles }
    ];

    const priceOptions = [
        { id: 'all', label: 'All Prices' },
        { id: 'under_100', label: '⚡ Under ₹100' },
        { id: '100_150', label: '🎯 ₹100 – ₹150' },
        { id: '150_plus', label: '💎 ₹150+' }
    ];

    const activeSortLabel = sortOptions.find(o => o.id === sortBy)?.label || 'Recommended';

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasActiveFilters = 
        sortBy !== 'recommended' || 
        priceRange !== 'all' || 
        activeCategory !== 'All' || 
        searchQuery !== '';

    return (
        <div className="w-full mb-8 space-y-4 relative z-40">
            {/* Top Toolbar: Price Budget Pills & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] p-3 rounded-2xl border border-white/5 backdrop-blur-md relative z-40">
                
                {/* Price Budget Pills (Tremor Style) */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-1 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-purple-400" /> Price:
                    </span>
                    {priceOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setPriceRange(opt.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                priceRange === opt.id
                                    ? 'bg-gradient-to-r from-[#7C3AED]/80 to-[#EC4899]/80 border-purple-400/50 text-white shadow-md shadow-purple-500/20 scale-[1.02]'
                                    : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Right Group: Sort Dropdown & Reset */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    
                    {/* Sort Dropdown (OriginUI Style) */}
                    <div className="relative z-40" ref={dropdownRef}>
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/90 hover:bg-white/10 hover:border-white/20 transition-all shadow-sm"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
                            <span>Sort: {activeSortLabel}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isSortOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0e0e14]/95 border border-white/10 backdrop-blur-xl shadow-2xl z-[100] overflow-hidden py-1.5"
                                >
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 mb-1">
                                        Sort Templates By
                                    </div>
                                    {sortOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                setSortBy(opt.id);
                                                setIsSortOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                                                sortBy === opt.id
                                                    ? 'bg-purple-600/20 text-purple-300 font-semibold'
                                                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <opt.icon className="w-3.5 h-3.5 text-purple-400" />
                                                <span>{opt.label}</span>
                                            </div>
                                            {sortBy === opt.id && (
                                                <Check className="w-3.5 h-3.5 text-purple-400" />
                                            )}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Reset Button (Visible when filters active) */}
                    {hasActiveFilters && (
                        <button
                            onClick={onResetAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 text-xs font-medium transition-all"
                            title="Reset all active filters"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Reset</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Active Filters Summary Bar */}
            {hasActiveFilters && (
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                    <span>Showing <strong className="text-white">{totalResults}</strong> template{totalResults !== 1 ? 's' : ''}</span>
                    <button 
                        onClick={onResetAll}
                        className="text-purple-400 hover:underline text-[11px] font-medium"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );
}

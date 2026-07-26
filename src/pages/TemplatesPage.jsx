import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Video, Image as ImageIcon } from 'lucide-react';
import TemplateCard from '../components/TemplateCard';
import GalleryFilterBar from '../components/GalleryFilterBar';
import { fetchTemplates } from '../lib/api';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState('image');
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [sortBy, setSortBy] = useState('recommended');
    const [priceRange, setPriceRange] = useState('all');
    
    // 10-Item Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const gridRef = React.useRef(null);

    useEffect(() => {
        fetchTemplates()
            .then((data) => {
                setTemplates(data || []);
            })
            .catch((err) => {
                console.error('Failed to fetch templates:', err);
            })
            .finally(() => setLoading(false));
    }, []);

    // Filter by type (video vs image)
    const typeFiltered = useMemo(() => {
        return templates.filter(t => (t.template_type || t.templateType || 'video') === activeType);
    }, [templates, activeType]);

    // Extract unique categories from the current type's templates
    const categories = useMemo(() => {
        const cats = new Set();
        typeFiltered.forEach(t => {
            const cat = t.category || (t.tags && t.tags[0]);
            if (cat) cats.add(cat);
        });
        return ['All', ...Array.from(cats)];
    }, [typeFiltered]);

    // Reset category, format, and pagination if filter/sort/type changes
    useEffect(() => {
        setActiveCategory('All');
        setPriceRange('all');
        setSortBy('recommended');
        setCurrentPage(1);
    }, [activeType]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory, priceRange, sortBy, searchQuery]);

    const handleResetAllFilters = () => {
        setActiveCategory('All');
        setPriceRange('all');
        setSortBy('recommended');
        setSearchQuery('');
        setCurrentPage(1);
    };

    // Final filtered and sorted list
    const finalFiltered = useMemo(() => {
        let list = typeFiltered.filter(t => {
            const matchesSearch = (t.name || t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const templateCategory = t.category || (t.tags && t.tags[0]) || 'General';
            const matchesCategory = activeCategory === 'All' || templateCategory === activeCategory;

            // Price Range Filtering
            const numPrice = Number(t.price) || 0;
            let matchesPrice = true;
            if (priceRange === 'under_100') matchesPrice = numPrice <= 100;
            else if (priceRange === '100_150') matchesPrice = numPrice >= 100 && numPrice <= 150;
            else if (priceRange === '150_plus') matchesPrice = numPrice >= 150;

            return matchesSearch && matchesCategory && matchesPrice;
        });

        // Price & Attribute Sorting
        return list.sort((a, b) => {
            const priceA = Number(a.price) || 0;
            const priceB = Number(b.price) || 0;
            if (sortBy === 'price_asc') return priceA - priceB;
            if (sortBy === 'price_desc') return priceB - priceA;
            if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            if (sortBy === 'popular') return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
            return 0; // default recommended
        });
    }, [typeFiltered, activeCategory, searchQuery, activeType, priceRange, sortBy]);

    // 10-Item Paginated Slice
    const totalPages = Math.max(1, Math.ceil(finalFiltered.length / itemsPerPage));
    const pagedTemplates = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return finalFiltered.slice(start, start + itemsPerPage);
    }, [finalFiltered, currentPage, itemsPerPage]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            if (gridRef.current) {
                gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 w-full text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-6">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 mb-4 backdrop-blur-md">
                            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-purple-300">
                                ✨ Premium Collection
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold mb-2">Template Gallery</h1>
                        <p className="text-zinc-400">Discover premium AI video and image templates.</p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col sm:flex-row gap-4 w-full md:w-auto"
                    >
                        <div className="flex bg-white/5 rounded-full p-1 border border-white/10 relative">
                            <button
                                onClick={() => setActiveType('video')}
                                className={`relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors z-10 ${
                                    activeType === 'video' ? 'text-white' : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                {activeType === 'video' && (
                                    <motion.div
                                        layoutId="activeTypeHighlight"
                                        className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-full -z-10 shadow-lg shadow-[#7C3AED]/20"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <Video className="w-4 h-4" /> Video
                            </button>
                            <button
                                onClick={() => setActiveType('image')}
                                className={`relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors z-10 ${
                                    activeType === 'image' ? 'text-white' : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                {activeType === 'image' && (
                                    <motion.div
                                        layoutId="activeTypeHighlight"
                                        className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-full -z-10 shadow-lg shadow-[#7C3AED]/20"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <ImageIcon className="w-4 h-4" /> Image
                            </button>
                        </div>
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input 
                                type="text" 
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 ring-[#7C3AED]/50 transition-all text-white placeholder-zinc-500"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-6">
                    {categories.map((cat, i) => (
                        <motion.button
                            key={cat}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                activeCategory === cat 
                                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] border-transparent text-white shadow-lg' 
                                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                            }`}
                        >
                            {cat}
                        </motion.button>
                    ))}
                </div>

                {/* E-Commerce Gallery Filter & Sorting Toolbar */}
                <GalleryFilterBar 
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    totalResults={finalFiltered.length}
                    onResetAll={handleResetAllFilters}
                />

                {loading ? (
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div 
                                key={i} 
                                className="w-full aspect-[4/5] rounded-3xl bg-white/[0.03] border border-white/5 p-4 flex flex-col justify-between animate-pulse relative overflow-hidden"
                            >
                                <div className="w-16 h-5 rounded-full bg-white/10" />
                                <div className="space-y-2">
                                    <div className="w-3/4 h-4 rounded-md bg-white/10" />
                                    <div className="flex justify-between items-center">
                                        <div className="w-12 h-5 rounded-md bg-white/10" />
                                        <div className="w-20 h-6 rounded-full bg-white/10" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : finalFiltered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                        <div className="text-6xl mb-4 opacity-50">📭</div>
                        <h3 className="text-2xl font-bold mb-2">No templates found</h3>
                        <p className="text-zinc-400 max-w-md text-center">
                            We couldn't find any {activeType} templates matching your filters. Try clearing your search or selecting a different category.
                        </p>
                        {(searchQuery || activeCategory !== 'All' || priceRange !== 'all') && (
                            <button 
                                onClick={handleResetAllFilters}
                                className="mt-6 glass-button px-6 py-2 rounded-full text-sm font-semibold"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="relative" ref={gridRef}>
                        {/* High-Density 2-Column Mobile & Responsive Grid */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {pagedTemplates.map((template, index) => (
                                <div key={template.id} className="w-full h-full">
                                    <TemplateCard template={template} delay={(index % 5) * 0.06} />
                                </div>
                            ))}
                        </div>

                        {/* Modern Accessible Glass Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                                <div className="text-xs text-zinc-400 font-medium order-2 sm:order-1">
                                    Showing <span className="text-white font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                                    <span className="text-white font-semibold">{Math.min(currentPage * itemsPerPage, finalFiltered.length)}</span> of{' '}
                                    <span className="text-white font-semibold">{finalFiltered.length}</span> templates
                                </div>

                                <nav aria-label="Template pagination" className="flex items-center gap-2 order-1 sm:order-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        aria-label="Go to previous page"
                                        className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/90 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        ◄ Prev
                                    </button>

                                    {/* Page number buttons */}
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/[0.02] border border-white/5">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                aria-current={currentPage === pageNum ? 'page' : undefined}
                                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                                    currentPage === pageNum
                                                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md shadow-purple-500/20 scale-105'
                                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        aria-label="Go to next page"
                                        className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/90 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next ►
                                    </button>
                                </nav>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

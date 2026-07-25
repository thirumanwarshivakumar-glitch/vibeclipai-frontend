import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Video, Image as ImageIcon } from 'lucide-react';
import TemplateCard from '../components/TemplateCard';
import GalleryFilterBar from '../components/GalleryFilterBar';
import { fetchTemplates } from '../lib/api';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState('video');
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [sortBy, setSortBy] = useState('recommended');
    const [priceRange, setPriceRange] = useState('all');

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

    // Reset category and format if type changes
    useEffect(() => {
        setActiveCategory('All');
        setPriceRange('all');
        setSortBy('recommended');
    }, [activeType]);

    const handleResetAllFilters = () => {
        setActiveCategory('All');
        setPriceRange('all');
        setSortBy('recommended');
        setSearchQuery('');
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
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="spinner" style={{ margin: '0 auto 16px', borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#7C3AED', width: 40, height: 40, borderWidth: 3, borderStyle: 'solid', borderRadius: '50%' }}></div>
                        <h3 className="text-xl font-bold mb-2">Fetching Templates...</h3>
                        <p className="text-zinc-400">Please wait while we load our premium collection.</p>
                    </div>
                ) : finalFiltered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                        <div className="text-6xl mb-4 opacity-50">📭</div>
                        <h3 className="text-2xl font-bold mb-2">No templates found</h3>
                        <p className="text-zinc-400 max-w-md text-center">
                            We couldn't find any {activeType} templates matching your filters. Try clearing your search or selecting a different category.
                        </p>
                        {(searchQuery || activeCategory !== 'All') && (
                            <button 
                                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                                className="mt-6 glass-button px-6 py-2 rounded-full text-sm font-semibold"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="relative">
                        {/* Mobile swipe indicator hint */}
                        <div className="sm:hidden flex items-center justify-between text-[11px] font-medium text-purple-300/70 mb-3 px-1">
                            <span>Swipe to explore templates</span>
                            <span>{finalFiltered.length} Available</span>
                        </div>

                        {/* Hybrid Layout Container - Top Aligned Items */}
                        <div className="flex sm:grid overflow-x-auto snap-x snap-mandatory gap-4 pb-4 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5">
                            {finalFiltered.map((template, index) => (
                                <div key={template.id} className="flex-shrink-0 w-[78vw] max-w-[280px] snap-center sm:w-auto sm:max-w-none h-full">
                                    <TemplateCard template={template} delay={(index % 5) * 0.08} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

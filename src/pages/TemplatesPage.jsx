import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Video, Image as ImageIcon } from 'lucide-react';
import TemplateCard from '../components/TemplateCard';
import { fetchTemplates } from '../lib/api';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState('video');
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

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

    // Reset category to All if type changes
    useEffect(() => {
        setActiveCategory('All');
    }, [activeType]);

    // Final filtered list
    const finalFiltered = useMemo(() => {
        return typeFiltered.filter(t => {
            const matchesSearch = (t.name || t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const templateCategory = t.category || (t.tags && t.tags[0]) || 'General';
            const matchesCategory = activeCategory === 'All' || templateCategory === activeCategory;

            return matchesSearch && matchesCategory;
        });
    }, [typeFiltered, activeCategory, searchQuery]);

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
                        <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                            <button
                                onClick={() => setActiveType('video')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeType === 'video' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <Video className="w-4 h-4" /> Video
                            </button>
                            <button
                                onClick={() => setActiveType('image')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeType === 'image' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}
                            >
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

                <div className="flex flex-wrap gap-2 mb-12 border-b border-white/10 pb-6">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {finalFiltered.map((template, index) => (
                            <TemplateCard key={template.id} template={template} delay={(index % 4) * 0.1} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

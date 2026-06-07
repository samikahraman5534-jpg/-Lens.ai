/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Sparkles, SlidersHorizontal, RefreshCw, X, Palette, Crop, ArrowDownAZ } from 'lucide-react';
import { SearchFilters, QuerySuggestions } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SearchHeaderProps {
  onSearch: (filters: Partial<SearchFilters>) => void;
  isLoading: boolean;
  suggestions: QuerySuggestions | null;
  currentFilters: SearchFilters;
  isAiLoading: boolean;
  onClearFilters: () => void;
}

const PRESET_TAGS = ['Doğa', 'Mimari', 'Teknoloji', 'Soyut', 'Minimalist', 'Uzay', 'Retro', 'Portre'];

const COLOR_OPTIONS = [
  { name: 'Hepsi', value: '' },
  { name: 'Siyah Beyaz', value: 'black_and_white', colorBg: 'bg-gradient-to-r from-black to-white' },
  { name: 'Siyah', value: 'black', colorBg: 'bg-black border border-white/20' },
  { name: 'Beyaz', value: 'white', colorBg: 'bg-white border border-black/20' },
  { name: 'Sarı', value: 'yellow', colorBg: 'bg-yellow-400' },
  { name: 'Turuncu', value: 'orange', colorBg: 'bg-orange-500' },
  { name: 'Kırmızı', value: 'red', colorBg: 'bg-red-500' },
  { name: 'Mor', value: 'purple', colorBg: 'bg-purple-600' },
  { name: 'Yeşil', value: 'green', colorBg: 'bg-green-500' },
  { name: 'Mavi', value: 'blue', colorBg: 'bg-blue-500' },
  { name: 'Turkuaz', value: 'teal', colorBg: 'bg-teal-500' },
];

const ORIENTATION_OPTIONS = [
  { name: 'Tüm Yönler', value: '' },
  { name: 'Yatay', value: 'landscape' },
  { name: 'Dikey', value: 'portrait' },
  { name: 'Kare Başbaşa', value: 'squarish' },
];

const SORT_OPTIONS = [
  { name: 'En Alakalı', value: 'relevant' },
  { name: 'En Yeni', value: 'latest' },
];

export default function SearchHeader({
  onSearch,
  isLoading,
  suggestions,
  currentFilters,
  isAiLoading,
  onClearFilters,
}: SearchHeaderProps) {
  const [input, setInput] = useState(currentFilters.query);
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch({ query: input.trim(), page: 1 });
    }
  };

  const handleTagClick = (tag: string) => {
    setInput(tag);
    onSearch({ query: tag, page: 1 });
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onSearch({ [key]: value, page: 1 });
  };

  const hasActiveFilters = currentFilters.color || currentFilters.orientation || currentFilters.order_by !== 'relevant';

  return (
    <header className="relative w-full py-12 px-6 md:px-12 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-10 self-center">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <div className="w-3.5 h-3.5 border-2 border-[#090909] rotate-45"></div>
          </div>
          <span className="text-xl tracking-[0.25em] font-serif uppercase text-white font-medium">Lens.ai</span>
        </div>

        {/* Title & Brand Slogan */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-serif text-white italic tracking-tight font-light">
            The Visual Index of Everything
          </h1>
          <p className="text-[10px] text-white/40 tracking-[0.3em] uppercase mt-2 font-mono">
            Internetin en kaliteli görsel evrenini anında bulun
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSubmit} className="w-full relative flex items-center">
          <div className="relative w-full flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tüm dünyada arayın... (Örn: 'Ajdar Anık', 'Lionel Messi', 'retro')"
              className="w-full pl-14 pr-32 py-5 rounded-full border border-white/15 bg-[#121212]/80 focus:border-white/30 focus:bg-[#121212] text-white placeholder-white/30 font-serif text-lg outline-none transition-all duration-300 shadow-2xl focus:ring-0"
              disabled={isLoading}
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 pointer-events-none" />
            
            {/* Quick action tools on the input right side */}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-full transition-all cursor-pointer ${
                  showFilters || hasActiveFilters
                    ? 'bg-white/20 text-white font-bold border border-white/30'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
                title="Hassas Filtreler"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="bg-white hover:bg-white/95 text-black font-bold uppercase tracking-widest text-[11px] py-3 px-6 rounded-full transition-all duration-200 active:scale-97 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                ) : (
                  <span>BUL</span>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center mt-4 justify-center w-full">
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-[0.2em]">Aktif Filtreler:</span>
            {currentFilters.color && (
              <span className="inline-flex items-center gap-1 text-[10px] tracking-wider uppercase px-2.5 py-1 bg-white/5 rounded-full text-white/80 font-bold border border-white/10 capitalize">
                Renk: {currentFilters.color}
                <button onClick={() => handleFilterChange('color', '')} className="text-white/40 hover:text-red-400 cursor-pointer ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {currentFilters.orientation && (
              <span className="inline-flex items-center gap-1 text-[10px] tracking-wider uppercase px-2.5 py-1 bg-white/5 rounded-full text-white/80 font-bold border border-white/10 capitalize">
                Yön: {ORIENTATION_OPTIONS.find(o => o.value === currentFilters.orientation)?.name}
                <button onClick={() => handleFilterChange('orientation', '')} className="text-white/40 hover:text-red-400 cursor-pointer ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {currentFilters.order_by !== 'relevant' && (
              <span className="inline-flex items-center gap-1 text-[10px] tracking-wider uppercase px-2.5 py-1 bg-white/5 rounded-full text-white/80 font-bold border border-white/10 capitalize">
                Sıra: {SORT_OPTIONS.find(s => s.value === currentFilters.order_by)?.name}
                <button onClick={() => handleFilterChange('order_by', 'relevant')} className="text-white/40 hover:text-red-400 cursor-pointer ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={onClearFilters}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/55 hover:text-white underline transition cursor-pointer"
            >
              Hepsini Temizle
            </button>
          </div>
        )}

        {/* Advanced Filters Expandable Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full bg-[#121212] border border-white/10 rounded-2xl p-5 mt-5 text-left overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Color Spectrum Filter */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white/60 mb-3">
                    <Palette className="w-3.5 h-3.5 text-white/50" />
                    <span>Renk Paleti</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleFilterChange('color', c.value)}
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                          currentFilters.color === c.value
                            ? 'bg-white text-black font-extrabold border-white scale-103'
                            : 'bg-[#181818] hover:bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {c.colorBg && (
                          <span className={`w-2.5 h-2.5 rounded-full ${c.colorBg}`} />
                        )}
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Filter */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white/60 mb-3">
                    <Crop className="w-3.5 h-3.5 text-white/50" />
                    <span>Kadraj / Yön</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {ORIENTATION_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => handleFilterChange('orientation', o.value)}
                        className={`text-left text-[10px] font-bold tracking-wider uppercase px-3.5 py-2.5 rounded-full border transition-all cursor-pointer ${
                          currentFilters.orientation === o.value
                            ? 'bg-white text-black font-extrabold border-white'
                            : 'bg-[#181818] hover:bg-white/5 text-white/60 border-white/10'
                        }`}
                      >
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sorting options */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white/60 mb-3">
                    <ArrowDownAZ className="w-3.5 h-3.5 text-white/50" />
                    <span>Arama Kriteri</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {SORT_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => handleFilterChange('order_by', s.value)}
                        className={`text-left text-[10px] font-bold tracking-wider uppercase px-3.5 py-2.5 rounded-full border transition-all cursor-pointer ${
                          currentFilters.order_by === s.value
                            ? 'bg-white text-black font-extrabold border-white'
                            : 'bg-[#181818] hover:bg-white/5 text-white/60 border-white/10'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preset Concept Recommendations */}
        <div className="flex items-center gap-2 mt-6 flex-wrap justify-center text-xs">
          <span className="text-white/30 font-semibold uppercase tracking-[0.2em] text-[10px]">Popüler Arayışlar:</span>
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-white/70 hover:text-white transition tracking-wider uppercase text-[10px] font-bold cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* AI Suggestions Section (Gemini Powered) */}
        {isAiLoading && (
          <div className="mt-8 flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 font-mono">
            <Sparkles className="w-4 h-4 animate-spin text-white/60" />
            <span>Yapay Zeka arama kurguları analiz ediliyor...</span>
          </div>
        )}

        {suggestions && !isAiLoading && (
          <div className="w-full mt-8 flex flex-col gap-3">
            {/* Translated queries banner if query is non-English */}
            {suggestions.translatedQuery && suggestions.translatedQuery.toLowerCase() !== currentFilters.query.toLowerCase() && (
              <div className="text-xs bg-white/5 text-white/70 border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between">
                <span className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white/50" />
                  Görsel motoru optimizasyonu için İngilizceye çevrildi: 
                  <em className="font-mono bg-white/5 px-2 py-0.5 rounded text-white not-italic italic font-bold">"{suggestions.translatedQuery}"</em>
                </span>
              </div>
            )}

            {/* Smart tags suggestion pills */}
            {suggestions.refinedTerms && suggestions.refinedTerms.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs justify-center md:justify-start">
                <span className="text-white/40 font-extrabold flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md uppercase tracking-wider text-[10px] font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  Öneriler
                </span>
                {suggestions.refinedTerms.map((term, idx) => (
                  <button
                    key={`${term}-${idx}`}
                    onClick={() => {
                      setInput(term);
                      onSearch({ query: term, page: 1 });
                    }}
                    className="px-3 py-1.5 bg-white/5 font-mono text-[10px] text-white/60 hover:text-white hover:bg-white/10 border border-white/10 rounded-md transition-all cursor-pointer"
                  >
                    #{term}
                  </button>
                ))}
              </div>
            )}

            {/* Creative Styles / Angles - Bento pills */}
            {suggestions.creativeAngles && suggestions.creativeAngles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
                {suggestions.creativeAngles.slice(0, 3).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(item.query);
                      onSearch({ query: item.query, page: 1 });
                    }}
                    className="group border border-white/10 bg-[#121212]/30 rounded-2xl p-4 hover:border-white/30 hover:bg-[#121212]/50 text-left transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-1.5 bg-white/10 text-white rounded-bl-xl opacity-0 group-hover:opacity-100 transition duration-300">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-serif font-bold text-sm text-white group-hover:text-white/90 transition italic">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-white/40 mt-1 whitespace-normal line-clamp-1">
                      {item.description}
                    </div>
                    <div className="font-mono text-[9px] text-white/50 mt-3 p-1 px-2 bg-black/40 group-hover:bg-black/60 rounded border border-white/5 font-medium whitespace-nowrap overflow-x-hidden text-ellipsis">
                      {item.query}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import SearchHeader from './components/SearchHeader';
import ImageGrid from './components/ImageGrid';
import ImageDetailsModal from './components/ImageDetailsModal';
import { UnsplashImage, SearchFilters, QuerySuggestions } from './types';
import { Compass, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function App() {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<UnsplashImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<QuerySuggestions | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string>('ddg');
  const [totalImages, setTotalImages] = useState(0);

  // Initial and active filters
  const [filters, setFilters] = useState<SearchFilters>({
    query: 'Doğa', // Initial curated aesthetic search
    color: '',
    orientation: '',
    order_by: 'relevant',
    page: 1,
    engine: 'ddg',
  });

  // Run initial search
  useEffect(() => {
    executeSearch();
  }, [filters.query, filters.color, filters.orientation, filters.order_by, filters.page, filters.engine]);

  const executeSearch = async () => {
    setIsLoading(true);
    setSearchError(null);
    try {
      // Build search URL
      let searchUrl = `/api/search?query=${encodeURIComponent(filters.query)}&page=${filters.page}`;
      if (filters.engine) searchUrl += `&engine=${filters.engine}`;
      if (filters.color) searchUrl += `&color=${filters.color}`;
      if (filters.orientation) searchUrl += `&orientation=${filters.orientation}`;
      if (filters.order_by) searchUrl += `&order_by=${filters.order_by}`;

      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error('Görsel arama motoruna bağlanılamadı.');
      }

      const data = await response.json();
      setImages(data.results || []);
      setTotalImages(data.total || 0);
      setEngineUsed(data.engine || 'unsplash');

      // Trigger AI suggestions in parallel (only if page is 1, as no need to refresh suggestions on page turn)
      if (filters.page === 1) {
        runAiQuerySuggestions(filters.query);
      }
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const runAiQuerySuggestions = async (searchQuery: string) => {
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/suggest-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        
        // If Gemini translated the query to English (because of Unsplash's English optimization)
        // we can optionally keep the active search mapped to improved parameters!
      }
    } catch (err) {
      console.warn('AI suggestions not available or loaded without keys:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSearchUpdate = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleClearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      color: '',
      orientation: '',
      order_by: 'relevant',
      page: 1,
    }));
  };

  const startTagSearch = (tag: string) => {
    handleSearchUpdate({ query: tag, page: 1 });
    setSelectedImage(null); // Close modal if open
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#e0e0e0] flex flex-col font-sans selection:bg-white/20 selection:text-white transition-colors duration-300">
      {/* Top Header section */}
      <SearchHeader
        onSearch={handleSearchUpdate}
        isLoading={isLoading}
        suggestions={suggestions}
        currentFilters={filters}
        isAiLoading={isAiLoading}
        onClearFilters={handleClearFilters}
      />

      {/* Main visual Stage */}
      <main className="flex-1">
        {searchError ? (
          <div className="max-w-md mx-auto text-center py-20 px-6">
            <div className="w-16 h-16 bg-white/5 text-red-400 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-white/10 shadow-sm">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Arama işlemi başarısız</h3>
            <p className="text-gray-400 mt-2 text-sm leading-relaxed">{searchError}</p>
            <button
              onClick={executeSearch}
              className="mt-6 inline-flex bg-white hover:bg-white/90 text-black font-extrabold text-xs py-3.5 px-6 rounded-full uppercase tracking-widest transition duration-200 cursor-pointer shadow-md"
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <ImageGrid
            images={images}
            onSelectImage={setSelectedImage}
            isLoading={isLoading}
            currentPage={filters.page}
            onPageChange={(p) => handleSearchUpdate({ page: p })}
            totalImages={totalImages}
            engineUsed={engineUsed}
          />
        )}
      </main>

      {/* Immersive interactive focus drawer modal */}
      <ImageDetailsModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onTagSearch={startTagSearch}
      />

      {/* Modern, humble watermark footer to align with Anti-AI Slop guidelines */}
      <footer className="py-8 bg-[#080808] border-t border-white/10 text-center">
        <p className="text-[10px] text-white/30 font-semibold tracking-[0.2em] uppercase flex items-center justify-center gap-2 select-none">
          <ImageIcon className="w-3.5 h-3.5 text-white/50" />
          Lens.ai — YAPAY ZEKA DESTEKLİ GLOBAL WEB GÖRSEL İNDEKSİ
        </p>
      </footer>
    </div>
  );
}

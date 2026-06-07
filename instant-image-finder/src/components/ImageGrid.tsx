/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UnsplashImage } from '../types';
import { Download, ExternalLink, Heart, ArrowLeft, ArrowRight, Eye, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageGridProps {
  images: UnsplashImage[];
  onSelectImage: (img: UnsplashImage) => void;
  isLoading: boolean;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  totalImages: number;
  engineUsed: string;
}

export default function ImageGrid({
  images,
  onSelectImage,
  isLoading,
  currentPage,
  onPageChange,
  totalImages,
  engineUsed,
}: ImageGridProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyUrl = (e: React.MouseEvent, id: string, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (e: React.MouseEvent, url: string, filename: string) => {
    e.stopPropagation();
    // Fetch and trigger direct browser download
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename || 'download.jpeg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(() => {
        // Fallback to regular tab opening if download is locked by CORS
        window.open(url, '_blank');
      });
  };

  if (isLoading && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[400px]">
        <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center animate-spin mb-6">
          <div className="w-4 h-4 border-2 border-[#080808] rotate-45"></div>
        </div>
        <p className="text-white/60 font-serif italic text-lg tracking-wide">Evren taranıyor...</p>
        <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] mt-1 font-mono">Görseller dizine ekleniyor</p>
      </div>
    );
  }

  if (!isLoading && images.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-6">
        <div className="w-16 h-16 bg-white/5 border border-white/10 text-white/50 rounded-full mx-auto flex items-center justify-center mb-6">
          <Eye className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-serif text-white italic">Hiç görsel bulunamadı</h3>
        <p className="text-white/40 mt-2 text-sm leading-relaxed">
          Sorguya uyan sonuç bulunamadı. Genel terimler ya da popüler arayışlar ile yeni bir tarama başlatabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-6 md:px-12">
      {/* Visual Header Stats */}
      <div className="flex items-center justify-between mb-8 text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono border-b border-white/5 pb-4">
        <span>Görseller: {totalImages > 0 ? `${totalImages} adet mevcut` : 'Taranmış sonuçlar'}</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span>SİSTEM AKTİF: TÜM WEB</span>
        </div>
      </div>

      {/* 4-Column Responsive Grid (Row-by-Row left-to-right order) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
        {images.map((img, index) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.4) }}
            onClick={() => onSelectImage(img)}
            className="rounded-sm overflow-hidden bg-[#121212] border border-white/5 group relative cursor-zoom-in transition-all duration-300 shadow-2xl hover:border-white/20 hover:-translate-y-0.5"
          >
            {/* Image display with unified aspect ratio */}
            <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-950">
              <img
                src={img.urls.regular}
                alt={img.alt_description || img.description || 'Görsel'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-700 brightness-[0.88] group-hover:brightness-100 group-hover:scale-102"
                loading="lazy"
              />
            </div>

            {/* Content info visible on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-5 text-white z-1 animate-fade-in">
              <div className="flex justify-end gap-2">
                {/* Save Link Icon */}
                <button
                  type="button"
                  onClick={(e) => copyUrl(e, img.id, img.urls.full)}
                  className="p-2.5 bg-white/10 hover:bg-white text-white hover:text-black rounded-full transition backdrop-blur-md cursor-pointer"
                  title="Görsel Linkini Kopyala"
                >
                  {copiedId === img.id ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                {/* Download Direct */}
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, img.urls.full, `lens_archive_${img.id}.jpeg`)}
                  className="p-2.5 bg-white/10 hover:bg-white text-white hover:text-black rounded-full transition backdrop-blur-md cursor-pointer"
                  title="Yüksek Kalitede İndir"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <p className="text-sm font-serif italic tracking-wide text-white line-clamp-2 md:line-clamp-3 leading-relaxed mb-3">
                  {img.description || img.alt_description || 'Cosmic Aesthetic Visual'}
                </p>
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={img.user.profile_image?.small}
                      alt={img.user.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full border border-white/25 object-cover"
                    />
                    <div className="max-w-[120px]">
                      <p className="text-[11px] font-bold truncate leading-none text-white">{img.user.name}</p>
                      {img.user.username && (
                        <p className="text-[8px] text-white/40 truncate font-mono mt-0.5">@{img.user.username}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-white/60 bg-white/5 py-1 px-2.5 rounded-full border border-white/5">
                    <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                    <span>{img.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modern Pagination Controls */}
      {images.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-16 border-t border-white/10 pt-10">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1 || isLoading}
            className="flex items-center gap-1.5 px-6 py-3 rounded-full border border-white/10 bg-[#121212] hover:bg-white/5 font-bold text-[10px] uppercase tracking-[0.15em] text-white/80 disabled:opacity-30 select-none transition duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Önceki
          </button>
          
          <div className="flex items-center justify-center font-serif italic text-white/50 text-sm">
            <span className="font-bold text-[#e0e0e0] border-b border-white/25 pb-0.5 px-3 min-w-[24px] text-center">
              {currentPage}
            </span>
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLoading || images.length < 24}
            className="flex items-center gap-1.5 px-6 py-3 rounded-full border border-white/10 bg-[#121212] hover:bg-white/5 font-bold text-[10px] uppercase tracking-[0.15em] text-white/80 disabled:opacity-30 select-none transition duration-200 cursor-pointer"
          >
            Sonraki
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

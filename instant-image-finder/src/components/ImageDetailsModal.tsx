/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UnsplashImage, ImageAnalysis } from '../types';
import { X, Download, Copy, Check, Sparkles, ExternalLink, Heart, Compass, HeartHandshake, Eye, Instagram, Palette, Focus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageDetailsModalProps {
  image: UnsplashImage | null;
  onClose: () => void;
  onTagSearch: (tag: string) => void;
}

export default function ImageDetailsModal({
  image,
  onClose,
  onTagSearch,
}: ImageDetailsModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Reset analysis when image changes
  React.useEffect(() => {
    setAnalysis(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
  }, [image]);

  if (!image) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(image.urls.full);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const handleDownload = () => {
    fetch(image.urls.full)
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `lens_archive_${image.id}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(() => {
        window.open(image.urls.full, '_blank');
      });
  };

  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: image.urls.regular,
          title: image.description || image.alt_description,
          author: image.user.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Yapay zeka analizi tarafında bir sorun oluştu.');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Görsel analiz edilemedi.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-[#121212] border border-white/10 rounded-sm w-full max-w-6xl overflow-hidden shadow-2xl relative flex flex-col lg:flex-row max-h-[88vh] lg:max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {{/* Close position element */}}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 bg-black/60 hover:bg-white text-white hover:text-black rounded-full transition shadow-md cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Side: Premium Image Stage */}
          <div className="w-full lg:w-3/5 bg-[#0b0b0b] flex flex-col justify-center items-center relative p-6 min-h-[350px] lg:min-h-0 lg:h-auto border-b lg:border-b-0 lg:border-r border-white/5">
            <img
              src={image.urls.regular}
              alt={image.alt_description || image.description || 'Görsel'}
              referrerPolicy="no-referrer"
              className="w-full h-full max-h-[44vh] lg:max-h-[64vh] object-contain rounded-sm select-none"
            />
            
            {/* Quick meta watermark footer */}
            <div className="mt-6 flex flex-wrap gap-4 items-center justify-between w-full text-[10px] text-white/40 tracking-wider uppercase font-mono border-t border-white/5 pt-4">
              <span>Cihaz/Çözünürlük: {image.width} x {image.height} px</span>
              <span className="flex items-center gap-1.5">
                Açık Ton: <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: image.color }} /> {image.color}
              </span>
              <a
                href={image.urls.full}
                target="_blank"
                rel="noreferrer"
                className="text-white hover:underline inline-flex items-center gap-1 cursor-pointer font-bold font-sans"
              >
                Kaynak URL <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Right Side: Information Console & Gemini Intelligence Panels */}
          <div className="w-full lg:w-2/5 flex flex-col justify-between overflow-y-auto bg-[#121212]">
            {/* Inner scroll container */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Profile Card & Engagement */}
              <div className="flex items-center justify-between border-b border-white/15 pb-5">
                <div className="flex items-center gap-3">
                  <img
                    src={image.user.profile_image?.large || image.user.profile_image?.medium}
                    alt={image.user.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-white/20 object-cover shadow-sm"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide">{image.user.name}</h4>
                    {image.user.username && (
                      <p className="text-[10px] text-white/40 font-mono">@{image.user.username}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {image.user.instagram_username && (
                    <a
                      href={`https://instagram.com/${image.user.instagram_username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full border border-white/10 transition"
                      title="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  <div className="flex items-center gap-1 text-[11px] font-mono text-white/80 bg-white/5 border border-white/10 py-1.5 px-3.5 rounded-full select-none">
                    <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    <span>{image.likes}</span>
                  </div>
                </div>
              </div>

              {/* Title Description */}
              <div>
                <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-mono block mb-1.5">Görsel Künyesi</span>
                <h3 className="text-lg font-serif text-white italic tracking-wide leading-relaxed font-light">
                  {image.description || image.alt_description || 'Cosmic Aesthetic Visual'}
                </h3>
              </div>

              {/* Gemini Trigger or Display */}
              {!analysis && !isAnalyzing && (
                <div className="bg-white/5 rounded-sm p-5 border border-white/10 shadow-sm">
                  <div className="flex gap-3">
                    <div className="p-2.5 bg-white text-black rounded-sm shrink-0 h-fit">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-white">Yapay Zeka Analiz Laboratuvarı</h4>
                      <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
                        Gemini Vision modelini kullanarak bu görselin kompozisyonunu, renk ahengini analiz edin, hikayesini yazın ve EXIF değerlerini tahmin edin.
                      </p>
                      <button
                        onClick={runAiAnalysis}
                        className="mt-4 bg-white hover:bg-white/90 text-black font-extrabold uppercase tracking-widest text-[9px] py-2.5 px-4 rounded-full transition cursor-pointer flex items-center gap-1.5 active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        Çözümleyiciyi Çalıştır
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Image analysis visual progress indicator */}
              {isAnalyzing && (
                <div className="bg-white/5 border border-white/10 rounded-sm p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center animate-spin mb-4">
                    <div className="w-4 h-4 border-2 border-black rotate-45 bg-[#121212]"></div>
                  </div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-white">Gemini Vision Modeli Aktif</h4>
                  <p className="text-[11px] text-white/40 mt-1 max-w-xs animate-pulse">
                    Renk skalası, sanatsal kompozisyon ve anlatı katmanları taranıyor.
                  </p>
                </div>
              )}

              {analysisError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-sm p-4 text-xs">
                  <strong>İşlem Başarısız:</strong> {analysisError}
                  <button onClick={runAiAnalysis} className="block mt-2 text-white hover:underline font-bold font-mono">
                    Yeniden Dene
                  </button>
                </div>
              )}

              {/* Gemini Analytics Finished Content */}
              {analysis && (
                <div className="space-y-6">
                  {/* Title banner */}
                  <div className="flex items-center gap-2 text-[9px] font-mono tracking-[0.2em] text-white bg-white/10 border border-white/10 px-3 py-1.5 rounded-sm w-fit">
                    <Sparkles className="w-3 h-3 text-white" />
                    <span>YAPAY ZEKA ANALİZ RAPORU</span>
                  </div>

                  {/* Mood summary */}
                  <div className="grid grid-cols-2 gap-3 bg-white/5 p-4 rounded-sm border border-white/5">
                    <div>
                      <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider block font-mono">Yansıtılan Hava</span>
                      <span className="text-xs font-extrabold text-[#e0e0e0] block mt-0.5">{analysis.mood}</span>
                    </div>
                    {analysis.photoSettingsIdea && (
                      <div>
                        <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider block font-mono">Çekim Parametresi</span>
                        <span className="text-[11px] font-mono font-bold text-[#e0e0e0] block mt-0.5 truncate" title={analysis.photoSettingsIdea}>
                          {analysis.photoSettingsIdea}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description detail */}
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-mono font-bold text-white/50 flex items-center gap-1.5 uppercase tracking-[0.15em]">
                      <Eye className="w-3.5 h-3.5" />
                      Yapay Zeka Tasviri
                    </h5>
                    <p className="text-xs text-white/75 leading-relaxed bg-white/5 p-4 rounded-sm border border-white/5 font-sans">
                      {analysis.description}
                    </p>
                  </div>

                  {/* Composition details */}
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-mono font-bold text-white/50 flex items-center gap-1.5 uppercase tracking-[0.15em]">
                      <Focus className="w-3.5 h-3.5" />
                      Kompozisyon & Işık
                    </h5>
                    <p className="text-xs text-white/75 leading-relaxed bg-white/5 p-4 rounded-sm border border-white/5 font-sans">
                      {analysis.composition}
                    </p>
                  </div>

                  {/* Poetic Story text info */}
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-mono font-bold text-white/50 flex items-center gap-1.5 uppercase tracking-[0.15em]">
                      <Compass className="w-3.5 h-3.5" />
                      Açıklamalı Hikaye
                    </h5>
                    <div className="relative bg-white/5 p-5 rounded-sm border border-white/10 italic text-sm text-white/70 leading-relaxed pl-7 font-serif">
                      <span className="absolute left-2 top-2 font-serif text-3xl text-white/20 leading-none select-none">“</span>
                      <span>{analysis.story}</span>
                    </div>
                  </div>

                  {/* Color Harmonized palette */}
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-mono font-bold text-white/50 flex items-center gap-1.5 uppercase tracking-[0.15em]">
                      <Palette className="w-3.5 h-3.5" />
                      Renk Paleti (Kopyalamak İçin Tıklayın)
                    </h5>
                    <div className="flex flex-col gap-2">
                      {analysis.palette.map((p, index) => (
                        <div
                          key={index}
                          onClick={() => handleCopyHex(p.hex)}
                          className={`flex items-center justify-between p-2.5 rounded-sm border cursor-pointer transition-all ${
                            copiedHex === p.hex
                              ? 'bg-white/15 border-white/30 scale-101'
                              : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-sm shadow-inner shrink-0" style={{ backgroundColor: p.hex }} />
                            <div>
                              <span className="text-[11px] font-bold text-[#e0e0e0] block leading-tight">{p.name}</span>
                              <span className="text-[9px] text-white/40 font-mono uppercase">{p.hex}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {p.ratio && (
                              <span className="text-[8px] font-mono font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-sm border border-white/5">
                                {p.ratio}
                              </span>
                            )}
                            <span className="p-1">
                              {copiedHex === p.hex ? (
                                <Check className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-white/30" />
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Creative prompt searches and tags */}
                  {analysis.creativeTags && analysis.creativeTags.length > 0 && (
                    <div className="space-y-2 border-t border-white/5 pt-4">
                      <span className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] block font-mono">Yaratıcı Kavramlar</span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.creativeTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => onTagSearch(tag)}
                            className="text-[9px] font-bold font-mono uppercase bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 px-2.5 py-1.5 rounded-md transition cursor-pointer"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions Console */}
            <div className="border-t border-white/10 p-6 md:p-8 bg-[#0c0c0c] rounded-b-none gap-4 flex flex-col sm:flex-row">
              <button
                onClick={handleCopyLink}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 px-4 rounded-full transition active:scale-98 text-[11px] uppercase tracking-wider cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>LİNK KOPYALANDI</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white/60" />
                    <span>LİNKİ KOPYALA</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-white/95 text-black font-extrabold py-3.5 px-4 rounded-full transition active:scale-98 text-[11px] uppercase tracking-wider cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>ARŞİVE İNDİR</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

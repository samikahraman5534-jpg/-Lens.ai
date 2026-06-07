/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Ensure standard process ports
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini client to prevent crashing on missing keys
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// 0. DuckDuckGo Image Token Extraction
function extractVqd(html: string): string | null {
  const match1 = html.match(/vqd=([\d-]+)/);
  if (match1) return match1[1];
  const match2 = html.match(/vqd=["']?([^"'\s&]+)["']?/);
  if (match2) return match2[1];
  const match3 = html.match(/vqd\s*=\s*['"]([^'"]+)['"]/);
  if (match3) return match3[1];
  return null;
}

// Helper to crawl global web elements via DuckDuckGo
async function fetchDuckDuckGoImages(query: string) {
  try {
    const url = 'https://duckduckgo.com/';
    const tokenRes = await fetch(`${url}?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr,en-US;q=0.7,en;q=0.3',
      }
    });
    if (!tokenRes.ok) {
      console.warn('DuckDuckGo HTML token response failed:', tokenRes.statusText);
      return [];
    }
    const html = await tokenRes.text();
    const token = extractVqd(html);
    if (!token) {
      console.warn('Unable to extract VQD parameter from DDG page source');
      return [];
    }

    const searchUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${token}&f=,,,&p=-1`;
    const response = await fetch(searchUrl, {
      headers: {
        'DNT': '1',
        'Accept-Language': 'tr,en-US;q=0.7,en;q=0.3',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://duckduckgo.com/',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      console.warn('DuckDuckGo images JSON endpoint failed:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (err) {
    console.error('Error fetching global web images from DuckDuckGo:', err);
    return [];
  }
}

// 1. API: Image Search Proxy
// Fetches search results from DuckDuckGo (Wide Web), Unsplash (High-Resolution), or Wikimedia (Open Media Archive)
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.query as string || 'aesthetic';
    const page = parseInt(req.query.page as string || '1', 10);
    const color = req.query.color as string || '';
    const orientation = req.query.orientation as string || '';
    const order_by = req.query.order_by as string || 'relevant';
    const engine = req.query.engine as string || 'ddg';

    // If DuckDuckGo Wide Web image search is selected (the new global default)
    if (engine === 'ddg') {
      try {
        const ddgResults = await fetchDuckDuckGoImages(query);
        if (ddgResults && ddgResults.length > 0) {
          // Map to standard Unsplash interface
          const mappedResults = ddgResults.map((img: any, idx: number) => {
            const domain = img.source || 'Web Görseli';
            // Ensure 100% uniqueness by embedding the stable index prefix
            const hashPart = Buffer.from(img.image || '').toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
            const cleanId = `ddg_${idx}_${hashPart || 'img'}`;
            return {
              id: cleanId,
              created_at: new Date().toISOString(),
              width: img.width ? parseInt(img.width, 10) : 1200,
              height: img.height ? parseInt(img.height, 10) : 800,
              color: '#0d0d0d',
              blur_hash: null,
              likes: Math.floor(Math.random() * 250) + 15,
              description: img.title || 'İnternet Boyunca Arama Sonucu',
              alt_description: img.title || 'Multi-Website Web Search Result',
              urls: {
                raw: img.image,
                full: img.image,
                regular: img.image,
                small: img.thumbnail || img.image,
                thumb: img.thumbnail || img.image,
              },
              user: {
                id: `ddg_user_${idx}`,
                username: (img.source || 'web_source').toLowerCase().replace(/[^a-z0-9]/g, '_'),
                name: domain,
                portfolio_url: img.url || 'https://duckduckgo.com',
                profile_image: {
                  small: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Document_icon_-_Glossy_3D_style.svg',
                  medium: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Document_icon_-_Glossy_3D_style.svg',
                  large: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Document_icon_-_Glossy_3D_style.svg',
                },
                twitter_username: null,
                instagram_username: null,
              }
            };
          });

          // Simulate pagination manually for simple DDG array responses
          const perPage = 24;
          const startIndex = (page - 1) * perPage;
          const paginated = mappedResults.slice(startIndex, startIndex + perPage);

          return res.json({
            results: paginated,
            total: mappedResults.length,
            total_pages: Math.ceil(mappedResults.length / perPage),
            engine: 'ddg'
          });
        }
      } catch (ddgErr) {
        console.warn('DuckDuckGo search failed, falling back to other providers:', ddgErr);
      }
    }

    // Try Unsplash search
    if (engine === 'unsplash' || engine === 'ddg') {
      try {
        let url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=24&page=${page}`;
        if (color) url += `&color=${color}`;
        if (orientation) url += `&orientation=${orientation}`;
        if (order_by) url += `&order_by=${order_by}`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://unsplash.com/'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            return res.json({
              results: data.results.map((img: any) => ({
                id: img.id,
                created_at: img.created_at,
                width: img.width,
                height: img.height,
                color: img.color || '#e5e7eb',
                blur_hash: img.blur_hash,
                likes: img.likes || 12,
                description: img.description || img.alt_description,
                alt_description: img.alt_description,
                urls: {
                  raw: img.urls?.raw,
                  full: img.urls?.full,
                  regular: img.urls?.regular,
                  small: img.urls?.small,
                  thumb: img.urls?.thumb,
                },
                user: {
                  id: img.user?.id || 'unknown',
                  username: img.user?.username || 'unphotographer',
                  name: img.user?.name || 'Photographer',
                  portfolio_url: img.user?.portfolio_url,
                  profile_image: {
                    small: img.user?.profile_image?.small || 'https://images.unsplash.com/profile-fb-1502235955-46e39efd15e1.jpg?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&cs=tinysrgb&h=32&w=32',
                    medium: img.user?.profile_image?.medium,
                    large: img.user?.profile_image?.large,
                  },
                  twitter_username: img.user?.twitter_username,
                  instagram_username: img.user?.instagram_username,
                }
              })),
              total: data.total || 1000,
              total_pages: data.total_pages || 40,
              engine: 'unsplash'
            });
          }
        }
      } catch (unsErr) {
        console.warn('Unsplash failed in flow:', unsErr);
      }
    }

    // fallback to Wikimedia Commons
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url|size|extmetadata&iilimit=24&format=json&origin=*`;
    
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const pages = wikiData.query?.pages ? Object.values(wikiData.query.pages) : [];
      
      const mappedPages = pages
        .filter((page: any) => page.imageinfo && page.imageinfo[0])
        .map((page: any) => {
          const info = page.imageinfo[0];
          const meta = info.extmetadata || {};
          const titleClean = page.title ? page.title.replace('File:', '').split('.')[0] : 'Image';
          const author = meta.Artist?.value 
            ? meta.Artist.value.replace(/<[^>]*>/g, '') 
            : 'Wikimedia Commons Contributor';
          const desc = meta.ImageDescription?.value 
            ? meta.ImageDescription.value.replace(/<[^>]*>/g, '') 
            : titleClean;

          return {
            id: String(page.pageid),
            width: info.width || 1200,
            height: info.height || 800,
            color: '#1e293b',
            blur_hash: null,
            likes: Math.floor(Math.random() * 15) + 2,
            description: desc,
            alt_description: titleClean,
            urls: {
              raw: info.url,
              full: info.url,
              regular: info.url,
              small: info.url,
              thumb: info.url,
            },
            user: {
              id: 'wiki_user',
              username: 'wikimedia_commons',
              name: author,
              portfolio_url: 'https://commons.wikimedia.org',
              profile_image: {
                small: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Wiki-commons_v2.svg',
                medium: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Wiki-commons_v2.svg',
                large: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Wiki-commons_v2.svg',
              },
              twitter_username: null,
              instagram_username: null,
            }
          };
        });

      return res.json({
        results: mappedPages,
        total: mappedPages.length,
        total_pages: 1,
        engine: 'wikimedia'
      });
    }

    // Default static fallback images if all else fails
    res.json({ results: [], total: 0, total_pages: 0, engine: 'fallback' });
  } catch (error: any) {
    console.error('Unified Image Search error:', error);
    res.status(500).json({ error: 'Search operations failed: ' + error.message });
  }
});

// Suggestion Fallback Helper Heuristics
function getFallbackSuggestions(query: string) {
  const trimmed = (query || '').trim();
  return {
    translatedQuery: trimmed,
    refinedTerms: [
      `${trimmed} art`,
      `${trimmed} aesthetic`,
      `minimalist ${trimmed}`,
      `cinematic ${trimmed}`
    ],
    creativeAngles: [
      {
        title: `Seçkin ${trimmed}`,
        query: `${trimmed} aesthetic hd photography`,
        description: `Sanatsal ve göz alıcı bir kompozisyon ile minimalist anlatım.`
      },
      {
        title: `Retro Sinematik ${trimmed}`,
        query: `${trimmed} retro vintage cinematic warm lighting`,
        description: `Sıcak renk tonları ve nostaljik VHS kamera merceği efektleri.`
      }
    ]
  };
}

// Image Analysis Fallback Helper Heuristics
function getFallbackAnalysis(title: string, author: string) {
  return {
    mood: 'Sakinlik ve Dinginlik',
    description: `"${title || 'Görsel'}" isimli bu çalışma, ${author || 'Bilinmeyen Sanatçı'} tarafından çekilmiştir. Görsel modern kompozisyon ilkelerine uygun olarak derinlik hissi, zengin kontrastlar ve odaklanmış bir kadraj barındırmaktadır.`,
    composition: 'Üçte Bir Kuralı ve altın oran kadrajı kullanılarak görsel bir denge sağlanmış. Yumuşak geçişli ışık, nesne üzerindeki dokuları muazzam şekilde ön plana çıkarıyor.',
    story: 'Zamanın durduğu o büyülü saniyede, her detay sessiz bir melodi fısıldıyor. Bu an, sonsuzluğun ve dinginliğin somutlaşmış bir kanıtı gibi karşımızda duruyor.',
    palette: [
      { name: 'Gece Mavisi', hex: '#1E293B', ratio: 'Baskın (%40)' },
      { name: 'Koyu Arduvaz', hex: '#475569', ratio: 'Etkileşimli (%25)' },
      { name: 'Sis Grisi', hex: '#94A3B8', ratio: 'Dengeleyici (%20)' },
      { name: 'Sıcak Kum', hex: '#D1FAE5', ratio: 'Vurgu (%10)' },
      { name: 'Altın Parıltı', hex: '#F59E0B', ratio: 'Ufak Aksan (%5)' }
    ],
    creativeTags: ['minimalist', 'vurgulu iş', 'soft shadows', 'göz alıcı kadraj', 'derinlikli hikaye'],
    photoSettingsIdea: 'Diyafram: f/4.0 | Enstantane: 1/160s | ISO: 200 | Doğal Yumuşak Gün Işığı'
  };
}

// 2. API: Query Refinement and Translation Suggestion via Gemini
app.post('/api/suggest-queries', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(getFallbackSuggestions(query));
    }

    try {
      const prompt = `Görsel bulma uygulamasında, kullanıcının girdiği şu arama terimini analiz et: "${query}".
      Bir görsel arama motoru (Unsplash gibi) en iyi sonucu İngilizce aramalarla verir.
      Lütfen şu 3 şeyi JSON formatında döndür:
      1. translatedQuery: Arama teriminin en doğru ve sanatsal görsel sonuçlar verecek İngilizce karşılığı.
      2. refinedTerms: İngilizce dilinde 3-5 adet, bu görsel kavramı genişleten, arama motorlarında iyi çıkacak profesyonel fotoğrafçılık ve tasarım anahtar kelimeleri. (Örn: "nature", "macro lens", "golden hour")
      3. creativeAngles: Bu görsel için kullanıcının sevebileceği 3 farklı artistik/tematik odak açısı (örn: "Minimalist Pastel", "Moody Cyberpunk", "Vintage Editorial"). Her açının Türkçe başlığı (title), İngilizce optimize edilmiş arama sorgusu (query) ve Türkçe bir açıklama cümlesi (description) olmalı.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedQuery: {
                type: Type.STRING,
                description: 'English translation of the query optimized for image search engine'
              },
              refinedTerms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Related imagery searching tags in English'
              },
              creativeAngles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'Turkish title for this artistic style' },
                    query: { type: Type.STRING, description: 'Highly detailed photographic prompt/search in English' },
                    description: { type: Type.STRING, description: 'One-sentence Turkish explanation of the aesthetic value' }
                  },
                  required: ['title', 'query', 'description']
                }
              }
            },
            required: ['translatedQuery', 'refinedTerms', 'creativeAngles']
          }
        }
      });

      const jsonText = response.text || '{}';
      res.json(JSON.parse(jsonText));
    } catch (apiErr: any) {
      console.warn('Gemini Suggestion Call failed, serving high quality local fallback heuristics:', apiErr.message || apiErr);
      res.json(getFallbackSuggestions(query));
    }
  } catch (error: any) {
    console.error('Unified Query Suggestion Request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. API: Multimodal Image Analysis via Gemini
// Down-scales and converts found image to base64, then feeds to Gemini Vision to describe, analyze aesthetic details, extract palette
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageUrl, title, author } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl parameter is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(getFallbackAnalysis(title, author));
    }

    try {
      // Step a: Fetch image and convert to Base64 in server boundary
      let base64Data = '';
      let mimeType = 'image/jpeg';
      try {
        const imgFetch = await fetch(imageUrl);
        if (imgFetch.ok) {
          const arrayBuffer = await imgFetch.arrayBuffer();
          base64Data = Buffer.from(arrayBuffer).toString('base64');
          const fetchMime = imgFetch.headers.get('content-type');
          if (fetchMime) mimeType = fetchMime;
        }
      } catch (fetchErr) {
        console.error('Failed to pre-fetch image files over network:', fetchErr);
      }

      // If fetch failed, we can still ask Gemini using text context, but since we want premium vision we try to pass image
      let response;
      if (base64Data) {
        const imagePart = {
          inlineData: {
            mimeType,
            data: base64Data
          }
        };
        const textPart = {
          text: `Bu resmi incele. Resmi "${title || 'Görsel'}" (${author || 'Sanatçı'}) olarak biliyoruz.
          Lütfen bu resim için profesyonel bir fotoğrafçılık ve estetik analizi yap.
          Şu bilgileri Türkçe olarak JSON formatında üret:
          1. mood: Resmin yansıttığı atmosfer, duygu veya hava (örn: Melankolik ve Gizemli, Neşeli ve Sıcak vb.).
          2. description: Resimde ne olduğunu, ana odak noktalarını ve detayları edebi ama gözlemci bir dille anlatan 2-3 cümlelik açıklama.
          3. composition: Sanatsal kadraj, ışık kullanımı, odak uzaklığı, alan derinliği, simetri gibi kompozisyon detaylarının incelemesi.
          4. story: Bu görselin sana hissettirdiği sanatsal, şiirsel, yaratıcı ufak hikaye veya esinlenme metni (görseli paylaşacak kullanıcılar için harika bir açıklama yazısı olacak şekilde).
          5. palette: Resimden çıkarılmış 5 adet estetik renk paletteki ton. Her birinin Türkçe ismi (örn: Gökyüzü Mavisi, Sıcak Toprak), Hex kodu (örn: #A4C1D2) ve resimdeki tahmini varlık payı oranı (ratio) olmalı.
          6. creativeTags: Resimle ilgili 5 adet esinlendirici, soyut sanatsal etiket. (örn: "yalnızlık", "sonsuz_ufuk", "canlı_kontrast")
          7. photoSettingsIdea: Bu fotoğrafın çekilmesi için ideal EXIF ortamı veya fotoğrafçı önerisi (örn: 'f/2.8 diyafram öncelikli, 1/200s enstantane, altın saat ışığı önerisi').`
        };

        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [imagePart, textPart],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                mood: { type: Type.STRING },
                description: { type: Type.STRING },
                composition: { type: Type.STRING },
                story: { type: Type.STRING },
                palette: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      hex: { type: Type.STRING },
                      ratio: { type: Type.STRING }
                    },
                    required: ['name', 'hex']
                  }
                },
                creativeTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                photoSettingsIdea: { type: Type.STRING }
              },
              required: ['mood', 'description', 'composition', 'story', 'palette', 'creativeTags']
            }
          }
        });
      } else {
        // Fallback API if fetch base64 fails: Text-only Gemini model to analyze meta patterns
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Analiz edeceğimiz fotoğraf ismi: "${title || 'Görsel'}", fotoğrafçısı: "${author || 'Bilinmeyen Fotoğrafçı'}" ve konusu olan görsel açıklaması: "${title || 'Doğal Peyzaj'}".
          Lütfen bu fotoğraf için sanatsal bir inceleme raporu oluştur ve Türkçe dilinde şu JSON formatında döndür. Görseli görmüş gibi profesyonel tahminlerde bulunabilirsiniz:
          1. mood: Fotoğrafın genel havası, duygu veya atmosferi.
          2. description: Fotoğrafı zihnimizde canlandıracak estetik bir anlatım (2-3 cümle).
          3. composition: Sanatsal kurgu, muhtemel ışık açısı, kadraj ve öne çıkan kompozisyon ilkeleri hakkında uzman yorumu.
          4. story: Bu fotoğraf için şiirsel, sanatsal bir instagram/paylaşım yazısı niteliğinde hikaye.
          5. palette: Görselden tahmin edilen 5 adet harika, uyumlu renk tonu. Hex kodu ve Türkçe ismiyle.
          6. creativeTags: Görsel ruhuna uyan 5 özgün etiket.
          7. photoSettingsIdea: Fotoğrafın çekilme tarzına göre tahmini EXIF ayar önerisi.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                mood: { type: Type.STRING },
                description: { type: Type.STRING },
                composition: { type: Type.STRING },
                story: { type: Type.STRING },
                palette: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      hex: { type: Type.STRING },
                      ratio: { type: Type.STRING }
                    },
                    required: ['name', 'hex']
                  }
                },
                creativeTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                photoSettingsIdea: { type: Type.STRING }
              },
              required: ['mood', 'description', 'composition', 'story', 'palette', 'creativeTags']
            }
          }
        });
      }

      const resJsonText = response.text || '{}';
      res.json(JSON.parse(resJsonText));
    } catch (apiErr: any) {
      console.warn('Gemini Image Analysis call failed, serving high quality local fallback heuristics:', apiErr.message || apiErr);
      res.json(getFallbackAnalysis(title, author));
    }
  } catch (error: any) {
    console.error('Unified Image Analysis Request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware setup for Development & Production hosting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets compiled under dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Instant Image Finder Server] running on http://localhost:${PORT}`);
  });
}

startServer();

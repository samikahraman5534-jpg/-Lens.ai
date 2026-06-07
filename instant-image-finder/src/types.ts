/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UnsplashImageUser {
  id: string;
  username: string;
  name: string;
  portfolio_url: string | null;
  profile_image: {
    small: string;
    medium: string;
    large: string;
  };
  twitter_username: string | null;
  instagram_username: string | null;
}

export interface UnsplashImage {
  id: string;
  created_at?: string;
  width: number;
  height: number;
  color: string;
  blur_hash: string | null;
  likes: number;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: UnsplashImageUser;
}

export interface SearchFilters {
  query: string;
  color?: string; // 'black_and_white', 'black', 'white', 'yellow', 'orange', 'red', 'purple', 'magenta', 'green', 'teal', 'blue'
  orientation?: 'landscape' | 'portrait' | 'squarish' | '';
  order_by?: 'relevant' | 'latest';
  page: number;
  engine?: 'ddg' | 'unsplash' | 'wikimedia';
}

export interface ImageAnalysis {
  mood: string;
  description: string;
  composition: string;
  story: string;
  palette: Array<{
    name: string;
    hex: string;
    ratio?: string;
  }>;
  creativeTags: string[];
  photoSettingsIdea?: string;
}

export interface QuerySuggestions {
  translatedQuery: string;
  refinedTerms: string[];
  creativeAngles: Array<{
    title: string;
    query: string;
    description: string;
  }>;
}

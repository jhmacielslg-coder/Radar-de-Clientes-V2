import { Company, SellerProfile, ScoringWeights, GroundingSource, NicheComparisonResult } from '../types';
import { storageService } from './storageService';

const API_KEY_STORAGE_KEY = 'radar_gemini_api_key';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  } catch (err) {
    console.error('Erro ao salvar API key:', err);
  }
}

export function removeStoredApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (err) {
    console.error('Erro ao remover API key:', err);
  }
}

export interface SearchResponse {
  companies: Company[];
  sources: GroundingSource[];
  totalFound: number;
  searchedQuery: string;
}

export const apiService = {
  async searchBusinesses(
    region: string,
    niche: string,
    keyword?: string,
    targetService?: string
  ): Promise<SearchResponse> {
    storageService.incrementOperationsCount();
    const apiKey = getStoredApiKey();
    const res = await fetch('/api/search-businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region, niche, keyword, targetService, apiKey }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Erro do servidor (${res.status}) ao pesquisar empresas.`);
    }

    return await res.json();
  },

  async analyzeBusiness(
    company: Company,
    weights?: ScoringWeights
  ): Promise<{
    analysis: any;
    opportunityScore: number;
    scoreConfidence: 'baixo' | 'medio' | 'alto';
    scoreDetails: any;
  }> {
    storageService.incrementOperationsCount();
    const apiKey = getStoredApiKey();
    const res = await fetch('/api/analyze-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, weights, apiKey }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Erro do servidor (${res.status}) ao analisar o negócio.`);
    }

    return await res.json();
  },

  async generateOutreach(
    company: Company,
    sellerProfile: SellerProfile,
    analysis?: any,
    tone?: string
  ): Promise<{ outreachDrafts: any }> {
    storageService.incrementOperationsCount();
    const apiKey = getStoredApiKey();
    const res = await fetch('/api/generate-outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, sellerProfile, analysis, tone, apiKey }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Erro do servidor (${res.status}) ao gerar roteiros de contato.`);
    }

    return await res.json();
  },

  async compareNiches(
    region: string,
    nichesStats: any[]
  ): Promise<NicheComparisonResult> {
    storageService.incrementOperationsCount();
    const apiKey = getStoredApiKey();
    const res = await fetch('/api/compare-niches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region, nichesStats, apiKey }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Erro do servidor (${res.status}) ao diagnosticar nichos.`);
    }

    return await res.json();
  },
};

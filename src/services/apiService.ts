import { Company, SellerProfile, ScoringWeights, GroundingSource, NicheComparisonResult } from '../types';
import { storageService } from './storageService';

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
    const res = await fetch('/api/search-businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region, niche, keyword, targetService }),
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
    const res = await fetch('/api/analyze-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, weights }),
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
    const res = await fetch('/api/generate-outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, sellerProfile, analysis, tone }),
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
    const res = await fetch('/api/compare-niches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region, nichesStats }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Erro do servidor (${res.status}) ao diagnosticar nichos.`);
    }

    return await res.json();
  },
};

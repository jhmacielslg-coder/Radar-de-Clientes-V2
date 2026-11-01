export type LeadStatus =
  | 'novo'
  | 'analisado'
  | 'contatado'
  | 'respondeu'
  | 'reuniao'
  | 'cliente'
  | 'descartado';

export type WebsiteStatus =
  | 'proprio'
  | 'sem_site'
  | 'apenas_redes'
  | 'nao_verificado';

export type ScoreConfidence = 'baixo' | 'medio' | 'alto';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ScoreBreakdown {
  noOwnWebsiteScore: number;
  missingCommercialInfoScore: number;
  contactDifficultyScore: number;
  noBookingOrOrderScore: number;
  digitalPresentationScore: number;
  activeBusinessBonus: number;
  total: number;
  missingData: string[];
  justification: Record<string, string>;
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: 'identificado' | 'nao_identificado' | 'nao_verificado' | 'nao_aplicavel';
  details?: string;
}

export interface CompanyAnalysis {
  summary: string;
  targetAudience: string;
  isAudienceInference: boolean;
  checklist: ChecklistItem[];
  uxIssues: string[];
  commercialIssues: string[];
  opportunities: string[];
  recommendedService: string;
  recommendationJustification: string;
  suggestedNextStep: string;
  analyzedAt: string;
}

export interface OutreachDrafts {
  phoneScript: string;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
  generatedAt: string;
  tone: 'direto' | 'consultivo' | 'amigavel';
  usedFormats: {
    phone: boolean;
    whatsapp: boolean;
    email: boolean;
  };
}

export interface ContactLogEntry {
  id: string;
  date: string;
  channel: 'telefone' | 'whatsapp' | 'email' | 'presencial' | 'outro';
  notes: string;
}

export interface Company {
  id: string;
  name: string;
  segment: string;
  city: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  socialUrl?: string | null;
  sourceUrl?: string | null;
  hasOwnWebsite: boolean;
  websiteStatus: WebsiteStatus;
  opportunityScore: number;
  scoreConfidence: ScoreConfidence;
  scoreDetails?: ScoreBreakdown;
  status: LeadStatus;
  notes?: string;
  contactHistory: ContactLogEntry[];
  nextActionDate?: string | null;
  nextActionDescription?: string | null;
  lastAnalysisDate?: string | null;
  analysis?: CompanyAnalysis;
  outreachDrafts?: OutreachDrafts;
  targetService?: string;
  createdAt: string;
  updatedAt: string;
  isDemoData?: boolean; // Tagged clearly if generated as initial sample
}

export interface SellerProfile {
  name: string;
  city: string;
  servicesOffered: string[];
  differentials: string;
  experienceYears: number;
  preferredTone: 'direto' | 'consultivo' | 'amigavel';
  priceRange?: string;
  preferredCta: string;
}

export interface ScoringWeights {
  noOwnWebsite: number;        // Default: 30
  missingCommercialInfo: number; // Default: 15
  contactDifficulty: number;     // Default: 15
  noBookingOrOrder: number;      // Default: 15
  digitalPresentation: number;   // Default: 15
  activeBusinessBonus: number;   // Default: 10
}

export interface NicheStats {
  niche: string;
  totalFound: number;
  withoutWebsite: number;
  withPhone: number;
  withSocialOnly: number;
  avgOpportunityScore: number;
}

export interface TopNicheRecommendation {
  niche: string;
  priorityRank: number;
  whyInteresting: string;
  recommendedService: string;
  painPointToAddress: string;
  howToStart: string;
}

export interface NicheComparisonResult {
  topNiches: TopNicheRecommendation[];
  strategicSummary: string;
  analyzedAt: string;
}

export interface AppSettings {
  sellerProfile: SellerProfile;
  weights: ScoringWeights;
  defaultRegion: string;
  favoriteNiches: string[];
  customNiches: string[];
  operationsCount: number;
}

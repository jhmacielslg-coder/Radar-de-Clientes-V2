import { GoogleGenAI } from '@google/genai';

export function createAiClient(clientApiKey?: string): GoogleGenAI {
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function resolveApiKey(bodyApiKey?: string): string {
  return bodyApiKey || process.env.GEMINI_API_KEY || '';
}

export function classifyWebsiteUrl(url?: string): {
  hasOwnWebsite: boolean;
  websiteStatus: 'proprio' | 'sem_site' | 'apenas_redes' | 'nao_verificado';
} {
  if (
    !url ||
    url.trim() === '' ||
    url.toLowerCase() === 'sem site' ||
    url.toLowerCase() === 'não encontrado'
  ) {
    return { hasOwnWebsite: false, websiteStatus: 'sem_site' };
  }
  const cleanUrl = url.toLowerCase().trim();
  const socialOrDirectories = [
    'instagram.com',
    'facebook.com',
    'fb.com',
    'linktr.ee',
    'linktree.com',
    'wa.me',
    'whatsapp.com',
    'guiamais.com.br',
    'telelistas.net',
    'apontador.com.br',
    'ifood.com.br',
    'maps.google.com',
    'google.com/maps',
    'yelp.com',
    'linkedin.com',
    'tiktok.com',
    'bio.site',
    'beacons.ai',
  ];

  const isSocialOrDir = socialOrDirectories.some((domain) =>
    cleanUrl.includes(domain)
  );
  if (isSocialOrDir) {
    return { hasOwnWebsite: false, websiteStatus: 'apenas_redes' };
  }

  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.includes('.com') ||
    cleanUrl.includes('.com.br')
  ) {
    return { hasOwnWebsite: true, websiteStatus: 'proprio' };
  }

  return { hasOwnWebsite: false, websiteStatus: 'nao_verificado' };
}

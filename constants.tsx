
import { CollectionData } from './types';

// Ambiente de Produção: Marketplace inicia vazio.
// Apenas anúncios criados via formulário por usuários autenticados serão exibidos.
export const MOCK_COLLECTIONS: CollectionData[] = [];

export const MATERIAL_COLORS: Record<string, string> = {
  'Papel': '#4A90E2',
  'Plástico': '#F5A623',
  'Vidro': '#7ED321',
  'Metal': '#BD10E0',
  'Orgânico': '#8B572A',
  'Eletrônicos': '#10b981',
  'Outros': '#94a3b8'
};

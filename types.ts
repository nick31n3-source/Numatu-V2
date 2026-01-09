
export type UserRole = 'ADMIN' | 'ADVERTISER' | 'COLLECTOR';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  nome_publico?: string;
  bio?: string;
  role: UserRole;
  gender?: 'M' | 'F' | 'O';
  isProfileComplete: boolean;
  isActive: boolean;
  foto_perfil_url?: string;
  
  email_verificado: boolean;
  telefone_verificado: boolean;
  cpf_verificado: boolean;
  cnpj_verificado?: boolean;
  endereco_verificado: boolean;
  face_verified: boolean;
  
  telefone?: string;
  cpf?: string; 
  cnpj?: string;
  password?: string;

  tipo_empresa?: 'PEQUENA' | 'MEDIA' | 'GRANDE';
  veiculo_tipo?: 'BICICLETA' | 'CARROCA' | 'CARRO' | 'CAMINHAO';
  
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;

  last_lat?: number;
  last_lng?: number;
  last_update?: string;
}

export type CollectionStatus = 
  | 'RASCUNHO'
  | 'ANUNCIADA' 
  | 'AGENDADA'
  | 'ACEITA' 
  | 'EM_ROTA' 
  | 'EM_COLETA' 
  | 'CONCLUIDA' 
  | 'CANCELADA';

export type MaterialType = 'Papel' | 'Plástico' | 'Vidro' | 'Metal' | 'Orgânico' | 'Eletrônicos' | 'Outros';

export interface CollectionData {
  id: string;
  id_anunciante: string;
  id_coletor?: string;
  status: CollectionStatus;
  material: MaterialType;
  title?: string;
  description?: string;
  weight: number;
  weight_final?: number;
  price_suggested?: number;
  price_final?: number;
  neighborhood: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  companyName: string;
  companyAvatar: string;
  foto_item_url?: string; // Capa principal
  foto_item_urls?: string[]; // Galeria
  codigo_confirmacao?: string;
  collectorName?: string;
  ts_solicitada: string;
  ts_agendada?: string;
  ts_aceita?: string;
  ts_concluida?: string;
  prioridade: 'Baixa' | 'Média' | 'Alta';
  notes?: string;
  isArchived?: boolean;
}

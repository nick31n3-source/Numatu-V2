
export type UserRole = 'ADMIN' | 'ADVERTISER' | 'COLLECTOR';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  nome_publico?: string;
  bio?: string;
  role: UserRole;
  isProfileComplete: boolean;
  isActive: boolean;
  foto_perfil_url?: string;
  
  // Flags de Verificação
  email_verificado: boolean;
  telefone_verificado: boolean;
  cpf_verificado: boolean;
  cnpj_verificado?: boolean;
  endereco_verificado: boolean;
  face_verified: boolean;
  
  // Dados de Identidade
  telefone?: string;
  cpf?: string; 
  cnpj?: string;
  password?: string;

  // Atributos Específicos
  tipo_empresa?: 'PEQUENA' | 'MEDIA' | 'GRANDE';
  veiculo_tipo?: 'BICICLETA' | 'CARROCA' | 'CARRO' | 'CAMINHAO';
  
  // Endereço
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
  | 'ANUNCIADA' 
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
  description?: string;
  weight: number;
  weight_final?: number;
  neighborhood: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  companyName: string;
  companyAvatar: string;
  foto_item_url?: string;
  codigo_confirmacao?: string;
  collectorName?: string;
  ts_solicitada: string;
  ts_aceita?: string;
  ts_em_rota?: string;
  ts_concluida?: string;
  ts_cancelada?: string;
  ts_expiracao?: string;
  prioridade: 'Baixa' | 'Média' | 'Alta';
  notes?: string;
  isArchived?: boolean;
}

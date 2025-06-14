import { createClient } from '@supabase/supabase-js';

// Définir les types pour la base de données
type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nom: string;
          email: string;
          role: 'etudiant' | 'chef_dept' | 'directeur_prog' | 'dae' | 'secretaire_dg' | 'dg';
          departement_id: string | null;
          created_at: string;
        }
        Insert: {
          id?: string;
          nom: string;
          email: string;
          role: 'etudiant' | 'chef_dept' | 'directeur_prog' | 'dae' | 'secretaire_dg' | 'dg';
          departement_id?: string | null;
          created_at?: string;
        }
        Update: {
          nom?: string;
          email?: string;
          role?: 'etudiant' | 'chef_dept' | 'directeur_prog' | 'dae' | 'secretaire_dg' | 'dg';
          departement_id?: string | null;
        }
      }
      departements: {
        Row: {
          id: string;
          nom: string;
        }
        Insert: {
          id?: string;
          nom: string;
        }
        Update: {
          nom?: string;
        }
      }
      demandes: {
        Row: {
          id: string;
          titre: string;
          description: string | null;
          etudiant_id: string;
          statut: 'en_attente' | 'en_traitement' | 'validee' | 'rejetee';
          date_soumission: string;
          date_mise_a_jour: string;
        }
        Insert: {
          id?: string;
          titre: string;
          description?: string | null;
          etudiant_id: string;
          statut?: 'en_attente' | 'en_traitement' | 'validee' | 'rejetee';
          date_soumission?: string;
          date_mise_a_jour?: string;
        }
        Update: {
          titre?: string;
          description?: string | null;
          statut?: 'en_attente' | 'en_traitement' | 'validee' | 'rejetee';
          date_mise_a_jour?: string;
        }
      }
      pieces_jointes: {
        Row: {
          id: string;
          demande_id: string;
          nom_fichier: string;
          url: string;
          created_at: string;
        }
        Insert: {
          id?: string;
          demande_id: string;
          nom_fichier: string;
          url: string;
          created_at?: string;
        }
        Update: {
          nom_fichier?: string;
          url?: string;
        }
      }
      validations: {
        Row: {
          id: string;
          demande_id: string;
          user_id: string;
          role: 'chef_dept' | 'directeur_prog' | 'dae' | 'secretaire_dg' | 'dg';
          decision: 'valide' | 'rejete';
          motif: string | null;
          date_validation: string;
        }
        Insert: {
          id?: string;
          demande_id: string;
          user_id: string;
          role: 'chef_dept' | 'directeur_prog' | 'dae' | 'secretaire_dg' | 'dg';
          decision: 'valide' | 'rejete';
          motif?: string | null;
          date_validation?: string;
        }
        Update: {
          decision?: 'valide' | 'rejete';
          motif?: string | null;
        }
      }
      signatures: {
        Row: {
          id: string;
          user_id: string;
          type: 'image' | 'pdf' | 'texte';
          url: string;
          created_at: string;
        }
        Insert: {
          id?: string;
          user_id: string;
          type: 'image' | 'pdf' | 'texte';
          url: string;
          created_at?: string;
        }
        Update: {
          type?: 'image' | 'pdf' | 'texte';
          url?: string;
        }
      }
      notifications: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          lu: boolean;
          created_at: string;
        }
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          lu?: boolean;
          created_at?: string;
        }
        Update: {
          message?: string;
          lu?: boolean;
        }
      }
      logs_suivi: {
        Row: {
          id: string;
          demande_id: string | null;
          etat: 'en_attente' | 'en_traitement' | 'validee' | 'rejetee';
          user_id: string;
          message: string | null;
          date_action: string;
        }
        Insert: {
          id?: string;
          demande_id?: string | null;
          etat: 'en_attente' | 'en_traitement' | 'validee' | 'rejetee' | 'inscription' | 'connexion';
          user_id: string;
          message?: string | null;
          date_action?: string;
        }
        Update: {
          etat?: 'en_attente' | 'en_traitement' | 'validee' | 'rejetee';
          message?: string | null;
        }
      }
    }
  }
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types utilitaires
export type User = Database['public']['Tables']['users']['Row'];
export type Demande = Database['public']['Tables']['demandes']['Row'];
export type Departement = Database['public']['Tables']['departements']['Row'];

// Fonctions utilitaires
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Gestion des documents
export const DOCUMENTS_BUCKET = 'request-documents';

export const uploadDocument = async (file: File, requestId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${requestId}-${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(DOCUMENTS_BUCKET)
    .getPublicUrl(data.path);

  return publicUrl;
};

// Récupérer les demandes d'un étudiant
export const fetchStudentRequests = async (studentId: string) => {
  const { data, error } = await supabase
    .from('demandes')
    .select('*')
    .eq('etudiant_id', studentId)
    .order('date_soumission', { ascending: false });

  if (error) throw error;
  return data;
};

// Mettre à jour le statut d'une demande
export const updateRequestStatus = async (
  requestId: string,
  statut: 'en_attente' | 'en_traitement' | 'validee' | 'rejetee',
  userId: string
) => {
  const updateData = {
    statut,
    date_mise_a_jour: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('demandes')
    .update(updateData)
    .eq('id', requestId)
    .select();

  if (error) throw error;

  // Insérer un log
  await supabase.from('logs_suivi').insert({
    demande_id: requestId,
    etat: statut,
    user_id: userId,
    message: `Statut mis à jour : ${statut}`,
  });

  return data[0];
};
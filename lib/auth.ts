import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Type pour les utilisateurs
export type User = {
  id: string;
  nom: string;
  email: string;
  role: 'etudiant' | 'chef_dept' | 'directeur_prog' | 'dae' | 'secretaire_dg' | 'dg';
  departement_id: string | null;
  created_at: string;
};

// Schéma de validation pour l'inscription
export const signUpSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().trim().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  name: z.string().trim().min(1, "Le nom est requis"),
  role: z.enum(['etudiant', 'chef_dept', 'directeur_prog', 'dae', 'secretaire_dg', 'dg']),
  department: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return ['NTIC', 'DL'].includes(val);
    },
    { message: "Département invalide" }
  ),
}).superRefine(({ role, department }, ctx) => {
  if (['etudiant', 'chef_dept', 'directeur_prog'].includes(role) && !department) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le département est requis pour ce rôle",
      path: ['department'],
    });
  }
  if (['dae', 'secretaire_dg', 'dg'].includes(role) && department) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le département n'est pas requis pour ce rôle",
      path: ['department'],
    });
  }
});

// Schéma de validation pour la connexion
export const signInSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().trim().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(['etudiant', 'chef_dept', 'directeur_prog', 'dae', 'secretaire_dg', 'dg']),
  department: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return ['NTIC', 'DL'].includes(val);
    },
    { message: "Département invalide" }
  ),
}).superRefine(({ role, department }, ctx) => {
  if (['etudiant', 'chef_dept', 'directeur_prog'].includes(role) && !department) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le département est requis pour ce rôle",
      path: ['department'],
    });
  }
  if (['dae', 'secretaire_dg', 'dg'].includes(role) && department) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le département n'est pas requis pour ce rôle",
      path: ['department'],
    });
  }
});

// Fonction d'inscription
export async function signUp(data: z.infer<typeof signUpSchema>): Promise<User> {
  const { email, password, name, role, department } = data;

  console.log('Tentative d\'inscription:', { email, name, role, department });

  // Vérifier si l'email existe déjà
  const { data: existingUser, error: emailCheckError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (emailCheckError && emailCheckError.code !== 'PGRST116') {
    console.error('Erreur vérification email:', emailCheckError.message);
    throw new Error(`Erreur lors de la vérification de l'email: ${emailCheckError.message}`);
  }
  if (existingUser) {
    throw new Error("Cet email est déjà utilisé.");
  }

  // Vérifier l'unicité des rôles d'autorité
  if (['chef_dept', 'directeur_prog', 'dae', 'secretaire_dg', 'dg'].includes(role)) {
    const { data: existingRole, error: roleError } = await supabase
      .from('users')
      .select('id')
      .eq('role', role)
      .single();

    if (roleError && roleError.code !== 'PGRST116') {
      console.error('Erreur vérification rôle:', roleError.message);
      throw new Error(`Erreur lors de la vérification du rôle: ${roleError.message}`);
    }
    if (existingRole) {
      throw new Error(`Le rôle ${role} est déjà attribué. Contactez l'administrateur.`);
    }
  }

  // Récupérer departement_id
  let departement_id: string | null = null;
  if (department) {
    const { data: deptData, error: deptError } = await supabase
      .from('departements')
      .select('id')
      .eq('nom', department)
      .single();

    if (deptError || !deptData) {
      console.error('Erreur récupération département:', deptError?.message || 'Aucun département trouvé');
      throw new Error(`Département ${department} non trouvé`);
    }
    departement_id = deptData.id;
  }

  // Inscription dans auth.users
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nom: name, role },
    },
  });

  if (authError) {
    console.error('Erreur inscription auth:', authError.message);
    throw new Error(`Échec de l'inscription: ${authError.message}`);
  }

  if (!authData.user) {
    console.error('Aucun utilisateur créé dans auth.users');
    throw new Error("Échec de la création de l'utilisateur");
  }

  // Insérer dans public.users
  const userInsertData = {
    id: authData.user.id,
    email,
    nom: name,
    role,
    departement_id,
    created_at: new Date().toISOString(),
  };

  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert(userInsertData)
    .select()
    .single();

  if (userError) {
    console.error('Erreur insertion utilisateur:', userError.message, userError);
    // Supprimer l'utilisateur de auth.users
    try {
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log('Utilisateur auth supprimé:', authData.user.id);
    } catch (deleteError) {
      console.error('Erreur suppression utilisateur auth:', (deleteError as any).message);
    }
    throw new Error(`Échec de l'insertion dans users: ${userError.message}`);
  }

  // Insérer un log
  const { error: logError } = await supabase.from('logs_suivi').insert({
    demande_id: null,
    etat: 'inscription',
    user_id: authData.user.id,
    message: `Inscription réussie pour ${name} (${role})`,
  });

  if (logError) {
    console.error('Erreur insertion log:', logError.message);
  }

  return userData;
}

// Fonction de connexion
export async function signIn(data: z.infer<typeof signInSchema>): Promise<User> {
  const { email, password, role, department } = data;

  console.log('Tentative connexion:', { email, role, department });

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('Erreur connexion:', authError.message);
    throw new Error(authError.message || "Échec de la connexion");
  }

  if (!authData.user) {
    console.error('Aucun utilisateur retourné');
    throw new Error("Utilisateur non trouvé");
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*, departements(nom)')
    .eq('id', authData.user.id)
    .single();

  if (userError || !userData) {
    console.error('Erreur récupération utilisateur:', userError?.message);
    throw new Error("Utilisateur non trouvé dans la base de données");
  }

  if (userData.role !== role) {
    throw new Error(`Rôle incorrect. Attendu: ${role}, Trouvé: ${userData.role}`);
  }

  if (['etudiant', 'chef_dept', 'directeur_prog'].includes(userData.role)) {
    if (!department) {
      throw new Error("Le département est requis pour ce rôle");
    }
    const { data: deptData, error: deptError } = await supabase
      .from('departements')
      .select('id')
      .eq('nom', department)
      .single();
    if (deptError || !deptData) {
      throw new Error(`Département ${department} non trouvé`);
    }
    if (deptData.id !== userData.departement_id) {
      throw new Error("Département incorrect pour cet utilisateur");
    }
  }

  const { error: logError } = await supabase.from('logs_suivi').insert({
    demande_id: null,
    etat: 'connexion',
    user_id: authData.user.id,
    message: `Connexion réussie pour ${userData.nom} (${role})`,
  });

  if (logError) {
    console.error('Erreur insertion log:', logError.message);
  }

  return userData;
}

// Fonction de déconnexion
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erreur déconnexion:', error.message);
    throw error;
  }
}

// Récupérer l'utilisateur actuel
export async function getCurrentUser(): Promise<User | null> {
  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError || !user.user) {
    console.error('Erreur récupération utilisateur auth:', userError?.message);
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.user.id)
    .single();

  if (error) {
    console.error('Erreur récupération utilisateur:', error.message);
    return null;
  }
  return data;
}
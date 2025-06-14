"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Camera,
  Key,
  Loader2,
  LogOut,
  Mail,
  Save,
  Trash,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Form schemas
const profileFormSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
});

const passwordFormSchema = z.object({
  current_password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  new_password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_password"],
});

interface Profile {
  id: string;
  nom: string;
  email: string;
  avatar_url: string | null;
  departement_id: string | null;
  role: string;
}

export default function ProcessorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [department, setDepartment] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Initialize forms
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nom: "",
      email: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      setProfile(data);
      profileForm.reset({
        nom: data.nom || "",
        email: data.email || "",
      });

      // Fetch department name if departement_id exists
      if (data.departement_id) {
        const { data: deptData, error: deptError } = await supabase
          .from("departements")
          .select("nom")
          .eq("id", data.departement_id)
          .single();

        if (!deptError && deptData) {
          setDepartment(deptData.nom);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      if (!profile) return;

      const { error } = await supabase
        .from("users")
        .update({
          nom: values.nom,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour",
      });

      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil",
        variant: "destructive",
      });
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.new_password,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre mot de passe a été mis à jour",
      });

      passwordForm.reset();
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre mot de passe",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || !event.target.files[0]) return;
      if (!profile) return;

      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: "Votre photo de profil a été mise à jour",
      });

      fetchProfile();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre photo de profil",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Erreur",
        description: "Impossible de vous déconnecter",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pt-24 pb-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <p>Profil non trouvé</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mon profil</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos informations personnelles
            </p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir vous déconnecter ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous devrez vous reconnecter pour accéder à votre compte.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  Se déconnecter
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Photo de profil</CardTitle>
                <CardDescription>
                  Cette photo sera visible par les autres utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profile.avatar_url || ""} />
                    <AvatarFallback className="text-2xl">
                      {profile.nom.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      Changer
                    </Button>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    
                    {profile.avatar_url && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from("users")
                              .update({ avatar_url: null })
                              .eq("id", profile.id);

                            if (error) throw error;

                            toast({
                              title: "Succès",
                              description: "Votre photo de profil a été supprimée",
                            });

                            fetchProfile();
                          } catch (error) {
                            console.error("Error removing avatar:", error);
                            toast({
                              title: "Erreur",
                              description: "Impossible de supprimer votre photo de profil",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {department && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Département</p>
                    <p className="text-sm text-muted-foreground">{department}</p>
                  </div>
                )}
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Rôle</p>
                  <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
                </div>
              </CardContent>
            </Card>

            {/* Main content */}
            <div className="md:col-span-2">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" />
                    Informations
                  </TabsTrigger>
                  <TabsTrigger value="security" className="gap-2">
                    <Key className="h-4 w-4" />
                    Sécurité
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations personnelles</CardTitle>
                      <CardDescription>
                        Mettez à jour vos informations personnelles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                          <FormField
                            control={profileForm.control}
                            name="nom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom complet</FormLabel>
                                <FormControl>
                                  <Input placeholder="Votre nom" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Adresse email</FormLabel>
                                <FormControl>
                                  <div className="flex gap-2">
                                    <Input
                                      type="email"
                                      placeholder="email@example.com"
                                      {...field}
                                      disabled
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  L'adresse email ne peut pas être modifiée
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button type="submit" className="gap-2">
                            <Save className="h-4 w-4" />
                            Enregistrer les modifications
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="security" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sécurité</CardTitle>
                      <CardDescription>
                        Gérez votre mot de passe et la sécurité de votre compte
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                          <FormField
                            control={passwordForm.control}
                            name="current_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mot de passe actuel</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={passwordForm.control}
                            name="new_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nouveau mot de passe</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Au moins 6 caractères
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={passwordForm.control}
                            name="confirm_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button type="submit" className="gap-2">
                            <Key className="h-4 w-4" />
                            Mettre à jour le mot de passe
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
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
  Save,
  Trash,
  User as UserIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, signOut } from "@/lib/auth";
import type { User as BaseUser } from "@/lib/auth";

// Extend the User type to include avatar_url and departements for this page
type AuthUser = BaseUser & {
  avatar_url?: string | null;
  departements?: { nom: string };
};

const profileFormSchema = z.object({
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
});

const passwordFormSchema = z.object({
  new_password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_password"],
});

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { nom: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        if (currentUser.role !== "etudiant") {
          toast({
            title: "Accès non autorisé",
            description: "Cette page est réservée aux étudiants.",
            variant: "destructive",
          });
          router.push("/auth/login");
          return;
        }
        setUser(currentUser);
        profileForm.reset({ nom: currentUser.nom || "" });
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre profil",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router, toast, profileForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({ nom: values.nom, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      toast({ title: "Succès", description: "Votre profil a été mis à jour" });
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
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
      const { error } = await supabase.auth.updateUser({ password: values.new_password });
      if (error) throw error;
      toast({ title: "Succès", description: "Votre mot de passe a été mis à jour" });
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
    if (!event.target.files || !event.target.files[0] || !user) return;
    try {
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;
      toast({ title: "Succès", description: "Votre photo de profil a été mise à jour" });
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
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

  const handleRemoveAvatar = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({ avatar_url: null })
        .eq("id", user.id);
      if (error) throw error;
      toast({ title: "Succès", description: "Votre photo de profil a été supprimée" });
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer votre photo de profil",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
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

  if (!user) return null;

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
              Gérez vos informations personnelles et vos préférences
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
                <AlertDialogAction onClick={handleLogout}>Se déconnecter</AlertDialogAction>
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
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Photo de profil</CardTitle>
                <CardDescription>Cette photo sera visible par les autres utilisateurs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback className="text-2xl">
                      {user.nom.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
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
                    {user.avatar_url && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={handleRemoveAvatar}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Département</p>
                  <p className="text-sm text-muted-foreground">{user.departements?.nom || "Non spécifié"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Rôle</p>
                  <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-2">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile" className="gap-2">
                    <UserIcon className="h-4 w-4" />
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
                      <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                          <FormField
                            control={profileForm.control}
                            name="nom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                  <Input placeholder="Votre nom" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="gap-2">
                            <Save className="h-4 w-4" />
                            Enregistrer les changements
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
                      <CardDescription>Gérez votre mot de passe</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                          <FormField
                            control={passwordForm.control}
                            name="new_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nouveau mot de passe</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="confirm_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmer le mot de passe</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
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
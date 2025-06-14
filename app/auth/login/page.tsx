"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { signIn, signInSchema } from "@/lib/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "etudiant",
      department: "",
    },
  });

  const selectedRole = form.watch("role");

  async function onSubmit(values: any) {
    try {
      setIsLoading(true);
      const user = await signIn(values);
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${user.nom} !`,
      });

      switch (user.role) {
        case "etudiant":
          router.push("/etudiant/dashboard");
          break;
        case "chef_dept":
        case "directeur_prog":
          router.push("/traitement/dashboard");
          break;
        case "dae":
        case "secretaire_dg":
        case "dg":
          router.push("/validation-finale/dashboard");
          break;
        default:
          throw new Error("Rôle non reconnu");
      }
    } catch (error: any) {
      console.error('Erreur connexion:', error.message);
      toast({
        title: "Erreur lors de la connexion",
        description: error.message || "Veuillez vérifier vos identifiants et réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container max-w-md mx-auto px-4 pt-32 pb-20"
    >
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Connexion à GOPAC
          </CardTitle>
          <CardDescription className="text-center">
            Entrez vos identifiants pour accéder à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="etudiant">Étudiant</SelectItem>
                        <SelectItem value="chef_dept">Chef de département</SelectItem>
                        <SelectItem value="directeur_prog">Directeur de programme</SelectItem>
                        <SelectItem value="dae">DAE</SelectItem>
                        <SelectItem value="secretaire_dg">Secrétaire DG</SelectItem>
                        <SelectItem value="dg">Directeur Général</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="votre.email@exemple.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {['etudiant', 'chef_dept', 'directeur_prog'].includes(selectedRole) && (
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Département</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez votre département" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NTIC">NTIC</SelectItem>
                          <SelectItem value="DL">Développement Logiciel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="text-center text-sm">
            Vous n'avez pas de compte ?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:underline font-medium"
            >
              Créer un compte
            </Link>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
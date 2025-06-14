
"use client";

import React, { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  FileUp,
  HelpCircle,
  Info,
  Loader2,
  Send,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { sendEmailAction } from "@/actions/sendEmailAction";

const requestFormSchema = z.object({
  requestType: z.string({ required_error: "Veuillez sélectionner un type de demande" }),
  licenseLevel: z.enum(["L1", "L2", "L3"], { required_error: "Veuillez sélectionner votre niveau de licence" }),
  justification: z.string().optional(),
  urgency: z.enum(["normal", "urgent"], { required_error: "Veuillez sélectionner le niveau d'urgence" }),
  deliveryMethod: z.enum(["email", "in_person"], { required_error: "Veuillez sélectionner le mode de livraison" }),
  agreeTos: z.boolean().refine((value) => value === true, { message: "Vous devez accepter les conditions" }),
});

const requestTypes = [
  { id: "releve", label: "Relevé de notes", requiresPayment: true, requiresJustification: false, description: "Document détaillant les notes obtenues aux examens", paymentAmount: "10.000 FG", authority: "chef_dept" },
  { id: "inscription", label: "Attestation d'inscription", requiresPayment: false, requiresJustification: false, description: "Document officiel confirmant votre statut d'étudiant inscrit", authority: "chef_dept" },
  { id: "reussite", label: "Attestation de réussite", requiresPayment: false, requiresJustification: false, description: "Document certifiant la réussite à un niveau d'études", authority: "chef_dept" },
  { id: "reclamation", label: "Réclamation de notes", requiresPayment: false, requiresJustification: true, description: "Demande de vérification de notes pour les filières DL et NTIC", authority: "directeur_prog" },
  { id: "stage", label: "Demande de Stage", requiresPayment: false, requiresJustification: true, description: "Demande pour effectuer un stage professionnel", authority: "dae" },
  { id: "suspension", label: "Suspension d'Études", requiresPayment: false, requiresJustification: true, description: "Demande d'interruption temporaire des études", authority: "directeur_prog" },
  { id: "absence", label: "Absence Prolongée", requiresPayment: false, requiresJustification: true, description: "Justification d'une absence de longue durée", authority: "chef_dept" },
  { id: "diplome", label: "Diplôme / Certificat Final", requiresPayment: true, requiresJustification: false, description: "Document officiel attestant de l'obtention du diplôme", paymentAmount: "50.000 FG", authority: "secretaire_dg" },
  { id: "reinscription", label: "(Ré)Inscription Administrative", requiresPayment: true, requiresJustification: false, description: "Procédure annuelle d'enregistrement administratif", paymentAmount: "20.000 FG", authority: "secretaire_dg" },
  { id: "conge", label: "Congé Académique", requiresPayment: false, requiresJustification: true, description: "Suspension officielle des études pour une période déterminée", authority: "directeur_prog" },
  { id: "changement", label: "Changement de Filière", requiresPayment: false, requiresJustification: true, description: "Demande de transfert vers une autre spécialité d'études", authority: "directeur_prog" },
  { id: "recommandation", label: "Lettre de Recommandation", requiresPayment: false, requiresJustification: true, description: "Attestation des qualités académiques par un responsable", authority: "chef_dept" },
  { id: "convention", label: "Convention de Stage", requiresPayment: false, requiresJustification: true, description: "Accord officiel entre l'université et l'entreprise d'accueil", authority: "dae" },
];

export default function NewRequestPage() {
  type RequestType = typeof requestTypes[number];
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [department, setDepartment] = useState<string>("");
  const [authorityName, setAuthorityName] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof requestFormSchema>>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      urgency: "normal",
      agreeTos: false,
      licenseLevel: "L1",
      deliveryMethod: "email",
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({ title: "Erreur", description: "Erreur d'authentification.", variant: "destructive" });
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*, departements(nom)")
        .eq("id", user.id)
        .single();
      if (error) {
        console.error("Erreur chargement userData:", error);
        toast({ title: "Erreur", description: "Impossible de charger les données utilisateur.", variant: "destructive" });
        return;
      }

      if (data) {
        setUserData(data);
        setDepartment(data.departements?.nom || "");
      }
    };

    fetchUserData();
  }, [router, toast]);

  useEffect(() => {
    const fetchAuthority = async () => {
      if (selectedRequestType && userData?.departement_id) {
        let query = supabase
          .from("users")
          .select("nom")
          .eq("role", selectedRequestType.authority);

        if (['chef_dept', 'directeur_prog'].includes(selectedRequestType.authority)) {
          query = query.eq("departement_id", userData.departement_id);
        }

        const { data, error } = await query.single();
        if (error) {
          console.error("Erreur récupération autorité:", error);
          setAuthorityName("Non défini");
        } else {
          setAuthorityName(data.nom);
        }
      }
    };
    fetchAuthority();
  }, [selectedRequestType, userData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isAdditional = false) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) => file.size <= 5 * 1024 * 1024); // Max 5MB
      if (newFiles.length !== e.target.files.length) {
        toast({ title: "Erreur", description: "Certains fichiers dépassent la limite de 5 Mo.", variant: "destructive" });
      }
      if (isAdditional) {
        setAdditionalFiles(newFiles);
      } else {
        setFiles(newFiles);
      }
    }
  };

  const watchRequestType = form.watch("requestType");

  useEffect(() => {
    setSelectedRequestType(requestTypes.find((type) => type.id === watchRequestType) || null);
  }, [watchRequestType]);

  async function onSubmit(values: z.infer<typeof requestFormSchema>) {
    try {
      setIsSubmitting(true);
      if (!userData) throw new Error("Données utilisateur non chargées");
      if (userData.role !== "etudiant") throw new Error("Seuls les étudiants peuvent soumettre des demandes.");
      if (!selectedRequestType) throw new Error("Type de demande non sélectionné");

      const uploadFiles = async (filesToUpload: File[], type: string) => {
        const uploadedUrls: { nom_fichier: string; url: string; type: string }[] = [];
        for (const file of filesToUpload) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${userData.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(fileName, file);
          if (uploadError) throw new Error(`Erreur téléversement fichier: ${uploadError.message}`);
          const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(fileName);
          uploadedUrls.push({ nom_fichier: file.name, url: publicUrl, type });
        }
        return uploadedUrls;
      };

      const mainDocuments = await uploadFiles(files, "student_upload");
      const additionalDocuments = additionalFiles.length > 0 ? await uploadFiles(additionalFiles, "student_upload") : [];

      const demandeData = {
        titre: selectedRequestType.label,
        description: values.justification || "",
        etudiant_id: userData.id,
        nom_complet: userData.nom,
        license_level: values.licenseLevel,
        type: selectedRequestType.id,
        statut: "en_attente",
        delivery_method: values.deliveryMethod,
        departement_id: userData.departement_id || null,
        date_soumission: new Date().toISOString(),
        date_mise_a_jour: new Date().toISOString(),
      };

      const { data: request, error: requestError } = await supabase
        .from("demandes")
        .insert([demandeData])
        .select()
        .single();
      if (requestError) throw new Error(`Erreur insertion dans demandes: ${requestError.message}`);

      const allDocuments = [...mainDocuments, ...additionalDocuments];
      const documentsData = allDocuments.map((doc) => ({
        demande_id: request.id,
        nom_fichier: doc.nom_fichier,
        url: doc.url,
        type: doc.type,
      }));
      const { error: documentsError } = await supabase.from("pieces_jointes").insert(documentsData);
      if (documentsError) throw new Error(`Erreur insertion dans pieces_jointes: ${documentsError.message}`);

      const { error: logError } = await supabase.from("logs_suivi").insert({
        demande_id: request.id,
        etat: "en_attente",
        user_id: userData.id,
        message: `Demande soumise par ${userData.nom}`,
      });
      if (logError) throw new Error(`Erreur insertion dans logs_suivi: ${logError.message}`);

      // Notifier l'étudiant (in-app notification)
      const studentNotificationMessage = `Votre demande pour ${selectedRequestType.label} (ID: ${request.id}) a été soumise avec succès et est en attente de traitement.`;
      const { error: studentNotifError } = await supabase.from("notifications").insert({
        user_id: userData.id,
        message: studentNotificationMessage,
      });
      if (studentNotifError) throw new Error(`Erreur notification étudiant: ${studentNotifError.message}`);

      // Envoyer un e-mail à l'étudiant
      const studentEmailResult = await sendEmailAction({
        to: userData.email,
        subject: `Confirmation de soumission: ${selectedRequestType.label}`,
        text: studentNotificationMessage,
      });
      if (!studentEmailResult.success) {
        console.error("Échec envoi e-mail étudiant:", studentEmailResult.error);
        toast({
          title: "Avertissement",
          description: "Demande enregistrée, mais l'e-mail de confirmation n'a pas été envoyé.",
          variant: "destructive",
        });
      }

      // Notifier les autorités compétentes
      let authoritiesQuery = supabase
        .from("users")
        .select("id, nom, email")
        .eq("role", selectedRequestType.authority);

      if (["chef_dept", "directeur_prog"].includes(selectedRequestType.authority) && userData.departement_id) {
        authoritiesQuery = authoritiesQuery.eq("departement_id", userData.departement_id);
      }

      const { data: authorities, error: authorityError } = await authoritiesQuery;
      if (authorityError) {
        console.error("Erreur sélection autorités:", authorityError);
        toast({
          title: "Avertissement",
          description: "Impossible de notifier l'autorité. La demande est enregistrée, mais contactez l'administrateur.",
          variant: "destructive",
        });
      }

      if (authorities && authorities.length > 0) {
        const authorityNotificationMessage = `Une nouvelle demande pour ${selectedRequestType.label} (ID: ${request.id}) par ${userData.nom} (${values.licenseLevel}) nécessite votre traitement.`;
        const notificationsData = authorities.map((auth) => ({
          user_id: auth.id,
          message: authorityNotificationMessage,
        }));
        const { error: notificationError } = await supabase.from("notifications").insert(notificationsData);
        if (notificationError) throw new Error(`Erreur insertion dans notifications: ${notificationError.message}`);

        // Envoyer un e-mail à chaque autorité
        for (const auth of authorities) {
          const authEmailResult = await sendEmailAction({
            to: auth.email,
            subject: `Nouvelle demande à traiter: ${selectedRequestType.label}`,
            text: authorityNotificationMessage,
          });
          if (!authEmailResult.success) {
            console.error(`Échec envoi e-mail à ${auth.email}:`, authEmailResult.error);
            toast({
              title: "Avertissement",
              description: `Demande enregistrée, mais l'e-mail à ${auth.nom} n'a pas été envoyé.`,
              variant: "destructive",
            });
          }
        }
      } else {
        console.warn("Aucune autorité trouvée pour:", selectedRequestType.authority);
        toast({
          title: "Avertissement",
          description: "Aucune autorité trouvée pour traiter cette demande. Contactez l'administrateur.",
          variant: "destructive",
        });
      }

      toast({ title: "Demande soumise", description: "Votre demande a été enregistrée." });
      router.push("/etudiant/mes-demandes");
    } catch (error: any) {
      console.error("Erreur soumission:", error);
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue lors de la soumission.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="pt-24 pb-16">
      <div className="container px-4 md:px-6 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="gap-1 mb-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold tracking-tight">Nouvelle demande</h1>
            <p className="text-muted-foreground mt-1">Remplissez le formulaire pour soumettre votre demande.</p>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Formulaire de demande</CardTitle>
              <CardDescription>Tous les champs marqués d'un astérisque (*) sont obligatoires.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom complet</Label>
                      <Input value={userData?.nom || ""} readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Département</Label>
                      <Input value={department} readOnly className="bg-muted/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Responsable</Label>
                      <Input value={authorityName} readOnly className="bg-muted/50" />
                    </div>
                    <FormField
                      control={form.control}
                      name="licenseLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Niveau de licence *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez votre niveau de licence" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="L1">L1</SelectItem>
                                <SelectItem value="L2">L2</SelectItem>
                                <SelectItem value="L3">L3</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de demande *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un type de demande" />
                            </SelectTrigger>
                            <SelectContent>
                              {requestTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.label} {type.requiresPayment && "(Payant)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        {selectedRequestType && (
                          <>
                            <FormDescription>{selectedRequestType.description}</FormDescription>
                            <FormDescription>Responsable: {authorityName}</FormDescription>
                          </>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode de livraison *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="email" id="email" />
                              <Label htmlFor="email">Par email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="in_person" id="in_person" />
                              <Label htmlFor="in_person">En personne</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {selectedRequestType?.requiresPayment && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Paiement requis</AlertTitle>
                      <AlertDescription>
                        Cette demande nécessite un paiement de {selectedRequestType.paymentAmount}. Veuillez joindre une preuve de paiement.
                      </AlertDescription>
                    </Alert>
                  )}
                  {selectedRequestType?.requiresJustification && (
                    <FormField
                      control={form.control}
                      name="justification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Justification
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="w-80">Expliquez brièvement la raison de votre demande.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Expliquez brièvement..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <div className="space-y-4">
                    <Label className="block">Pièces justificatives</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="document" className="text-sm font-medium">
                            Document principal
                          </Label>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Obligatoire
                          </span>
                        </div>
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer ${
                            files.length > 0 ? "border-green-500/50 bg-green-500/10" : "border-muted"
                          }`}
                          onClick={() => document.getElementById("document")?.click()}
                        >
                          {files.length > 0 ? (
                            <div className="flex flex-col items-center gap-2">
                              <Check className="h-8 w-8 text-green-500" />
                              <p className="text-sm font-medium">{files[0].name}</p>
                              <p className="text-xs text-muted-foreground">Cliquez pour remplacer</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <FileUp className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm font-medium">
                                Glissez ou cliquez pour télécharger
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PDF, JPEG ou PNG (Max 5MB)
                              </p>
                            </div>
                          )}
                          <input
                            id="document"
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e)}
                          />
                        </div>
                      </div>
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="additional" className="text-sm font-medium">
                            Document supplémentaire
                          </Label>
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            Optionnel
                          </span>
                        </div>
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer ${
                            additionalFiles.length > 0 ? "border-green-500/50 bg-green-500/10" : "border-muted"
                          }`}
                          onClick={() => document.getElementById("additional")?.click()}
                        >
                          {additionalFiles.length > 0 ? (
                            <div className="flex flex-col items-center gap-2">
                              <Check className="h-8 w-8 text-green-500" />
                              <p className="text-sm font-medium">{additionalFiles[0].name}</p>
                              <p className="text-xs text-muted-foreground">Cliquez pour remplacer</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <FileUp className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm font-medium">Document supplémentaire</p>
                              <p className="text-xs text-muted-foreground">
                                PDF, JPEG ou PNG (Max 5MB)
                              </p>
                            </div>
                          )}
                          <input
                            id="additional"
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, true)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Niveau d'urgence *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="normal" id="normal" />
                              <Label htmlFor="normal">Normal</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="urgent" id="urgent" />
                              <Label htmlFor="urgent">Urgent</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Les demandes urgentes sont traitées en priorité mais doivent être justifiées.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Alert
                    variant="destructive"
                    className="bg-destructive/10 text-destructive border-destructive/20"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      Assurez-vous que toutes les informations fournies sont correctes et vérifiables.
                      Toute fausse déclaration peut entraîner le rejet de votre demande.
                    </AlertDescription>
                  </Alert>
                  <FormField
                    control={form.control}
                    name="agreeTos"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>J'accepte les conditions d'utilisation *</FormLabel>
                          <FormDescription>
                            En soumettant cette demande, je certifie que les informations fournies sont exactes.
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting || !form.formState.isValid || files.length === 0}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Soumission en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Soumettre la demande
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
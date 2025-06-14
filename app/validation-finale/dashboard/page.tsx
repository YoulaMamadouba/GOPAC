"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { FileCheck, XCircle, User } from "lucide-react";
import { sendEmailAction } from '@/actions/sendEmailAction'; // Utiliser directement l'action serveur

// Interfaces pour typer les données
interface Request {
  id: string;
  titre: string;
  description: string;
  statut: string;
  created_at: string;
  license_level: string;
  delivery_method: string;
  nom_complet: string;
  etudiant: { id: string; nom: string; email: string };
  departement: { id: string; nom: string };
  pieces_jointes: { id: string; nom_fichier: string; url: string; type: string }[];
}

interface Stats {
  pending: number;
  validated: number;
  rejected: number;
}

export default function ValidatorDashboard() {
  const [stats, setStats] = useState<Stats>({ pending: 0, validated: 0, rejected: 0 });
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [userData, setUserData] = useState<any>(null); // Renommé pour plus de clarté
  const [loading, setLoading] = useState(true);
  const [processedFiles, setProcessedFiles] = useState<{ [key: string]: File | null }>({});
  const [rejectionReasons, setRejectionReasons] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const router = useRouter();

  // Fonction pour valider le format d'e-mail
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Récupérer les informations de l'utilisateur
  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error("Utilisateur non authentifié");
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userError) throw userError;
      if (userData.role !== "dg") {
        throw new Error("Accès réservé au DG");
      }
      if (!isValidEmail(userData.email)) {
        throw new Error(`E-mail invalide pour l'utilisateur DG: ${userData.email}`);
      }
      setUserData(userData);
    } catch (error: any) {
      console.error("Erreur chargement de l'utilisateur:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les informations utilisateur",
        variant: "destructive",
      });
      router.push("/auth/login");
    }
  };

  // Charger les statistiques et les demandes récentes
  const fetchDashboardData = async () => {
    if (!userData) return; // Attendre que userData soit chargé
    try {
      setLoading(true);

      const [pendingRes, validatedRes, rejectedRes, requestsRes] = await Promise.all([
        supabase.from("demandes").select("*", { count: "exact" }).eq("statut", "en_traitement"),
        supabase.from("demandes").select("*", { count: "exact" }).eq("statut", "validee"),
        supabase.from("demandes").select("*", { count: "exact" }).eq("statut", "rejetee"),
        supabase
          .from("demandes")
          .select(`
            id,
            titre,
            type,
            description,
            statut,
            created_at,
            license_level,
            delivery_method,
            nom_complet,
            etudiant:etudiant_id(id, nom, email),
            departement:departement_id(id, nom),
            pieces_jointes(id, nom_fichier, url, type)
          `)
          .eq("statut", "en_traitement")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (pendingRes.error) throw new Error(`Erreur comptage pending: ${pendingRes.error.message}`);
      if (validatedRes.error) throw new Error(`Erreur comptage validées: ${validatedRes.error.message}`);
      if (rejectedRes.error) throw new Error(`Erreur comptage rejetées: ${rejectedRes.error.message}`);
      if (requestsRes.error) throw new Error(`Erreur chargement demandes: ${requestsRes.error.message}`);

      setStats({
        pending: pendingRes.count || 0,
        validated: validatedRes.count || 0,
        rejected: rejectedRes.count || 0,
      });

      setRecentRequests(requestsRes.data as Request[]);

      // Envoyer un e-mail au DG pour chaque demande en traitement (limité pour éviter les limites de taux)
      const maxEmails = 5; // Limite pour éviter les limites de Gmail
      let emailCount = 0;
      for (const request of requestsRes.data || []) {
        if (emailCount >= maxEmails) {
          console.warn("Limite d'e-mails atteinte, arrêt de l'envoi.");
          toast({
            title: "Avertissement",
            description: "Limite d'envoi d'e-mails atteinte. Certaines notifications n'ont pas été envoyées.",
            variant: "destructive",
          });
          break;
        }
        try {
          const result = await sendEmailAction({
            to: userData.email,
            subject: `Nouvelle demande à valider: ${request.titre}`,
            text: `Une demande de ${request.nom_complet} (${request.titre}) est en attente de validation finale. Veuillez vérifier dans l'application.`,
          });
          if (!result.success) {
            console.error(`Échec envoi e-mail pour demande ${request.id}:`, result.error);
            toast({
              title: "Avertissement",
              description: `Impossible d'envoyer la notification pour la demande ${request.titre}.`,
              variant: "destructive",
            });
          } else {
            emailCount++;
          }
        } catch (error: any) {
          console.error(`Erreur envoi e-mail pour demande ${request.id}:`, error.message);
        }
      }
    } catch (error: any) {
      console.error("Erreur chargement données tableau de bord:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les données du tableau de bord",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Exécuter fetchUserData d'abord, puis fetchDashboardData
  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchDashboardData();
    }
  }, [userData]);

  // Gérer le changement de fichier uploadé
  const handleFileChange = (requestId: string, file: File | null) => {
    setProcessedFiles((prev) => ({ ...prev, [requestId]: file }));
  };

  // Gérer le changement de motif de rejet
  const handleRejectionReasonChange = (requestId: string, reason: string) => {
    setRejectionReasons((prev) => ({ ...prev, [requestId]: reason }));
  };

  // Valider ou rejeter une demande
  const handleValidateRequest = async (requestId: string, action: "valide" | "rejete") => {
    try {
      const request = recentRequests.find((r) => r.id === requestId);
      if (!request) throw new Error("Demande introuvable");

      let signedDocumentUrl = "";
      if (action === "valide") {
        if (!processedFiles[requestId]) throw new Error("Veuillez uploader le document signé (PDF).");
        const file = processedFiles[requestId]!;
        const fileExt = file.name.split(".").pop();
        if (fileExt !== "pdf") throw new Error("Le document signé doit être au format PDF.");
        const fileName = `${userData?.id}/${requestId}/${Date.now()}-signed.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, file);
        if (uploadError) throw new Error(`Erreur upload fichier: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(fileName);
        signedDocumentUrl = publicUrl;

        const { error: pieceError } = await supabase.from("pieces_jointes").insert({
          demande_id: requestId,
          nom_fichier: `signed-${requestId}.pdf`,
          url: signedDocumentUrl,
          type: "signed",
        });
        if (pieceError) throw new Error(`Erreur insertion pièce jointe: ${pieceError.message}`);
      }

      const newStatus = action === "valide" ? "validee" : "rejetee";
      const rejectionReason = action === "rejete" ? rejectionReasons[requestId] || "Motif non spécifié" : null;

      const { error: validationError } = await supabase.from("validations").insert({
        demande_id: requestId,
        user_id: userData?.id,
        role: userData?.role,
        decision: action,
        motif: rejectionReason,
      });
      if (validationError) throw new Error(`Erreur insertion validation: ${validationError.message}`);

      const { error: updateError } = await supabase
        .from("demandes")
        .update({ statut: newStatus, date_mise_a_jour: new Date().toISOString() })
        .eq("id", requestId);
      if (updateError) throw new Error(`Erreur mise à jour demande: ${updateError.message}`);

      const { error: logError } = await supabase.from("logs_suivi").insert({
        demande_id: requestId,
        etat: newStatus,
        user_id: userData?.id,
        message: `Demande ${action === "valide" ? "validée" : "rejetée"} par ${userData?.nom}${rejectionReason ? `: ${rejectionReason}` : ""}`,
      });
      if (logError) throw new Error(`Erreur journalisation: ${logError.message}`);

      // Notifier l'étudiant
      let studentNotificationMessage = "";
      if (action === "valide") {
        studentNotificationMessage =
          request.delivery_method === "email"
            ? `Votre demande de ${request.titre} a été validée. Téléchargez le document signé ici : ${signedDocumentUrl}`
            : `Votre demande de ${request.titre} a été validée. Veuillez récupérer le document signé en personne.`;
      } else {
        studentNotificationMessage = `Votre demande de ${request.titre} a été rejetée. Motif : ${rejectionReason}.`;
      }
      if (isValidEmail(request.etudiant.email)) {
        const studentEmailResult = await sendEmailAction({
          to: request.etudiant.email,
          subject: `Mise à jour de votre demande: ${request.titre}`,
          text: studentNotificationMessage,
        });
        if (!studentEmailResult.success) {
          console.error(`Échec envoi e-mail à l'étudiant ${request.etudiant.email}:`, studentEmailResult.error);
          toast({
            title: "Avertissement",
            description: `Demande ${action === "valide" ? "validée" : "rejetée"}, mais l'e-mail à l'étudiant n'a pas été envoyé.`,
            variant: "destructive",
          });
        }
      } else {
        console.warn(`E-mail étudiant invalide: ${request.etudiant.email}`);
        toast({
          title: "Avertissement",
          description: `E-mail étudiant invalide pour la demande ${request.titre}.`,
          variant: "destructive",
        });
      }
      const { error: studentNotifError } = await supabase.from("notifications").insert({
        user_id: request.etudiant.id,
        message: studentNotificationMessage,
      });
      if (studentNotifError) throw new Error(`Erreur notification étudiant: ${studentNotifError.message}`);

      // Récupérer le traiteur (dernier utilisateur ayant traité la demande)
      const { data: processor, error: processorError } = await supabase
        .from("logs_suivi")
        .select("user_id")
        .eq("demande_id", requestId)
        .eq("etat", "en_traitement")
        .order("date_action", { ascending: false })
        .limit(1)
        .single();
      if (processor && !processorError) {
        const { data: processorData, error: processorDataError } = await supabase
          .from("users")
          .select("email")
          .eq("id", processor.user_id)
          .single();
        if (processorData && !processorDataError && isValidEmail(processorData.email)) {
          const processorNotificationMessage = `La demande de ${request.titre} a été ${action === "valide" ? "validée" : "rejetée"} par le DG${rejectionReason ? `: ${rejectionReason}` : ""}.`;
          const processorEmailResult = await sendEmailAction({
            to: processorData.email,
            subject: `Mise à jour de la demande: ${request.titre}`,
            text: processorNotificationMessage,
          });
          if (!processorEmailResult.success) {
            console.error(`Échec envoi e-mail au traiteur ${processorData.email}:`, processorEmailResult.error);
            toast({
              title: "Avertissement",
              description: `Demande ${action === "valide" ? "validée" : "rejetée"}, mais l'e-mail au traiteur n'a pas été envoyé.`,
              variant: "destructive",
            });
          }
          const { error: processorNotifError } = await supabase.from("notifications").insert({
            user_id: processor.user_id,
            message: processorNotificationMessage,
          });
          if (processorNotifError) throw new Error(`Erreur notification traiteur: ${processorNotifError.message}`);
        }
      }

      // Notifier le chef de département pour les demandes validées
      if (action === "valide") {
        const { data: chefDept, error: chefError } = await supabase
          .from("users")
          .select("id, email")
          .eq("role", "chef_dept")
          .eq("departement_id", request.departement.id)
          .single();
        if (chefError && chefError.code !== "PGRST116") throw new Error(`Erreur récupération chef de département: ${chefError.message}`);

        if (chefDept && isValidEmail(chefDept.email)) {
          const chefNotificationMessage =
            request.delivery_method === "email"
              ? `La demande de ${request.titre} a été validée par le DG. Le document signé est disponible ici : ${signedDocumentUrl}`
              : `La demande de ${request.titre} a été validée par le DG. Le document signé est prêt à être récupéré en personne.`;
          const chefEmailResult = await sendEmailAction({
            to: chefDept.email,
            subject: `Demande validée: ${request.titre}`,
            text: chefNotificationMessage,
          });
          if (!chefEmailResult.success) {
            console.error(`Échec envoi e-mail au chef de département ${chefDept.email}:`, chefEmailResult.error);
            toast({
              title: "Avertissement",
              description: `Demande validée, mais l'e-mail au chef de département n'a pas été envoyé.`,
              variant: "destructive",
            });
          }
          const { error: chefNotifError } = await supabase.from("notifications").insert({
            user_id: chefDept.id,
            message: chefNotificationMessage,
          });
          if (chefNotifError) throw new Error(`Erreur notification chef de département: ${chefNotifError.message}`);
        }
      }

      toast({
        title: `Demande ${action === "valide" ? "validée" : "rejetée"}`,
        description: `La demande a été ${action === "valide" ? "validée" : "rejetée"} avec succès.`,
      });
      fetchDashboardData();
    } catch (error: any) {
      console.error(`Erreur ${action} demande:`, error);
      toast({
        title: "Erreur",
        description: error.message || `Impossible de ${action === "valide" ? "valider" : "rejeter"} la demande`,
        variant: "destructive",
      });
    }
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord - Validation</h1>
            <p className="text-muted-foreground mt-1">Bienvenue, {userData?.nom}</p>
          </div>
          <Button onClick={() => router.push("/profile")} className="gap-2">
            <User className="h-4 w-4" />
            Mon profil
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Demandes en attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">En attente de validation</p>
                <Progress
                  value={(stats.pending / (stats.pending + stats.validated + stats.rejected)) * 100}
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Demandes validées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.validated}</div>
                <p className="text-xs text-muted-foreground mt-1">Validées avec succès</p>
                <Progress
                  value={(stats.validated / (stats.pending + stats.validated + stats.rejected)) * 100}
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Demandes rejetées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground mt-1">Rejetées</p>
                <Progress
                  value={(stats.rejected / (stats.pending + stats.validated + stats.rejected)) * 100}
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Demandes à valider</CardTitle>
              <CardDescription>Liste des demandes en attente de validation finale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRequests.length === 0 ? (
                  <p className="text-muted-foreground">Aucune demande en attente de validation.</p>
                ) : (
                  recentRequests.map((request) => (
                    <div key={request.id} className="flex flex-col p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{request.titre}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.nom_complet} - {request.departement.nom} -{" "}
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Niveau: {request.license_level} | Livraison: {request.delivery_method}
                          </p>
                          {request.pieces_jointes
                            .filter((piece) => piece.type === "processed")
                            .map((piece) => (
                              <a
                                key={piece.id}
                                href={piece.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary underline"
                              >
                                {piece.nom_fichier}
                              </a>
                            ))}
                        </div>
                        <Badge variant="default">{request.statut}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="border-2 border-dashed rounded-lg p-4">
                          <Label htmlFor={`signed-${request.id}`}>Document signé (PDF)</Label>
                          <Input
                            id={`signed-${request.id}`}
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(request.id, e.target.files?.[0] || null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`reason-${request.id}`}>Motif de rejet (si applicable)</Label>
                          <Textarea
                            id={`reason-${request.id}`}
                            placeholder="Entrez le motif de rejet..."
                            onChange={(e) => handleRejectionReasonChange(request.id, e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleValidateRequest(request.id, "valide")}
                            disabled={!processedFiles[request.id]}
                            className="gap-2"
                          >
                            <FileCheck className="h-4 w-4" />
                            Valider
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleValidateRequest(request.id, "rejete")}
                            className="gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
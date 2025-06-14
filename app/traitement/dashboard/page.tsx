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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, FileText, User, XCircle, RefreshCw, Bell, Send, Eye } from "lucide-react";
import { sendEmail } from '@/utils/sendEmail';

interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
  departement_id: string | null;
}

interface Demande {
  id: string;
  titre: string;
  description: string;
  statut: string;
  created_at: string;
  license_level: string;
  nom_complet: string;
  type: string;
  pieces_jointes: { id: string; nom_fichier: string; url: string; type: string }[];
}

interface Notification {
  id: string;
  message: string;
  lue: boolean;
  created_at: string;
  demande_id?: string;
  traiteur_id?: string;
}

interface Stats {
  pending: number;
  processing: number;
  completed: number;
  rejected: number;
}

const requestTypes = [
  { id: "inscription", authority: "chef_dept" },
  { id: "reussite", authority: "chef_dept" },
  { id: "releve", authority: "chef_dept" },
  { id: "reclamation", authority: "directeur_prog" },
  { id: "stage", authority: "dae" },
  { id: "suspension", authority: "directeur_prog" },
  { id: "absence", authority: "chef_dept" },
  { id: "diplome", authority: "secretaire_dg" },
  { id: "reinscription", authority: "secretaire_dg" },
  { id: "conge", authority: "directeur_prog" },
  { id: "changement", authority: "directeur_prog" },
  { id: "recommandation", authority: "chef_dept" },
  { id: "convention", authority: "dae" },
];

export default function ProcessingDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [department, setDepartment] = useState<string>("");
  const [stats, setStats] = useState<Stats>({ pending: 0, processing: 0, completed: 0, rejected: 0 });
  const [recentRequests, setRecentRequests] = useState<Demande[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [processedFiles, setProcessedFiles] = useState<{ [key: string]: File | null }>({});
  const [replyMessages, setReplyMessages] = useState<{ [key: string]: string }>({});
  const [isSendingReply, setIsSendingReply] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
    const channel = supabase
      .channel(`notifications:user_id=${user?.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user?.id}` },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error("Realtime notification subscription error:", err.message || err);
        }
        console.log("Realtime notification subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        router.push("/auth/login");
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*, departements(nom)")
        .eq("id", authUser.id)
        .single();

      if (userError) throw userError;

      setUser(userData);
      setDepartment(userData.departements?.nom || "");
      fetchStats(userData);
      fetchRecentRequests(userData);
      fetchNotifications(userData.id);
    } catch (error) {
      console.error("Erreur chargement données utilisateur:", error);
      toast({ title: "Erreur", description: "Impossible de charger les données utilisateur", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (userData: User) => {
    try {
      let query = supabase
        .from("demandes")
        .select("statut")
        .in("type", requestTypes.filter((t) => t.authority === userData.role).map((t) => t.id));

      if (['chef_dept', 'directeur_prog'].includes(userData.role) && userData.departement_id) {
        query = query.eq("departement_id", userData.departement_id);
      }

      const { data, error } = await query;

      if (error) throw new Error(`Erreur requête Supabase: ${error.message} [Code: ${error.code}]`);

      const statsData: Stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        rejected: 0,
      };

      data?.forEach((item) => {
        switch (item.statut) {
          case "en_attente":
            statsData.pending++;
            break;
          case "en_traitement":
            statsData.processing++;
            break;
          case "validee":
            statsData.completed++;
            break;
          case "rejetee":
            statsData.rejected++;
            break;
        }
      });

      setStats(statsData);
    } catch (error) {
      console.error("Erreur chargement stats:", error);
      toast({ title: "Erreur", description: "Impossible de charger les statistiques", variant: "destructive" });
    }
  };

  const fetchRecentRequests = async (userData: User) => {
    try {
      let query = supabase
        .from("demandes")
        .select("*, pieces_jointes(id, nom_fichier, url, type)")
        .in("type", requestTypes.filter((t) => t.authority === userData.role).map((t) => t.id))
        .order("created_at", { ascending: false })
        .limit(5);

      if (['chef_dept', 'directeur_prog'].includes(userData.role) && userData.departement_id) {
        query = query.eq("departement_id", userData.departement_id);
      }

      const { data, error } = await query;

      if (error) throw new Error(`Erreur requête Supabase: ${error.message} [Code: ${error.code}]`);
      setRecentRequests(data || []);

      for (const request of data || []) {
        if (request.statut === "en_attente") {
          await sendEmail({
            to: userData.email,
            subject: `Nouvelle demande à traiter: ${request.titre}`,
            text: `Une nouvelle demande de ${request.nom_complet} (${request.titre}) a été soumise. Veuillez la traiter dans l'application.`,
          });
        }
      }
    } catch (error) {
      console.error("Erreur chargement des demandes:", error);
      toast({ title: "Erreur", description: "Impossible de charger les demandes récentes", variant: "destructive" });
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, message, lue, created_at, demande_id, traiteur_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw new Error(`Erreur requête Supabase: ${error.message} [Code: ${error.code}]`);
      setNotifications(data || []);

      for (const notification of data || []) {
        if (!notification.lue) {
          await sendEmail({
            to: user!.email,
            subject: 'Nouvelle notification',
            text: `Vous avez une nouvelle notification : ${notification.message}`,
          });
        }
      }
    } catch (error) {
      console.error("Erreur chargement des notifications:", error);
      toast({ title: "Erreur", description: "Impossible de charger les notifications", variant: "destructive" });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ lue: true })
        .eq("id", notificationId)
        .select();
      if (error) throw new Error(`Erreur mise à jour notification: ${error.message} [Code: ${error.code}]`);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, lue: true } : notif))
      );
      toast({ title: "Succès", description: "Notification marquée comme lue" });
    } catch (error) {
      console.error("Erreur marquage notification lue:", error);
      toast({ title: "Erreur", description: "Impossible de marquer la notification comme lue", variant: "destructive" });
    }
  };

  const handleReplyToMessage = async (notificationId: string, demandeId: string) => {
    if (!user || !replyMessages[notificationId]?.trim()) return;

    setIsSendingReply((prev) => ({ ...prev, [notificationId]: true }));
    try {
      console.log("Replying to message for demande:", demandeId, "notification:", notificationId);

      // Insert message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          demande_id: demandeId,
          user_id: user.id,
          content: replyMessages[notificationId],
          is_admin: true,
        })
        .select("id")
        .single();
      if (messageError) {
        console.error("Message insert error:", messageError.message || messageError);
        throw messageError;
      }

      // Fetch etudiant for notification
      const { data: requestData, error: requestError } = await supabase
        .from("demandes")
        .select("etudiant_id, titre")
        .eq("id", demandeId)
        .single();
      if (requestError) {
        console.error("Request fetch error:", requestError.message || requestError);
        throw requestError;
      }

      const { data: etudiantData, error: etudiantError } = await supabase
        .from("users")
        .select("id, nom")
        .eq("id", requestData.etudiant_id)
        .single();
      if (etudiantError) {
        console.error("Etudiant fetch error:", etudiantError.message || etudiantError);
        throw etudiantError;
      }

      // Insert notification for etudiant
      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: etudiantData.id,
        demande_id: demandeId,
        message: `Nouveau message de ${user.nom} pour la demande ${requestData.titre} (Ref: ${demandeId}): "${replyMessages[notificationId].substring(0, 50)}${replyMessages[notificationId].length > 50 ? "..." : ""}"`,
        lue: false,
        created_at: new Date().toISOString(),
      });
      if (notificationError) {
        console.error("Notification insert error:", notificationError.message || notificationError);
        throw notificationError;
      }

      // Mark notification as read
      await markNotificationAsRead(notificationId);

      setReplyMessages((prev) => ({ ...prev, [notificationId]: "" }));
      toast({ title: "Succès", description: "Réponse envoyée à l'étudiant." });
    } catch (error: any) {
      console.error("Error replying to message:", error.message || error);
      toast({ title: "Erreur", description: "Impossible d'envoyer la réponse.", variant: "destructive" });
    } finally {
      setIsSendingReply((prev) => ({ ...prev, [notificationId]: false }));
    }
  };

  const handleProcessRequest = async (requestId: string) => {
    try {
      const file = processedFiles[requestId];
      if (!file) throw new Error("Veuillez uploader un document traité.");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}/${requestId}/${Date.now()}-processed.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);
      if (uploadError) throw new Error(`Erreur upload fichier: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(fileName);
      const { error: pieceError } = await supabase.from("pieces_jointes").insert({
        demande_id: requestId,
        nom_fichier: file.name,
        url: publicUrl,
        type: "processed",
      });
      if (pieceError) throw new Error(`Erreur insertion pièce jointe: ${pieceError.message}`);

      const { error: updateError } = await supabase
        .from("demandes")
        .update({ statut: "en_traitement", date_mise_a_jour: new Date().toISOString() })
        .eq("id", requestId);
      if (updateError) throw new Error(`Erreur mise à jour demande: ${updateError.message}`);

      const { error: logError } = await supabase.from("logs_suivi").insert({
        demande_id: requestId,
        etat: "en_traitement",
        user_id: user?.id,
        message: `Demande traitée par ${user?.nom}`,
      });
      if (logError) throw new Error(`Erreur journalisation: ${logError.message}`);

      const { data: request, error: requestError } = await supabase
        .from("demandes")
        .select("etudiant_id, titre, departement_id")
        .eq("id", requestId)
        .single();
      if (requestError) throw new Error(`Erreur récupération demande: ${requestError.message}`);

      const { data: student, error: studentError } = await supabase
        .from("users")
        .select("email")
        .eq("id", request.etudiant_id)
        .single();
      if (studentError) throw new Error(`Erreur récupération étudiant: ${studentError.message}`);

      await sendEmail({
        to: student.email,
        subject: `Mise à jour de votre demande: ${request.titre}`,
        text: `Votre demande de ${request.titre} est en cours de traitement.`,
      });

      const { data: dgUsers, error: dgError } = await supabase
        .from("users")
        .select("id, email")
        .eq("role", "dg");
      if (dgError) throw new Error(`Erreur récupération DG: ${dgError.message}`);

      if (dgUsers && dgUsers.length > 0) {
        for (const dg of dgUsers) {
          await sendEmail({
            to: dg.email,
            subject: `Nouvelle demande à valider: ${request.titre}`,
            text: `Une demande de ${request.titre} est en attente de validation finale. Veuillez vérifier dans l'application.`,
          });
        }
      }

      toast({ title: "Demande traitée", description: "La demande a été envoyée pour validation finale." });
      fetchStats(user!);
      fetchRecentRequests(user!);
      fetchNotifications(user!.id);
    } catch (error: any) {
      console.error("Erreur traitement demande:", error);
      toast({ title: "Erreur", description: error.message || "Impossible de traiter la demande", variant: "destructive" });
    }
  };

  const refreshDashboard = () => {
    if (user) {
      fetchStats(user);
      fetchRecentRequests(user);
      fetchNotifications(user.id);
      toast({ title: "Actualisé", description: "Le tableau de bord a été mis à jour." });
    }
  };

  const handleReplyMessageChange = (notificationId: string, value: string) => {
    setReplyMessages((prev) => ({ ...prev, [notificationId]: value }));
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
            <h1 className="text-3xl font-bold tracking-tight">
              Tableau de bord {department && `- ${department}`}
            </h1>
            <p className="text-muted-foreground mt-1">Bienvenue, {user?.nom}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshDashboard} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            <Button onClick={() => router.push("/profile")} className="gap-2">
              <User className="h-4 w-4" />
              Mon profil
            </Button>
          </div>
        </motion.div>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Dernières notifications reçues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-muted-foreground">Aucune notification pour le moment.</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border ${notif.lue ? "bg-muted/50" : "bg-primary/10"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Bell className={`h-5 w-5 ${notif.lue ? "text-muted-foreground" : "text-primary"}`} />
                        <div>
                          <p className={`text-sm ${notif.lue ? "text-muted-foreground" : ""}`}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!notif.lue && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markNotificationAsRead(notif.id)}
                          >
                            Marquer comme lu
                          </Button>
                        )}
                        {notif.demande_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/processing/request/${notif.demande_id}`)}
                            title="Voir la demande"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {notif.demande_id && !notif.lue && (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          placeholder="Tapez votre réponse ici..."
                          value={replyMessages[notif.id] || ""}
                          onChange={(e) => handleReplyMessageChange(notif.id, e.target.value)}
                          className="resize-none bg-white/90 backdrop-blur-sm border border-primary/20 focus:border-primary focus:ring-primary/30 rounded-xl text-foreground shadow-sm"
                        />
                        <Button
                          className="gap-2 bg-primary hover:bg-primary/90 rounded-xl shadow-md"
                          onClick={() => handleReplyToMessage(notif.id, notif.demande_id!)}
                          disabled={!replyMessages[notif.id]?.trim() || isSendingReply[notif.id]}
                        >
                          {isSendingReply[notif.id] ? (
                            <>
                              <motion.span
                                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                              Envoi...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Répondre
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Demandes à traiter</p>
              <Progress
                value={(stats.pending / (stats.pending + stats.processing + stats.completed + stats.rejected)) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En traitement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processing}</div>
              <p className="text-xs text-muted-foreground mt-1">En cours de traitement</p>
              <Progress
                value={(stats.processing / (stats.pending + stats.processing + stats.completed + stats.rejected)) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground mt-1">Demandes traitées</p>
              <Progress
                value={(stats.completed / (stats.pending + stats.processing + stats.completed + stats.rejected)) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground mt-1">Demandes rejetées</p>
              <Progress
                value={(stats.rejected / (stats.pending + stats.processing + stats.completed + stats.rejected)) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Demandes récentes</CardTitle>
              <CardDescription>Les dernières demandes reçues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRequests.length === 0 ? (
                  <p className="text-muted-foreground">Aucune demande à traiter pour le moment.</p>
                ) : (
                  recentRequests.map((request) => (
                    <div key={request.id} className="flex flex-col p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{request.titre}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.nom_complet} - {request.license_level} -{" "}
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                          {request.pieces_jointes
                            .filter((piece) => piece.type === "student_upload")
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
                        <Badge
                          variant={
                            request.statut === "en_attente"
                              ? "secondary"
                              : request.statut === "en_traitement"
                              ? "default"
                              : request.statut === "validee"
                              ? "success"
                              : "destructive"
                          }
                        >
                          {request.statut}
                        </Badge>
                      </div>
                      {request.statut === "en_attente" && (
                        <div className="space-y-2">
                          <div className="border-2 border-dashed rounded-lg p-4">
                            <Label htmlFor={`processed-${request.id}`}>Document traité</Label>
                            <Input
                              id={`processed-${request.id}`}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(request.id, e.target.files?.[0] || null)}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessRequest(request.id)}
                            disabled={!processedFiles[request.id]}
                          >
                            Traiter
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>Statistiques de traitement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Taux de complétion</p>
                    <p className="text-2xl font-bold">
                      {stats.completed + stats.rejected > 0
                        ? `${Math.round((stats.completed / (stats.completed + stats.rejected)) * 100)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Objectif mensuel</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  function handleFileChange(requestId: string, file: File | null): void {
    setProcessedFiles((prev) => ({ ...prev, [requestId]: file }));
  }
}
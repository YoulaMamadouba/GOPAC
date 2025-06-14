"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Request types mapping (aligned with ProcessingDashboard.tsx)
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

interface Request {
  id: string;
  titre: string;
  type: string;
  date_soumission: string;
  statut: string;
  license_level: string | null;
  delivery_method: string;
  departement: { id: string; nom: string };
  pieces_jointes: { id: string; nom_fichier: string; url: string; type: string }[];
  validations: { id: string; role: string; decision: string; motif: string | null }[];
  logs_suivi: { id: string; etat: string; message: string | null; user_id: string; date_action: string; users: { nom: string } }[];
}

interface Message {
  id: string;
  demande_id: string;
  user_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
  users: { nom: string; avatar_url: string | null };
}

interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

export default function RequestDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Status configuration
  const statusConfig = {
    en_attente: {
      label: "En attente",
      color: "bg-blue-400 text-white",
      textColor: "text-blue-400",
      icon: Clock,
    },
    en_traitement: {
      label: "En traitement",
      color: "bg-secondary text-white",
      textColor: "text-secondary",
      icon: Clock,
    },
    validee: {
      label: "Validée",
      color: "bg-primary text-white",
      textColor: "text-primary",
      icon: CheckCircle2,
    },
    rejetee: {
      label: "Rejetée",
      color: "bg-red-500 text-white",
      textColor: "text-red-500",
      icon: X,
    },
  };

  // Fetch user, request, and messages
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          console.error("Auth error:", authError?.message || authError);
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter.",
            variant: "destructive",
          });
          router.push("/auth/login");
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, nom, email, role, avatar_url")
          .eq("id", authUser.id)
          .single();

        if (userError) {
          console.error("User fetch error:", userError.message || userError);
          throw userError;
        }
        if (userData.role !== "etudiant") {
          toast({
            title: "Accès non autorisé",
            description: "Cette page est réservée aux étudiants.",
            variant: "destructive",
          });
          router.push("/auth/login");
          return;
        }
        setUser(userData);

        const { data: requestData, error: requestError } = await supabase
          .from("demandes")
          .select(`
            id,
            titre,
            type,
            date_soumission,
            statut,
            license_level,
            delivery_method,
            departement:departements(id, nom),
            pieces_jointes(id, nom_fichier, url, type),
            validations(id, role, decision, motif),
            logs_suivi(id, etat, message, user_id, date_action, users(nom))
          `)
          .eq("id", id)
          .eq("etudiant_id", userData.id)
          .single();

        if (requestError) {
          console.error("Request fetch error:", requestError.message || requestError);
          throw requestError;
        }
        if (!requestData) {
          console.warn("No request data found for id:", id);
          toast({
            title: "Erreur",
            description: "Demande introuvable ou accès non autorisé.",
            variant: "destructive",
          });
          router.push("/etudiant/mes-demandes");
          return;
        }

        setRequest({
          ...requestData,
          departement: Array.isArray(requestData.departement)
            ? requestData.departement[0] || { id: "", nom: "Non spécifié" }
            : requestData.departement || { id: "", nom: "Non spécifié" },
          pieces_jointes: requestData.pieces_jointes || [],
          validations: requestData.validations || [],
          logs_suivi: Array.isArray(requestData.logs_suivi)
            ? requestData.logs_suivi.map((log: any) => ({
                ...log,
                users: Array.isArray(log.users)
                  ? log.users[0] || { nom: "Inconnu" }
                  : log.users || { nom: "Inconnu" },
              }))
            : [],
        });

        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select(`
            id,
            demande_id,
            user_id,
            content,
            is_admin,
            created_at,
            users(nom, avatar_url)
          `)
          .eq("demande_id", id)
          .order("created_at", { ascending: true });

        if (messagesError) {
          console.error("Messages fetch error:", messagesError.message || messagesError);
          throw messagesError;
        }
        setMessages(
          (messagesData || []).map((msg: any) => ({
            ...msg,
            users: Array.isArray(msg.users)
              ? msg.users[0] || { nom: "Inconnu", avatar_url: null }
              : msg.users || { nom: "Inconnu", avatar_url: null },
          }))
        );

        const channel = supabase
          .channel(`messages:demande_id=${id}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages", filter: `demande_id=eq.${id}` },
            async (payload) => {
              const newMessage = payload.new as Message;
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("nom, avatar_url")
                .eq("id", newMessage.user_id)
                .single();
              if (userError) {
                console.error("Realtime user fetch error:", userError.message || userError);
                return;
              }
              setMessages((prev) => [
                ...prev,
                { ...newMessage, users: userData || { nom: "Inconnu", avatar_url: null } },
              ]);
            }
          )
          .subscribe((status, err) => {
            if (err) {
              console.error("Realtime subscription error:", err.message || err);
            }
            console.log("Realtime subscription status:", status);
          });

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error: any) {
        console.error("Error fetching data:", error.message || error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails de la demande. Veuillez réessayer.",
          variant: "destructive",
        });
        router.push("/etudiant/mes-demandes");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router, toast]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !request) return;

    setIsSendingMessage(true);
    try {
      console.log("Sending message for request:", request.id, "type:", request.type);

      // Insert message
      const { data: newMessageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          demande_id: request.id,
          user_id: user.id,
          content: newMessage,
          is_admin: false,
        })
        .select(`
          id,
          demande_id,
          user_id,
          content,
          is_admin,
          created_at,
          users(nom, avatar_url)
        `)
        .single();

      if (messageError) {
        console.error("Message insert error:", messageError.message || messageError);
        throw messageError;
      }

      // Find traiteur based on request type and departement
      const requestType = requestTypes.find((rt) => rt.id === request.type);
      if (!requestType) {
        throw new Error("Type de demande non reconnu");
      }

      let traiteurQuery = supabase
        .from("users")
        .select("id, email")
        .eq("role", requestType.authority);

      if (["chef_dept", "directeur_prog"].includes(requestType.authority)) {
        traiteurQuery = traiteurQuery.eq("departement_id", request.departement.id);
      }

      const { data: traiteurData, error: traiteurError } = await traiteurQuery.single();
      if (traiteurError || !traiteurData) {
        console.error("Traiteur fetch error:", traiteurError?.message || traiteurError);
        throw new Error("Aucun traiteur trouvé pour cette demande");
      }

      console.log("Traiteur found:", traiteurData.id);

      // Insert notification for traiteur
      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: traiteurData.id,
        demande_id: request.id,
        traiteur_id: traiteurData.id,
        message: `Nouveau message de ${user.nom} pour la demande ${request.titre} (Ref: ${request.id}): "${newMessage.substring(0, 50)}${newMessage.length > 50 ? "..." : ""}"`,
        lue: false,
        created_at: new Date().toISOString(),
      });
      if (notificationError) {
        console.error("Notification insert error:", notificationError.message || notificationError);
        throw notificationError;
      }

      setNewMessage("");
      toast({
        title: "Message envoyé",
        description: "Votre message a été transmis au traiteur concerné.",
      });
    } catch (error: any) {
      console.error("Error sending message:", error.message || error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle cancel request
  const handleCancelRequest = async () => {
    if (!request || !user) return;

    try {
      const { error: updateError } = await supabase
        .from("demandes")
        .update({ statut: "rejetee", date_mise_a_jour: new Date().toISOString() })
        .eq("id", request.id);

      if (updateError) {
        console.error("Request update error:", updateError.message || updateError);
        throw updateError;
      }

      const { error: logError } = await supabase.from("logs_suivi").insert({
        demande_id: request.id,
        etat: "rejetee",
        user_id: user.id,
        message: `Demande annulée par l'étudiant ${user.nom}`,
        date_action: new Date().toISOString(),
      });

      if (logError) {
        console.error("Log insert error:", logError.message || logError);
        throw logError;
      }

      setRequest({ ...request, statut: "rejetee" });
      toast({
        title: "Succès",
        description: "La demande a été annulée avec succès.",
      });
    } catch (error: any) {
      console.error("Error cancelling request:", error.message || error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la demande.",
        variant: "destructive",
      });
    }
  };

  // Handle download document
  const handleDownload = (url: string) => {
    window.open(url, "_blank");
  };

  // Timeline step styling
  const timelineStepStyle = (status: string) => {
    switch (status) {
      case "validee":
        return "bg-primary text-white border-primary";
      case "en_traitement":
        return "bg-secondary text-white border-secondary";
      case "en_attente":
        return "bg-blue-400 text-white border-blue-400";
      case "rejetee":
        return "bg-red-500 text-white border-red-500";
      default:
        return "bg-muted text-muted-foreground border-muted-foreground/50";
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        type: "spring", 
        stiffness: 100,
        damping: 10,
        staggerChildren: 0.1
      } 
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.5, ease: "easeInOut" }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, type: "spring", stiffness: 120 }
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 25px rgba(0, 87, 160, 0.15)",
      transition: { duration: 0.3 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, type: "spring", stiffness: 100 }
    }
  };

  const waveVariants = {
    animate: {
      opacity: [0.05, 0.15, 0.05],
      scale: [1, 1.3, 1],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const iconVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.15, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
    hover: {
      scale: 1.3,
      rotate: 15,
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  };

  const buttonHover = {
    hover: {
      scale: 1.05,
      backgroundColor: "rgba(0, 87, 160, 0.9)",
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98
    }
  };

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => router.push("/etudiant/mes-demandes"), 300);
  };

  if (loading || !request) {
    return (
      <div className="pt-24 pb-16 bg-[#FFFFFF]">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    );
  }

  const currentValidation = request.validations.find((v) => v.decision === "en_attente")?.role || "Aucun";
  const nextValidation = request.validations.length > 0 ? request.validations[request.validations.length - 1].role : "Aucun";
  const signedDocument = request.pieces_jointes.find((p) => p.type === "signed");

  return (
    <div className="pt-24 pb-16 bg-[#FFFFFF] relative overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5 opacity-10"
        variants={waveVariants}
        animate="animate"
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl"
        variants={waveVariants}
        animate="animate"
        transition={{ delay: 0.5 }}
      />

      <div className="container px-4 md:px-6 max-w-7xl mx-auto relative z-10">
        <AnimatePresence>
          {!isExiting && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              <motion.div 
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                variants={itemVariants}
              >
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      className="text-primary hover:bg-primary/10 rounded-full px-4 py-2 shadow-sm"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Retour
                    </Button>
                  </motion.div>
                  <div>
                    <motion.h1 
                      className="text-3xl font-bold text-primary"
                      initial={{ x: -20 }}
                      animate={{ x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {request.titre}
                    </motion.h1>
                    <motion.p 
                      className="text-muted-foreground mt-1"
                      initial={{ x: -20 }}
                      animate={{ x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      Référence: {request.id} | Soumise le: {new Date(request.date_soumission).toLocaleDateString()}
                    </motion.p>
                  </div>
                </div>
                <motion.div 
                  variants={iconVariants} 
                  initial="initial" 
                  animate="animate" 
                  whileHover="hover"
                  className="mt-2 md:mt-0"
                >
                  <Badge className={`${statusConfig[request.statut as keyof typeof statusConfig].color} rounded-full px-4 py-1.5 text-sm shadow-md`}>
                    {statusConfig[request.statut as keyof typeof statusConfig].label}
                  </Badge>
                </motion.div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                  className="lg:col-span-2 space-y-6"
                  variants={cardVariants}
                >
                  <motion.div variants={itemVariants} whileHover="hover">
                    <Card className="bg-white/90 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-primary">Détails de la demande</CardTitle>
                        <CardDescription className="text-muted-foreground">Informations relatives à votre demande</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Type de demande</p>
                            <p className="font-medium">{request.type}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Statut</p>
                            <p className={`font-medium ${statusConfig[request.statut as keyof typeof statusConfig].textColor}`}>
                              {statusConfig[request.statut as keyof typeof statusConfig].label}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Niveau</p>
                            <p className="font-medium">{request.license_level || "Non spécifié"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Département</p>
                            <p className="font-medium">{request.departement.nom}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Méthode de livraison</p>
                            <p className="font-medium">{request.delivery_method === "email" ? "Par e-mail" : "En personne"}</p>
                          </div>
                          {request.statut === "rejetee" && request.validations[0]?.motif && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Motif de rejet</p>
                              <p className="font-medium text-red-500">{request.validations[0].motif}</p>
                            </div>
                          )}
                        </div>

                        <Separator className="bg-primary/20" />

                        <div className="space-y-3">
                          <h3 className="font-medium text-foreground">Documents joints</h3>
                          {request.pieces_jointes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucun document joint.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {request.pieces_jointes.map((doc) => (
                                <motion.div
                                  key={doc.id}
                                  className="flex justify-between items-center p-3 rounded-lg border border-primary/20 hover:bg-primary/5"
                                  whileHover={{ scale: 1.02 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary/60" />
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{doc.nom_fichier}</p>
                                      <p className="text-xs text-muted-foreground capitalize">
                                        {doc.type === "student_upload"
                                          ? "Document étudiant"
                                          : doc.type === "processed"
                                          ? "Document traité"
                                          : "Document signé"}
                                      </p>
                                    </div>
                                  </div>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDownload(doc.url)}
                                      className="text-primary hover:bg-primary/10 rounded-full"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <Tabs defaultValue="timeline" className="w-full">
                    <motion.div variants={itemVariants}>
                      <TabsList className="grid grid-cols-2 bg-white/90 backdrop-blur-sm border border-primary/20 rounded-full shadow-sm">
                        <TabsTrigger 
                          value="timeline" 
                          className="gap-2 rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        >
                          <Clock className="h-4 w-4" />
                          Suivi du traitement
                        </TabsTrigger>
                        <TabsTrigger 
                          value="messages" 
                          className="gap-2 rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Messages ({messages.length})
                        </TabsTrigger>
                      </TabsList>
                    </motion.div>

                    <TabsContent value="timeline" className="mt-6">
                      <motion.div variants={itemVariants}>
                        <Card className="bg-white/90 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                              <Clock className="h-5 w-5 text-primary" />
                              Chronologie
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">Suivez en temps réel l'évolution de votre demande</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="relative ml-3 space-y-8 mt-2 mb-4">
                              <div className="absolute left-[15px] top-[10px] bottom-4 w-0.5 bg-primary/20" />
                              {request.logs_suivi.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>
                              ) : (
                                request.logs_suivi.map((step, index) => {
                                  const StatusIcon = statusConfig[step.etat as keyof typeof statusConfig]?.icon || Clock;
                                  return (
                                    <motion.div
                                      key={step.id}
                                      className="relative pl-10"
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.1 }}
                                    >
                                      <motion.div
                                        className={`absolute left-[7px] top-[10px] h-[18px] w-[18px] rounded-full border-2 ${timelineStepStyle(step.etat)} flex items-center justify-center z-10 shadow-sm`}
                                        variants={iconVariants}
                                        initial="initial"
                                        animate="animate"
                                        whileHover="hover"
                                      >
                                        <StatusIcon className="h-[12px] w-[12px]" />
                                      </motion.div>
                                      <div>
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                                          <h4 className="font-medium text-foreground">
                                            {step.message || `État: ${statusConfig[step.etat as keyof typeof statusConfig]?.label || step.etat}`}
                                          </h4>
                                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(step.date_action).toLocaleString()}
                                          </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          Responsable: {step.users.nom}
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="messages" className="mt-6 space-y-4">
                      <motion.div variants={itemVariants}>
                        <Card className="bg-white/90 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                              <MessageSquare className="h-5 w-5 text-primary" />
                              Messages
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">Communication avec le service administratif</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6 mb-4">
                              {messages.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Aucun message pour cette demande.</p>
                              ) : (
                                messages.map((message) => (
                                  <motion.div
                                    key={message.id}
                                    className={`flex ${message.is_admin ? "justify-start" : "justify-end"}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <div
                                      className={`flex max-w-[80%] ${message.is_admin ? "flex-row" : "flex-row-reverse"} gap-3`}
                                    >
                                      <Avatar className="h-8 w-8 border border-primary/20">
                                        <AvatarImage src={message.users.avatar_url || ""} alt={message.users.nom} />
                                        <AvatarFallback className={message.is_admin ? "bg-primary/10" : "bg-secondary/10 text-foreground"}>
                                          {message.users.nom.substring(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div
                                          className={`rounded-lg p-3 ${message.is_admin ? "bg-muted text-foreground" : "bg-primary text-white"} shadow-sm`}
                                        >
                                          <div className="mb-1 text-xs font-medium">{message.users.nom}</div>
                                          <div className="text-sm">{message.content}</div>
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                          {new Date(message.created_at).toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))
                              )}
                            </div>
                            <div className="flex gap-2 mt-6">
                              <Textarea
                                placeholder="Tapez votre message ici..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="resize-none bg-white/90 backdrop-blur-sm border border-primary/20 focus:border-primary focus:ring-primary/30 rounded-xl text-foreground shadow-sm"
                              />
                              <motion.div
                                variants={buttonHover}
                                whileHover="hover"
                                whileTap="tap"
                              >
                                <Button
                                  className="gap-2 bg-primary hover:bg-primary/90 rounded-xl shadow-md"
                                  onClick={handleSendMessage}
                                  disabled={!newMessage.trim() || isSendingMessage}
                                >
                                  {isSendingMessage ? (
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
                                      Envoyer
                                    </>
                                  )}
                                </Button>
                              </motion.div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                </motion.div>

                <motion.div
                  className="space-y-6"
                  variants={cardVariants}
                >
                  <motion.div variants={itemVariants}>
                    <Card className="bg-white/90 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-bold text-primary">Résumé du traitement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-muted-foreground">État actuel</span>
                            <Badge className={`${statusConfig[request.statut as keyof typeof statusConfig].color} rounded-full shadow-sm`}>
                              {statusConfig[request.statut as keyof typeof statusConfig].label}
                            </Badge>
                          </div>
                          <Separator className="bg-primary/20" />
                          <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-muted-foreground">En attente de</span>
                            <span className="font-medium text-foreground">{currentValidation}</span>
                          </div>
                          <Separator className="bg-primary/20" />
                          <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-muted-foreground">Prochaine étape</span>
                            <span className="font-medium text-foreground">{nextValidation}</span>
                          </div>
                          <Separator className="bg-primary/20" />
                          <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-muted-foreground">Date de soumission</span>
                            <span className="font-medium text-foreground">
                              {new Date(request.date_soumission).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="bg-white/90 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-bold text-primary">Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2 border border-primary/20 text-primary hover:bg-primary/10 rounded-xl shadow-sm"
                            onClick={() => router.push(`/etudiant/nouvelle-demande?copy=${request.id}`)}
                          >
                            <MessageSquare className="h-4 w-4" />
                            Nouvelle demande similaire
                          </Button>
                        </motion.div>
                        {(request.statut === "en_attente" || request.statut === "en_traitement") && (
                          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="outline"
                              className="w-full justify-start gap-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl shadow-sm"
                              onClick={handleCancelRequest}
                            >
                              <X className="h-4 w-4" />
                              Annuler la demande
                            </Button>
                          </motion.div>
                        )}
                        {request.statut === "validee" && signedDocument && (
                          <motion.div 
                            variants={buttonHover}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <Button
                              className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 rounded-xl shadow-md"
                              onClick={() => handleDownload(signedDocument.url)}
                            >
                              <Download className="h-4 w-4" />
                              Télécharger le document
                            </Button>
                          </motion.div>
                        )}
                        {request.statut === "rejetee" && (
                          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="outline"
                              className="w-full justify-start gap-2 border border-primary/20 text-primary hover:bg-primary/10 rounded-xl shadow-sm"
                              onClick={() => router.push(`/etudiant/nouvelle-demande?copy=${request.id}`)}
                            >
                              <span className="rotate-180 transform">
                                <ArrowLeft className="h-4 w-4" />
                              </span>
                              Soumettre à nouveau
                            </Button>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="bg-white/90 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-bold text-primary">Besoin d'aide ?</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Si vous avez des questions sur votre demande, contactez le service administratif du centre :
                        </p>
                        <p className="text-sm text-foreground">
                          Email: <a href="mailto:centreinfo@uganc.edu.gn" className="text-primary hover:underline">centreinfo@uganc.edu.gn</a>
                        </p>
                        <p className="text-sm text-foreground">
                          Téléphone: +224 623 45 67 89
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
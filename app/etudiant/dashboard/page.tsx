
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FileCheck, 
  Clock, 
  AlertTriangle, 
  FileX, 
  PlusCircle,
  Calendar,
  ArrowUpRight,
  Bell,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { sendEmailAction } from '@/actions/sendEmailAction';

interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface Request {
  id: string;
  titre: string;
  type: string;
  date_soumission: string;
  statut: string;
  nom_complet: string;
  pieces_jointes: { id: string; nom_fichier: string; url: string; type: string }[];
}

interface Notification {
  id: string;
  message: string;
  lue: boolean;
  created_at: string;
}

interface Stats {
  pending: number;
  processing: number;
  approved: number;
  rejected: number;
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ pending: 0, processing: 0, approved: 0, rejected: 0 });
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          router.push("/auth/login");
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, nom, email, role, avatar_url")
          .eq("id", authUser.id)
          .single();

        if (userError) throw userError;
        if (userData.role !== "etudiant") {
          toast({
            title: "Accès non autorisé",
            description: "Ce tableau de bord est réservé aux étudiants.",
            variant: "destructive",
          });
          router.push("/auth/login");
          return;
        }
        setUser(userData);
        fetchStats(userData.id);
        fetchRecentRequests(userData.id);
        fetchNotifications(userData.id);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les informations de l'utilisateur",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router, toast]);

  const fetchStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("demandes")
        .select("statut")
        .eq("etudiant_id", userId);

      if (error) throw error;

      const statsData: Stats = {
        pending: 0,
        processing: 0,
        approved: 0,
        rejected: 0,
      };

      data.forEach((item) => {
        switch (item.statut) {
          case "en_attente":
            statsData.pending++;
            break;
          case "en_traitement":
            statsData.processing++;
            break;
          case "validee":
            statsData.approved++;
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

  const fetchRecentRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("demandes")
        .select(`
          id,
          titre,
          type,
          date_soumission,
          statut,
          nom_complet,
          pieces_jointes(id, nom_fichier, url, type)
        `)
        .eq("etudiant_id", userId)
        .order("date_soumission", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentRequests(data || []);
    } catch (error) {
      console.error("Erreur chargement demandes:", error);
      toast({ title: "Erreur", description: "Impossible de charger les demandes récentes", variant: "destructive" });
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, message, lue, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);

      // Envoyer un e-mail pour chaque nouvelle notification
      for (const notification of data || []) {
        if (!notification.lue && user) {
          const result = await sendEmailAction({
            to: user.email,
            subject: 'Nouvelle notification',
            text: `Vous avez une nouvelle notification : ${notification.message}`,
          });
          if (!result.success) {
            console.error(`Échec envoi e-mail pour notification ${notification.id}:`, result.error);
            toast({
              title: "Avertissement",
              description: "Notification reçue, mais l'e-mail n'a pas été envoyé.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
      toast({ title: "Erreur", description: "Impossible de charger les notifications", variant: "destructive" });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ lue: true })
        .eq("id", notificationId);
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, lue: true } : notif))
      );
      toast({ title: "Succès", description: "Notification marquée comme lue" });
    } catch (error) {
      console.error("Erreur marquage notification:", error);
      toast({ title: "Erreur", description: "Impossible de marquer la notification comme lue", variant: "destructive" });
    }
  };

  type RequestStatus = "en_attente" | "en_traitement" | "validee" | "rejetee";

  const statusConfig: Record<RequestStatus, {
    icon: typeof FileCheck,
    color: string,
    bgColor: string,
    label: string
  }> = {
    en_attente: { 
      icon: AlertTriangle, 
      color: "text-blue-400", 
      bgColor: "bg-blue-400/10",
      label: "En attente" 
    },
    en_traitement: { 
      icon: Clock, 
      color: "text-secondary", 
      bgColor: "bg-secondary/10",
      label: "En traitement" 
    },
    validee: { 
      icon: FileCheck, 
      color: "text-primary", 
      bgColor: "bg-primary/10",
      label: "Approuvée" 
    },
    rejetee: { 
      icon: FileX, 
      color: "text-red-500", 
      bgColor: "bg-red-500/10",
      label: "Rejetée" 
    }
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        type: "spring", 
        stiffness: 120, 
        damping: 14 
      }
    }
  };

  const hoverVariants = {
    hover: { 
      scale: 1.03, 
      boxShadow: "0 10px 25px rgba(0, 87, 160, 0.2)",
      transition: { duration: 0.3, type: "spring", stiffness: 200 } 
    }
  };

  const iconVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.15, 1], 
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } 
    },
    hover: { 
      scale: 1.3, 
      rotate: 15, 
      transition: { duration: 0.4, ease: "easeInOut" } 
    }
  };

  const waveVariants = {
    animate: {
      opacity: [0.05, 0.15, 0.05],
      scale: [1, 1.3, 1],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
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

      <div className="container px-4 md:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url || ""} />
              <AvatarFallback className="text-lg">
                {user.nom.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-primary">Tableau de bord étudiant</h1>
              <p className="text-muted-foreground text-lg mt-2">
                Bienvenue, {user.nom}. Votre espace pour gérer vos démarches.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="gap-2 bg-primary hover:bg-primary/90 text-white"
              asChild
            >
              <Link href="/etudiant/nouvelle-demande">
                <PlusCircle className="h-5 w-5" />
                Nouvelle demande
              </Link>
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-primary/20 text-primary hover:bg-primary/10"
              asChild
            >
              <Link href="/etudiant/profile" className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Mon profil
              </Link>
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-8" onValueChange={setActiveTab}>
          <TabsList className="w-full md:w-auto inline-flex bg-transparent gap-2 p-0">
            {["overview", "requests", "notifications"].map((tab, index) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="relative px-4 py-2 rounded-full text-sm font-medium text-foreground/80
                  data-[state=active]:bg-primary/10 data-[state=active]:text-primary
                  hover:bg-primary/5 hover:text-primary transition-all duration-300"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {tab === "overview" && "Aperçu"}
                  {tab === "requests" && (
                    <span className="flex items-center gap-2">
                      Mes demandes
                      <Badge className="bg-primary/80 hover:bg-primary text-white">
                        {recentRequests.length}
                      </Badge>
                    </span>
                  )}
                  {tab === "notifications" && (
                    <span className="flex items-center gap-2">
                      Notifications
                      <Badge className="bg-primary/80 hover:bg-primary text-white">
                        {notifications.filter(n => !n.lue).length}
                      </Badge>
                    </span>
                  )}
                </motion.div>
                {activeTab === tab && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    layoutId="underline"
                    transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Demandes en cours",
                  value: stats.pending + stats.processing,
                  subtext: `Sur ${stats.pending + stats.processing + stats.approved + stats.rejected} demandes totales`,
                  icon: Clock,
                },
                {
                  title: "Documents validés",
                  value: stats.approved,
                  subtext: "Prêts à télécharger",
                  icon: FileCheck,
                },
                {
                  title: "Taux de rejet",
                  value: `${stats.approved + stats.rejected > 0 ? Math.round((stats.rejected / (stats.approved + stats.rejected)) * 100) : 0}%`,
                  subtext: "Demandes rejetées",
                  icon: FileX,
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={panelVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  transition={{ delay: index * 0.2 }}
                >
                  <div
                    className="bg-white/80 backdrop-blur-md rounded-2xl p-6
                      border border-primary/10 hover:border-primary/30
                      transition-all duration-300 hover:bg-primary/5"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center"
                        variants={iconVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                      >
                        <item.icon className="h-6 w-6 text-primary" />
                      </motion.div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">{item.title}</h3>
                        <div className="text-3xl font-bold text-foreground">{item.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{item.subtext}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-primary/10 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-primary">Demandes récentes</h2>
                  <Button
                    variant="ghost"
                    asChild
                    size="sm"
                    className="text-primary hover:text-primary/80 gap-2"
                  >
                    <Link href="/etudiant/mes-demandes">
                      Voir tout
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-4">
                  {recentRequests.map((request, index) => {
                    const StatusIcon = statusConfig[request.statut as RequestStatus].icon;
                    return (
                      <motion.div
                        key={request.id}
                        className={`flex items-start gap-4 p-4 hover:bg-primary/5 rounded-full ${statusConfig[request.statut as RequestStatus].bgColor}`}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <motion.div
                          className={`rounded-full p-2 ${statusConfig[request.statut as RequestStatus].bgColor}`}
                          variants={iconVariants}
                          initial="initial"
                          animate="animate"
                          whileHover="hover"
                        >
                          <StatusIcon className={`h-5 w-5 ${statusConfig[request.statut as RequestStatus].color}`} />
                        </motion.div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{request.titre}</p>
                            <Badge
                              className={`${
                                request.statut === 'rejetee' ? 'bg-red-500/10 text-red-500' :
                                request.statut === 'validee' ? 'bg-primary/10 text-primary' :
                                request.statut === 'en_traitement' ? 'bg-secondary/10 text-secondary' :
                                'bg-blue-400/10 text-blue-400'
                              }`}
                            >
                              {statusConfig[request.statut as RequestStatus].label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-between">
                            <span>Référence: {request.id}</span>
                            <span>Date: {new Date(request.date_soumission).toLocaleDateString()}</span>
                          </div>
                          {request.statut === 'en_traitement' && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Progression</span>
                                <span>50%</span>
                              </div>
                              <Progress value={50} className="h-1.5 bg-primary/20 [&>div]:bg-primary" />
                            </div>
                          )}
                          {request.statut === 'rejetee' && (
                            <div className="text-sm text-red-500">
                              Motif: {(request as any).motif || "Non spécifié"}
                            </div>
                          )}
                          {request.statut === 'validee' && request.pieces_jointes.find(p => p.type === "signed") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 border-primary/20 text-primary hover:bg-primary/10"
                              asChild
                            >
                              <a href={request.pieces_jointes.find(p => p.type === "signed")!.url} target="_blank" rel="noopener noreferrer">
                                <FileCheck className="h-4 w-4" />
                                Télécharger
                              </a>
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-primary/10 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-primary">Notifications</h2>
                    <motion.div
                      variants={iconVariants}
                      initial="initial"
                      animate="animate"
                      whileHover="hover"
                    >
                      <Bell className="h-6 w-6 text-primary" />
                    </motion.div>
                  </div>
                  <div className="space-y-4">
                    {notifications.slice(0, 2).map(notification => (
                      <motion.div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          notification.lue ? 'bg-transparent border-primary/10' : 'bg-primary/5 border-primary/20'
                        }`}
                        variants={panelVariants}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm text-foreground">{notification.message}</h4>
                          {!notification.lue && (
                            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(notification.created_at).toLocaleString()}</p>
                        {!notification.lue && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-primary hover:text-primary/80"
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            Marquer comme lu
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-primary hover:text-primary/80"
                      asChild
                    >
                      <Link href="/etudiant/notifications">Voir toutes les notifications</Link>
                    </Button>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-primary/10 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-primary">Événements à venir</h2>
                    <motion.div
                      variants={iconVariants}
                      initial="initial"
                      animate="animate"
                      whileHover="hover"
                    >
                      <Calendar className="h-6 w-6 text-primary" />
                    </motion.div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Aucun événement programmé pour le moment.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-primary/10 p-6">
                <h2 className="text-xl font-semibold text-primary mb-4">Mes demandes</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Historique complet de vos demandes administratives
                </p>
                <div className="space-y-6">
                  {recentRequests.map((request, index) => {
                    const StatusIcon = statusConfig[request.statut as RequestStatus].icon;
                    return (
                      <motion.div
                        key={request.id}
                        className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border border-primary/10 hover:bg-primary/5"
                        variants={panelVariants}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <motion.div
                          className={`rounded-full p-3 ${statusConfig[request.statut as RequestStatus].bgColor}`}
                          variants={iconVariants}
                          initial="initial"
                          animate="animate"
                          whileHover="hover"
                        >
                          <StatusIcon className={`h-6 w-6 ${statusConfig[request.statut as RequestStatus].color}`} />
                        </motion.div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-foreground">{request.titre}</h3>
                              <p className="text-sm text-muted-foreground">
                                Référence: {request.id} | Soumis le: {new Date(request.date_soumission).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              className={`${
                                request.statut === 'rejetee' ? 'bg-red-500/10 text-red-500' :
                                request.statut === 'validee' ? 'bg-primary/10 text-primary' :
                                request.statut === 'en_traitement' ? 'bg-secondary/10 text-secondary' :
                                'bg-blue-400/10 text-blue-400'
                              }`}
                            >
                              {statusConfig[request.statut as RequestStatus].label}
                            </Badge>
                          </div>
                          {request.statut === 'en_traitement' && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Progression</span>
                                <span>50%</span>
                              </div>
                              <Progress value={50} className="h-2 bg-primary/20 [&>div]:bg-primary" />
                            </div>
                          )}
                          {request.statut === 'rejetee' && (
                            <div className="text-sm text-red-500">
                              Motif: {(request as any).motif || "Non spécifié"}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 self-end md:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-primary/20 text-primary hover:bg-primary/10"
                            asChild
                          >
                            <Link href={`/etudiant/suivi/${request.id}`}>
                              Détails
                            </Link>
                          </Button>
                          {request.statut === 'validee' && request.pieces_jointes.find(p => p.type === "signed") && (
                            <Button
                              size="sm"
                              className="gap-2 bg-primary hover:bg-primary/90 text-white"
                              asChild
                            >
                              <a href={request.pieces_jointes.find(p => p.type === "signed")!.url} target="_blank" rel="noopener noreferrer">
                                <FileCheck className="h-4 w-4" />
                                Télécharger
                              </a>
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-primary/10 p-6">
                <h2 className="text-xl font-semibold text-primary mb-4">Notifications</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Restez informé sur l'évolution de vos demandes
                </p>
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      className={`flex items-center gap-4 p-2 rounded-full border ${
                        notification.lue ? 'bg-transparent border-primary/10' : 'bg-primary/20 border-primary/20'
                      }`}
                      variants={panelVariants}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <motion.div
                        className={`rounded-full p-2 ${notification.lue ? 'bg-muted/5' : 'bg-primary/10'}`}
                        variants={iconVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                      >
                        <Bell className={`h-4 w-4 ${notification.lue ? 'text-muted-foreground' : 'text-primary'}`} />
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm text-foreground">{notification.message}</h4>
                          {!notification.lue && (
                            <Badge
                              className="bg-primary/10 text-primary border-primary/20"
                            >
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
                          {!notification.lue && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-primary hover:text-primary/80"
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              Marquer comme lu
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
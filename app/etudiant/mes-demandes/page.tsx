"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  FileCheck,
  FileX,
  Loader2,
  Search,
  SlidersHorizontal,
  PlusCircle,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Request {
  id: string;
  titre: string;
  type: string;
  date_soumission: string;
  statut: string;
  nom_complet: string;
  license_level: string | null;
  delivery_method: string;
  departement: { id: string; nom: string };
  pieces_jointes: { id: string; nom_fichier: string; url: string; type: string }[];
  validations: { id: string; motif: string | null }[];
}

interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
}

export default function MyRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "date_soumission", direction: "desc" });
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 9;

  // Status configuration
  const statusConfig = {
    en_attente: {
      label: "En attente",
      color: "bg-blue-400/10 text-blue-400 hover:bg-blue-400/20",
      icon: SlidersHorizontal,
    },
    en_traitement: {
      label: "En traitement",
      color: "bg-secondary/10 text-secondary hover:bg-secondary/20",
      icon: Loader2,
    },
    validee: {
      label: "Validée",
      color: "bg-primary/10 text-primary hover:bg-primary/20",
      icon: FileCheck,
    },
    rejetee: {
      label: "Rejetée",
      color: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
      icon: FileX,
    },
  };

  // Fetch user and requests
  useEffect(() => {
    async function fetchUserAndRequests() {
      try {
        setLoading(true);
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
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
          .select("id, nom, email, role")
          .eq("id", authUser.id)
          .single();

        if (userError) throw userError;
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
        await fetchRequests(userData.id);
      } catch (error: any) {
        console.error("Erreur chargement utilisateur:", error.message || error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les informations utilisateur.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchUserAndRequests();
  }, [router, toast]);

  const fetchRequests = async (userId: string) => {
    try {
      console.log("Fetching requests for user:", userId, "page:", page);
      const { data, error } = await supabase
        .from("demandes")
        .select(`
          id,
          titre,
          type,
          date_soumission,
          statut,
          nom_complet,
          license_level,
          delivery_method,
          departement:departement_id(id, nom),
          pieces_jointes(id, nom_fichier, url, type),
          validations(id, motif)
        `)
        .eq("etudiant_id", userId)
        .order(sortConfig.key, { ascending: sortConfig.direction === "asc" })
        .range((page - 1) * perPage, page * perPage - 1);

      if (error) throw error;
      console.log("Fetched requests:", data);
      setRequests(data || []);
    } catch (error: any) {
      console.error("Erreur chargement demandes:", error.message || error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes.",
        variant: "destructive",
      });
    }
  };

  // Refetch requests when filters or page change
  useEffect(() => {
    if (user) {
      fetchRequests(user.id);
    }
  }, [user, sortConfig, page]);

  // Filter and sort declarations
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatusFilter = statusFilter === "all" || request.statut === statusFilter;
    return matchesSearch && matchesStatusFilter;
  });

  // Handle sorting
  const requestSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Handle download
  const handleDownload = (url: string, id: string) => {
    console.log("Downloading document for request:", id);
    setIsDownloading(id);
    window.open(url, "_blank");
    setTimeout(() => setIsDownloading(null), 1500);
  };

  // Handle cancel request
  const handleCancelRequest = async (requestId: string) => {
    try {
      console.log("Canceling request:", requestId);
      const { error } = await supabase
        .from("demandes")
        .update({ statut: "rejetee", date_mise_a_jour: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;

      const { error: logError } = await supabase.from("logs_suivi").insert({
        demande_id: requestId,
        etat: "rejetee",
        user_id: user?.id,
        message: `Demande annulée par l'étudiant ${user?.nom}`,
        date_action: new Date().toISOString(),
      });
      if (logError) throw logError;

      toast({
        title: "Succès",
        description: "La demande a été annulée avec succès.",
      });
      setPage(1); // Reset to page 1 to ensure refresh
      fetchRequests(user!.id);
    } catch (error: any) {
      console.error("Erreur annulation demande:", error.message || error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la demande.",
        variant: "destructive",
      });
    }
  };

  // Handle delete request
  const handleDeleteRequest = async (requestId: string) => {
    if (!user) {
      console.error("No user logged in");
      return;
    }

    setIsDeleting(requestId);
    try {
      console.log("Deleting request:", requestId, "for user:", user.id);

      // Log deletion in logs_suivi
      const { error: logError } = await supabase.from("logs_suivi").insert({
        demande_id: requestId,
        etat: "supprimee",
        user_id: user.id,
        message: `Demande supprimée par l'étudiant ${user.nom}`,
        date_action: new Date().toISOString(),
      });
      if (logError) {
        console.error("Log error:", logError);
        throw logError;
      }
      console.log("Logged deletion to logs_suivi");

      // Delete the request
      const { error: deleteError, data } = await supabase
        .from("demandes")
        .delete()
        .eq("id", requestId)
        .eq("etudiant_id", user.id);
      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }
      console.log("Delete response:", data);

      // Verify deletion
      const { data: checkData, error: checkError } = await supabase
        .from("demandes")
        .select("id")
        .eq("id", requestId)
        .single();
      if (checkError && checkError.code !== "PGRST116") {
        console.error("Check error:", checkError);
        throw checkError;
      }
      if (checkData) {
        console.error("Request still exists after deletion:", checkData);
        throw new Error("Request was not deleted");
      }
      console.log("Verified request deleted");

      toast({
        title: "Succès",
        description: "La demande a été supprimée avec succès.",
      });
      setPage(1); // Reset to page 1 to ensure refresh
      await fetchRequests(user.id);
    } catch (error: any) {
      console.error("Erreur suppression demande:", error.message || error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la demande.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    hover: {
      scale: 1.03,
      boxShadow: "0 10px 25px rgba(0, 87, 160, 0.15)",
      transition: { duration: 0.3 },
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

  const waveVariants = {
    animate: {
      opacity: [0.05, 0.15, 0.05],
      scale: [1, 1.3, 1],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const buttonHover = {
    hover: {
      scale: 1.05,
      backgroundColor: "rgba(0, 87, 160, 0.9)",
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.98,
    },
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-12 w-12 border-b-2 border-primary"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 bg-[#FFFFFF] relative overflow-hidden">
      {/* Background animated elements */}
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
        {/* Header section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-12"
        >
          <motion.h1
            className="text-4xl font-bold tracking-tight text-primary"
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Mes demandes
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-lg mt-2"
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.3 }}
          >
            Consultez et suivez l'état de toutes vos démarches administratives
          </motion.p>
        </motion.div>

        {/* Filters and search section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <motion.div
              className="relative flex-1"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
              <Input
                placeholder="Rechercher par titre, type ou référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/90 backdrop-blur-sm border-primary/20 focus:border-primary focus:ring-primary/30 rounded-full h-12 text-sm text-foreground shadow-sm transition-all duration-300"
              />
            </motion.div>

            <div className="flex gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px] bg-white/90 backdrop-blur-sm border-primary/20 rounded-full h-12 text-sm text-foreground shadow-sm">
                    <SlidersHorizontal className="mr-2 h-5 w-5 text-primary" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-md border-primary/20 text-foreground shadow-lg">
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="en_traitement">En traitement</SelectItem>
                    <SelectItem value="validee">Validée</SelectItem>
                    <SelectItem value="rejetee">Rejetée</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                variants={buttonHover}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-white rounded-full h-12 gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Link href="/etudiant/nouvelle-demande">
                    <PlusCircle className="h-5 w-5" />
                    Nouvelle demande
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Requests grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {filteredRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16 text-muted-foreground text-lg bg-white/80 backdrop-blur-sm rounded-xl shadow-sm"
            >
              Aucune demande trouvée. Créez-en une avec le bouton "Nouvelle demande".
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((request, index) => {
                const StatusIcon = statusConfig[request.statut as keyof typeof statusConfig].icon;
                const signedDocument = request.pieces_jointes.find((p) => p.type === "signed");

                return (
                  <motion.div
                    key={request.id}
                    variants={itemVariants}
                    whileHover="hover"
                    transition={{ delay: index * 0.05 }}
                    className="h-full"
                  >
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:bg-primary/5 h-full flex flex-col shadow-sm hover:shadow-md">
                      {/* Clickable area for navigation */}
                      <Link href={`/etudiant/suivi/${request.id}`} className="flex-grow">
                        <div className="flex flex-col gap-4">
                          {/* Status header */}
                          <div className="flex items-center justify-between">
                            <motion.div
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${statusConfig[request.statut as keyof typeof statusConfig].color}`}
                              variants={iconVariants}
                              initial="initial"
                              animate="animate"
                              whileHover="hover"
                            >
                              <StatusIcon className="h-6 w-6" />
                            </motion.div>
                            <Badge
                              className={`${statusConfig[request.statut as keyof typeof statusConfig].color} rounded-full shadow-sm`}
                            >
                              {statusConfig[request.statut as keyof typeof statusConfig].label}
                            </Badge>
                          </div>

                          {/* Request details */}
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                              {request.titre}
                            </h3>
                            <p className="text-sm text-muted-foreground">Référence: {request.id}</p>
                            <p className="text-sm text-muted-foreground hover:text-primary transition-colors">
                              Date: {new Date(request.date_soumission).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Département: {request.departement.nom}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Niveau: {request.license_level || "Non spécifié"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Livraison: {request.delivery_method === "email" ? "Par e-mail" : "En personne"}
                            </p>
                            {request.validations.length > 0 && request.statut === "rejetee" && (
                              <p className="text-sm text-red-500 mt-1">
                                Motif: {request.validations[0].motif || "Non spécifié"}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Action buttons (outside Link to prevent navigation) */}
                      <div className="flex justify-end gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Détails de la demande"
                            className="text-primary hover:bg-primary/10 rounded-full"
                            onClick={() => router.push(`/etudiant/suivi/${request.id}`)}
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                        </motion.div>

                        {signedDocument && request.statut === "validee" && (
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Télécharger le document"
                              className="text-primary hover:bg-primary/10 rounded-full"
                              onClick={() => handleDownload(signedDocument.url, request.id)}
                              disabled={isDownloading === request.id}
                            >
                              {isDownloading === request.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Download className="h-5 w-5" />
                              )}
                            </Button>
                          </motion.div>
                        )}

                        {(request.statut === "validee" || request.statut === "rejetee") && (
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Supprimer la demande"
                              className="text-red-500 hover:bg-red-500/10 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteRequest(request.id);
                              }}
                              disabled={isDeleting === request.id}
                            >
                              {isDeleting === request.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </Button>
                          </motion.div>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-primary hover:bg-primary/10 rounded-full"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-5 w-5"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                              </Button>
                            </motion.div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-white/95 backdrop-blur-md border-primary/20 text-foreground shadow-lg"
                          >
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => router.push(`/etudiant/suivi/${request.id}`)}
                              className="text-foreground hover:text-primary focus:bg-primary/5"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            {signedDocument && request.statut === "validee" && (
                              <DropdownMenuItem
                                onClick={() => handleDownload(signedDocument.url, request.id)}
                                disabled={isDownloading === request.id}
                                className="text-foreground hover:text-primary focus:bg-primary/5"
                              >
                                {isDownloading === request.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4 mr-2" />
                                )}
                                Télécharger
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-primary/10" />
                            {request.statut !== "validee" && request.statut !== "rejetee" && (
                              <DropdownMenuItem
                                onClick={() => handleCancelRequest(request.id)}
                                className="text-red-500 focus:text-red-600 focus:bg-red-500/5"
                              >
                                <FileX className="h-4 w-4 mr-2" />
                                Annuler la demande
                              </DropdownMenuItem>
                            )}
                            {(request.statut === "validee" || request.statut === "rejetee") && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteRequest(request.id);
                                }}
                                disabled={isDeleting === request.id}
                                className="text-red-500 focus:text-red-600 focus:bg-red-500/5"
                              >
                                {isDeleting === request.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Supprimer la demande
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {filteredRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center gap-4 mt-12"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="border-primary/20 text-primary hover:bg-primary/10 rounded-full px-6 h-10"
                >
                  Précédent
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  disabled={requests.length < perPage}
                  onClick={() => setPage(page + 1)}
                  className="border-primary/20 text-primary hover:bg-primary/10 rounded-full px-6 h-10"
                >
                  Suivant
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
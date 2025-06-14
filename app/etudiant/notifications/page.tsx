"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Check, MailOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erreur",
          description: "Utilisateur non authentifié",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));

      toast({
        title: "Succès",
        description: "Notification marquée comme lue",
        className: "bg-primary/10 text-primary border-primary/20 dark:bg-gray-800 dark:text-white dark:border-gray-700",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer la notification comme lue",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications(notifications.filter(n => n.id !== id));

      toast({
        title: "Succès",
        description: "Notification supprimée",
        className: "bg-primary/10 text-primary border-primary/20 dark:bg-gray-800 dark:text-white dark:border-gray-700",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification",
        variant: "destructive",
      });
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-primary/10 dark:bg-primary/20",
          text: "text-primary dark:text-white",
          border: "border-primary/20 dark:border-primary/30",
          badge: "bg-primary/20 text-primary dark:bg-primary/30 dark:text-white border-primary/30 dark:border-primary/40",
        };
      case "warning":
        return {
          bg: "bg-secondary/10 dark:bg-secondary/20",
          text: "text-secondary dark:text-white",
          border: "border-secondary/20 dark:border-secondary/30",
          badge: "bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-white border-secondary/30 dark:border-secondary/40",
        };
      case "error":
        return {
          bg: "bg-red-500/10 dark:bg-red-500/20",
          text: "text-red-500 dark:text-white",
          border: "border-red-500/20 dark:border-red-500/30",
          badge: "bg-red-500/20 text-red-500 dark:bg-red-500/30 dark:text-white border-red-500/30 dark:border-red-500/40",
        };
      default: // info
        return {
          bg: "bg-primary/10 dark:bg-primary/20",
          text: "text-primary dark:text-white",
          border: "border-primary/20 dark:border-primary/30",
          badge: "bg-primary/20 text-primary dark:bg-primary/30 dark:text-white border-primary/30 dark:border-primary/40",
        };
    }
  };

  // Animation variants
  const beamVariants = {
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

  return (
    <div className="pt-24 pb-16 bg-background dark:bg-gray-900 relative overflow-hidden">
      {/* Holographic background waves */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5 opacity-10 dark:from-gray-800/50 dark:to-gray-700/50"
        variants={waveVariants}
        animate="animate"
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl dark:bg-gray-800/30"
        variants={waveVariants}
        animate="animate"
        transition={{ delay: 0.5 }}
      />

      <div className="container px-4 md:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary dark:text-white">Notifications</h1>
            <p className="text-muted-foreground text-lg mt-2 dark:text-gray-300">
              Restez informé de vos démarches et mises à jour importantes
            </p>
          </div>
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Badge
              className="bg-primary/80 text-white hover:bg-primary dark:bg-primary/60 dark:text-white dark:hover:bg-primary/70 rounded-full text-sm px-3 py-1"
            >
              {notifications.filter(n => !n.read).length} non lues
            </Badge>
            <Button
              className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-gray-700 gap-2 rounded-full"
              onClick={() => {
                notifications
                  .filter(n => !n.read)
                  .forEach(n => markAsRead(n.id));
              }}
            >
              <MailOpen className="h-5 w-5" />
              Tout marquer comme lu
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border border-primary/10 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                variants={iconVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                <Bell className="h-6 w-6 text-primary dark:text-white" />
              </motion.div>
              <h2 className="text-xl font-semibold text-primary dark:text-white">Centre de notifications</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 dark:text-gray-300">
              Toutes vos alertes et mises à jour système
            </p>
            {loading ? (
              <motion.div
                className="flex items-center justify-center py-12"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <div className="h-10 w-10 rounded-full border-4 border-primary/20 dark:border-gray-600 border-t-primary dark:border-t-white"></div>
              </motion.div>
            ) : notifications.length === 0 ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                >
                  <Bell className="h-16 w-16 text-primary/60 dark:text-gray-400 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-lg font-medium text-foreground dark:text-white">Aucune notification</h3>
                <p className="text-muted-foreground dark:text-gray-300">
                  Vous n'avez pas encore reçu de notifications
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification, index) => {
                  const styles = getNotificationStyle(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      variants={beamVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: index * 0.1 }}
                    >
                      <div
                        className={`p-4 rounded-xl border transition-all duration-300
                          ${notification.read ? "bg-transparent border-primary/10 dark:border-gray-700 hover:bg-primary/5 dark:hover:bg-gray-700/50" : 
                          `${styles.bg} ${styles.border} hover:bg-primary/5 dark:hover:bg-gray-700/50`}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-foreground dark:text-white">{notification.title}</h4>
                              {!notification.read && (
                                <Badge
                                  className={`${styles.badge} rounded-full`}
                                >
                                  Nouveau
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground dark:text-gray-300">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 dark:text-gray-300">
                              {new Date(notification.created_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <motion.div variants={iconVariants} whileHover="hover">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-8 text-primary dark:text-white hover:bg-primary/10 dark:hover:bg-gray-700 rounded-full"
                                >
                                  <Check className="h-5 w-5" />
                                </Button>
                              </motion.div>
                            )}
                            <motion.div variants={iconVariants} whileHover="hover">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-8 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-full"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && (
                        <Separator className="my-4 bg-primary/10 dark:bg-gray-700" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
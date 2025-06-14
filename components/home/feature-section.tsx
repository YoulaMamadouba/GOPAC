"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, Clock, Bell, FileCheck, 
  Users, Lock, BarChart3, MessageSquare,
  ArrowRightCircle
} from 'lucide-react';

interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  learnMorePath: string;
  iconColor: string;
  cardColor: string;
}

const features: Feature[] = [
  {
    title: "Suivi en temps réel",
    description: "Visualisation en direct de l'avancement de vos démarches administratives.",
    icon: Clock,
    learnMorePath: "/features/realtime-tracking",
    iconColor: "bg-[#5D8BF4]",
    cardColor: "bg-[#F6F9FF]"
  },
  {
    title: "Notifications",
    description: "Alertes personnalisées pour chaque étape de vos procédures.",
    icon: Bell,
    learnMorePath: "/features/notifications",
    iconColor: "bg-[#FFB344]",
    cardColor: "bg-[#FFF9F0]"
  },
  {
    title: "Formulaires intelligents",
    description: "Documents pré-remplis et champs adaptatifs pour gagner du temps.",
    icon: ClipboardList,
    learnMorePath: "/features/dynamic-forms",
    iconColor: "bg-[#6BCB77]",
    cardColor: "bg-[#F6FFF7]"
  },
  {
    title: "Signatures électroniques",
    description: "Validation sécurisée sans impression ni scan.",
    icon: FileCheck,
    learnMorePath: "/features/electronic-signatures",
    iconColor: "bg-[#FF6B6B]",
    cardColor: "bg-[#FFF6F6]"
  },
  {
    title: "Gestion des accès",
    description: "Permissions différenciées selon votre profil utilisateur.",
    icon: Users,
    learnMorePath: "/features/role-management",
    iconColor: "bg-[#9772FB]",
    cardColor: "bg-[#FBF9FF]"
  },
  {
    title: "Sécurité avancée",
    description: "Protection maximale de vos données personnelles.",
    icon: Lock,
    learnMorePath: "/features/security",
    iconColor: "bg-[#5FD3F3]",
    cardColor: "bg-[#F6FDFF]"
  },
  {
    title: "Analytiques",
    description: "Tableaux de bord pour suivre vos demandes.",
    icon: BarChart3,
    learnMorePath: "/features/statistics",
    iconColor: "bg-[#FF9F45]",
    cardColor: "bg-[#FFF9F3]"
  },
  {
    title: "Messagerie unifiée",
    description: "Échange direct avec l'administration.",
    icon: MessageSquare,
    learnMorePath: "/features/messaging",
    iconColor: "bg-[#A85CF9]",
    cardColor: "bg-[#FCFAFF]"
  }
];

const FeatureSection: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 40 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const iconVariants = {
    hover: {
      rotate: [0, -5, 5, 0],
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <div className="relative py-16 md:py-20 bg-white dark:bg-gray-900">
      <div className="container px-4 md:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            className="text-3xl md:text-5xl font-bold text-[#0057A0] dark:text-blue-400"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Les fonctionnalités GOPAC
          </motion.h2>
          
          <motion.p
            className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mt-4 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Découvrez comment nous simplifions vos démarches administratives
          </motion.p>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={`feature-${index}`}
                variants={cardVariants}
                whileHover="hover"
                className="group"
              >
                <motion.div
                  className={`h-full p-6 rounded-xl ${feature.cardColor} dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative`}
                >
                  <div className="relative z-10">
                    <motion.div
                      variants={iconVariants}
                      className={`w-14 h-14 rounded-lg ${feature.iconColor} flex items-center justify-center mb-5 shadow-md`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </motion.div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                      
                      <motion.div
                        className="flex items-center gap-2 text-sm font-medium text-[#0057A0] dark:text-blue-400 cursor-pointer mt-3"
                        whileHover={{ x: 3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span>En savoir plus</span>
                        <motion.div
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRightCircle className="h-4 w-4" />
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureSection;
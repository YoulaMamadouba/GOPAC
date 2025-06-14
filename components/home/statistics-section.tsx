"use client";

import { motion } from 'framer-motion';
import { 
  FileCheck, 
  Clock, 
  Users, 
  CheckCircle2 
} from 'lucide-react';

const goals = [
  {
    title: "Tout en ligne",
    value: "100% numérique",
    icon: FileCheck,
    description: "Des démarches simplifiées avec une plateforme digitale.",
    color: "text-primary",
  },
  {
    title: "Réponse rapide",
    value: "< 24h",
    icon: Clock,
    description: "Traitement express pour une expérience fluide.",
    color: "text-secondary",
  },
  {
    title: "Pour tous",
    value: "10,000+ utilisateurs",
    icon: Users,
    description: "Unir une vaste communauté étudiante.",
    color: "text-primary",
  },
  {
    title: "Toujours fiable",
    value: "99.8% uptime",
    icon: CheckCircle2,
    description: "Une plateforme stable à chaque instant.",
    color: "text-secondary",
  },
];

export default function GoalsSection() {
  // Staggered smooth glide
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const orbVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        type: "spring", 
        stiffness: 120, 
        damping: 14,
        mass: 0.5 
      }
    },
  };

  // Hover with gentle glow
  const hoverVariants = {
    hover: { 
      scale: 1.05, 
      boxShadow: "0 8px 20px rgba(0, 87, 160, 0.2)",
      transition: { duration: 0.3, type: "spring", stiffness: 200 } 
    },
  };

  // Icon gentle pulse
  const iconVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.1, 1], 
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } 
    },
    hover: { 
      scale: 1.2, 
      rotate: 15, 
      transition: { duration: 0.4, ease: "easeInOut" } 
    },
  };

  // Background wave animation
  const waveVariants = {
    animate: {
      opacity: [0.1, 0.3, 0.1],
      scale: [1, 1.2, 1],
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
    },
  };

  return (
    <section className="relative py-20 bg-background overflow-hidden">
      {/* Subtle background waves */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5 opacity-10"
        variants={waveVariants}
        animate="animate"
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl"
        variants={waveVariants}
        animate="animate"
        transition={{ delay: 0.5 }}
      />

      <div className="container px-4 md:px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <motion.h2
            className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Nos objectifs
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Une vision claire pour une plateforme d’avenir
          </motion.p>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {goals.map((goal, index) => (
            <motion.div
              key={index}
              className="relative flex flex-col items-center"
              variants={orbVariants}
              whileHover="hover"
            >
              <div
                className={`
                  w-40 h-40 rounded-full 
                  bg-gradient-to-br ${index % 2 === 0 ? 'from-primary/10 to-white' : 'from-secondary/10 to-white'}
                  flex items-center justify-center 
                  transition-all duration-300
                  hover:shadow-[0_8px_20px_rgba(0,87,160,0.2)]
                `}
              >
                <motion.div
                  className={`
                    w-16 h-16 rounded-full 
                    ${index % 2 === 0 ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}
                    flex items-center justify-center
                    transition-colors duration-300
                    hover:${index % 2 === 0 ? 'bg-primary/30' : 'bg-secondary/30'}
                  `}
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                >
                  <goal.icon className={`h-8 w-8 ${goal.color}`} />
                </motion.div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mt-4 text-center">{goal.title}</h3>
              <div className="text-xl font-bold text-foreground mt-1">{goal.value}</div>
              <p className="text-sm text-muted-foreground mt-2 text-center max-w-[180px]">{goal.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
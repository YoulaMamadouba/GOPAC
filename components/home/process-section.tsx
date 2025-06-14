"use client";

import { motion } from 'framer-motion';
import { 
  PenLine, 
  CheckCircle2, 
  FileSignature, 
  Download,
  ArrowRight
} from 'lucide-react';

const steps = [
  {
    title: "Soumission de la demande",
    description: "L'étudiant remplit le formulaire et joint les documents nécessaires",
    icon: PenLine,
    color: "from-violet-600 to-purple-600",
    shadowColor: "shadow-violet-500/50"
  },
  {
    title: "Traitement administratif",
    description: "L'autorité compétente vérifie et traite la demande",
    icon: CheckCircle2,
    color: "from-emerald-600 to-teal-600",
    shadowColor: "shadow-emerald-500/50"
  },
  {
    title: "Validation finale",
    description: "Le document est validé et signé par les autorités compétentes",
    icon: FileSignature,
    color: "from-amber-600 to-orange-600",
    shadowColor: "shadow-amber-500/50"
  },
  {
    title: "Livraison du document",
    description: "Le document final est mis à disposition pour téléchargement ou retrait",
    icon: Download,
    color: "from-blue-600 to-cyan-600",
    shadowColor: "shadow-blue-500/50"
  }
];

export default function ProcessSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-violet-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.8,
              type: "spring",
              stiffness: 100
            }}
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Processus simplifié
            </h2>
          </motion.div>
          
          <motion.p 
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Un parcours fluide et transparent du début à la fin
          </motion.p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          {/* Enhanced connecting line with gradient and pulse effect */}
          <motion.div 
            className="absolute left-[27px] top-10 bottom-10 w-1 bg-gradient-to-b from-violet-500 via-emerald-500 via-amber-500 to-blue-500 md:left-1/2 md:-ml-0.5 rounded-full opacity-80"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.3 }}
          />
          
          {/* Animated pulse traveling along the line */}
          <motion.div 
            className="absolute left-[27px] w-2 h-2 bg-white rounded-full shadow-lg border-2 border-violet-500 md:left-1/2 md:-ml-1"
            animate={{
              y: [0, 400, 800, 1200],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          
          {steps.map((step, index) => (
            <div key={index} className="relative mb-12 md:mb-20 last:mb-0">
              <motion.div 
                className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 ml-14 md:ml-0' : 'md:pl-12 md:ml-auto ml-14'}`}
                initial={{ 
                  opacity: 0, 
                  x: index % 2 === 0 ? -100 : 100,
                  scale: 0.8
                }}
                whileInView={{ 
                  opacity: 1, 
                  x: 0,
                  scale: 1
                }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.2 * index,
                  type: "spring",
                  stiffness: 100
                }}
              >
                {/* Enhanced icon with multiple effects */}
                <motion.div 
                  className={`absolute left-0 md:left-1/2 ${index % 2 === 0 ? 'md:-translate-x-1/2' : 'md:-translate-x-1/2'} w-14 h-14 rounded-full border-4 border-white dark:border-slate-800 bg-gradient-to-br ${step.color} flex items-center justify-center shadow-2xl ${step.shadowColor} z-10`}
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.3 * index,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ 
                    scale: 1.2, 
                    rotate: 360,
                    transition: { duration: 0.3 }
                  }}
                >
                  <motion.div
                    animate={{ 
                      rotate: 360 
                    }}
                    transition={{ 
                      duration: 20, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                  >
                    <step.icon className="h-6 w-6 text-white drop-shadow-lg" />
                  </motion.div>
                  
                  {/* Pulsing ring effect */}
                  <motion.div
                    className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-60`}
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.8
                    }}
                  />
                </motion.div>
                
                {/* Enhanced card with glass effect */}
                <motion.div 
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/20 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                  whileHover={{ 
                    y: -8,
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="relative overflow-hidden rounded-lg">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                      animate={{
                        translateX: ["translateX(-100%)", "translateX(100%)"]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.5
                      }}
                    />
                    
                    <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
                
                {/* Enhanced arrow with animation */}
                {index < steps.length - 1 && (
                  <motion.div 
                    className={`hidden md:block absolute top-8 ${index % 2 === 0 ? 'right-8' : 'left-8'} z-20`}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.2 }}
                  >
                    <motion.div
                      animate={{
                        x: index % 2 === 0 ? [0, 10, 0] : [0, -10, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <ArrowRight className={`h-6 w-6 text-violet-500 drop-shadow-lg ${index % 2 === 0 ? '' : 'rotate-180'}`} />
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
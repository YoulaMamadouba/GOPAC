"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, FileCheck, BarChart3, Bell } from 'lucide-react';

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  // Staggered animation for text
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.5 } },
  };

  // Floating animation for cards
  const floatVariants = {
    float: {
      y: [-10, 10],
      transition: {
        y: { repeat: Infinity, repeatType: "reverse", duration: 2, ease: "easeInOut" },
      },
    },
  };

  return (
    <section className="relative overflow-hidden bg-background dark:bg-gray-900 pt-24 pb-20 md:pt-32 md:pb-28">
      {/* Animated background shapes */}
      {loaded && (
        <>
          <motion.div
            className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.8, scale: 1 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div
            className="absolute top-40 -left-20 w-72 h-72 bg-secondary/20 rounded-full blur-3xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.3, repeat: Infinity, repeatType: "reverse" }}
          />
        </>
      )}

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <motion.div
            className="space-y-6 text-center lg:text-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
              variants={childVariants}
            >
              Procédures administratives <span className="text-primary">simplifiées</span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-muted-foreground dark:text-gray-300 max-w-md mx-auto lg:mx-0"
              variants={childVariants}
            >
              Une plateforme moderne pour gérer, suivre et finaliser toutes vos demandes administratives avec efficacité.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start"
              variants={childVariants}
            >
              <Button asChild size="lg" className="gap-2 group hover:bg-primary/90 transition-all duration-300">
                <Link href="/auth/register">
                  Commencer maintenant
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 hover:border-primary hover:text-primary transition-all duration-300 dark:hover:border-primary dark:hover:text-white"
              >
                <Link href="/guide">Guide d'utilisation</Link>
              </Button>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8"
              variants={childVariants}
            >
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm dark:text-gray-300">Traitement rapide</span>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <FileCheck className="h-5 w-5 text-primary" />
                <span className="text-sm dark:text-gray-300">Suivi transparent</span>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-sm dark:text-gray-300">Tableau de bord intuitif</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Image Container - Style similaire à l'exemple */}
          <div className="relative w-full max-w-lg mx-auto lg:mx-0 lg:justify-self-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, -8, 0]
              }}
              transition={{ 
                opacity: { duration: 0.8, delay: 0.3 },
                scale: { duration: 0.8, delay: 0.3 },
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
              }}
              className="rounded-2xl overflow-hidden shadow-2xl bg-white"
            >
              <div className="h-[600px] w-full">
                {imageError ? (
                  <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-red-600 dark:text-red-400">
                    Image not found
                  </div>
                ) : (
                  <Image
                    src="/images/portrait-young-african-woman-with-laptop-white.png"
                    alt="GOPAC Dashboard Preview"
                    width={700}
                    height={600}
                    className="object-cover object-bottom w-full h-full"
                    quality={100}
                    priority
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            </motion.div>

            {/* Effet de lueur */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl blur-xl -z-10 scale-105" />

            {/* Floating status card */}
            <motion.div
              className="absolute -bottom-8 -left-8 bg-background dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-border dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
              variants={floatVariants}
              animate="float"
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium dark:text-white">Demande traitée</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-300">Attestation d'inscription</p>
                </div>
              </div>
            </motion.div>

            {/* Floating notification card */}
            <motion.div
              className="absolute -top-8 -right-8 bg-background dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-border dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
              variants={floatVariants}
              animate="float"
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Bell className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium dark:text-white">Nouvelle notification</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-300">Document disponible</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
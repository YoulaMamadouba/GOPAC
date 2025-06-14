import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Clock, FileText } from 'lucide-react';
import HeroSection from '@/components/home/hero-section';
import FeatureSection from '@/components/home/feature-section';
import StatisticsSection from '@/components/home/statistics-section';
import ProcessSection from '@/components/home/process-section';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function Home() {
  return (
    <div className="w-full">
      <Header />
      <HeroSection />
      <FeatureSection />
      <ProcessSection />
      <StatisticsSection />
      
      <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Prêt à commencer?</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Simplifiez vos démarches administratives dès aujourd'hui
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button asChild size="lg" className="gap-2">
                <Link href="/auth/login">
                  Se connecter <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/about">
                  En savoir plus <BookOpen className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
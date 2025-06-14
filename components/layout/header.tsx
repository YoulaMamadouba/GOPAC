"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/user-nav";
import { 
  BookOpen, 
  Menu, 
  X, 
  LogIn, 
  FileText,
  BarChart,
  Users,
  Bell,
  Inbox,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const pathname = usePathname();
  
  // Mock authentication state (replace with actual auth)
  const isAuthenticated = false;
  const userRole = null; // 'student', 'processor', 'validator'
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Accueil', show: 'all' },
    { href: '/about', label: 'À propos', show: 'all' },
    { href: '/contact', label: 'Contact', show: 'all' },
    // Student links
    { href: '/etudiant/dashboard', label: 'Tableau de bord', show: 'student' },
    { href: '/etudiant/nouvelle-demande', label: 'Nouvelle demande', show: 'student' },
    { href: '/etudiant/mes-demandes', label: 'Mes demandes', show: 'student' },
    { href: '/etudiant/notifications', label: 'Notifications', show: 'student', icon: Bell },
    // Processing authority links
    { href: '/traitement/dashboard', label: 'Tableau de bord', show: 'processor' },
    { href: '/traitement/demandes', label: 'Demandes', show: 'processor' },
    { href: '/traitement/statistiques', label: 'Statistiques', show: 'processor', icon: BarChart },
    // Validator links
    { href: '/validation-finale/dashboard', label: 'Tableau de bord', show: 'validator' },
    { href: '/validation-finale/demandes', label: 'Demandes à valider', show: 'validator' },
    { href: '/validation-finale/signatures', label: 'Signatures', show: 'validator' },
  ];
  
  const filteredLinks = isAuthenticated 
    ? navLinks.filter(link => link.show === 'all' || link.show === userRole)
    : navLinks.filter(link => link.show === 'all');

  return (
    <>
      {/* Backdrop overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
          isScrolled 
            ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg shadow-[#0057A0]/5 py-2 border-b border-[#0057A0]/10" 
            : "bg-transparent py-4"
        )}
      >
        {/* Animated background gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-[#0057A0]/5 via-transparent to-[#F9A825]/5 opacity-0 transition-opacity duration-500",
          isScrolled && "opacity-100"
        )} />
        
        {/* Subtle shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
        
        <div className="container px-4 mx-auto flex items-center justify-between relative">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 group relative z-10"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0057A0] to-[#F9A825] rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-gradient-to-br from-[#0057A0] to-[#0057A0]/80 p-2 rounded-xl group-hover:from-[#0057A0] group-hover:to-[#F9A825] transition-all duration-300">
                <BookOpen className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl bg-gradient-to-r from-[#0057A0] to-[#0057A0]/80 bg-clip-text text-transparent group-hover:from-[#0057A0] group-hover:to-[#F9A825] transition-all duration-300">
                GOPAC
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Gestion Administrative
              </span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 relative">
            {filteredLinks.map(link => (
              <Link 
                href={link.href}
                key={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 group",
                  pathname === link.href 
                    ? "text-white bg-gradient-to-r from-[#0057A0] to-[#0057A0]/90 shadow-lg shadow-[#0057A0]/25" 
                    : "text-slate-700 dark:text-slate-200 hover:text-[#0057A0] dark:hover:text-[#F9A825] hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
                onMouseEnter={() => setHoveredLink(link.href)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {/* Hover effect background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-[#0057A0]/10 to-[#F9A825]/10 rounded-xl opacity-0 transition-opacity duration-300",
                  hoveredLink === link.href && pathname !== link.href && "opacity-100"
                )} />
                
                {/* Active indicator */}
                {pathname === link.href && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0057A0] to-[#0057A0]/90 rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                  </div>
                )}
                
                <span className="relative z-10 flex items-center gap-2">
                  {link.icon && <link.icon className="h-4 w-4" />}
                  {link.label}
                </span>
                
                {/* Subtle underline animation */}
                <div className={cn(
                  "absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-[#F9A825] to-[#0057A0] transition-all duration-300 transform -translate-x-1/2",
                  hoveredLink === link.href && pathname !== link.href && "w-3/4"
                )} />
              </Link>
            ))}
          </nav>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-3 relative z-10">
            <ModeToggle />
            
            {isAuthenticated ? (
              <UserNav />
            ) : (
              <Button 
                asChild 
                className="hidden md:flex gap-2 bg-gradient-to-r from-[#0057A0] to-[#0057A0]/90 hover:from-[#0057A0]/90 hover:to-[#F9A825] text-white shadow-lg shadow-[#0057A0]/25 hover:shadow-[#F9A825]/25 transition-all duration-300 rounded-xl border-0 relative overflow-hidden group"
                size="sm"
              >
                <Link href="/auth/login">
                  {/* Button shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <LogIn className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">Se connecter</span>
                </Link>
              </Button>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden relative rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <div className="relative">
                <Menu className={cn(
                  "h-5 w-5 transition-all duration-300 text-slate-700 dark:text-slate-200",
                  isMobileMenuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
                )} />
                <X className={cn(
                  "h-5 w-5 absolute inset-0 transition-all duration-300 text-slate-700 dark:text-slate-200",
                  isMobileMenuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
                )} />
              </div>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu */}
      <div className={cn(
        "fixed top-[72px] left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-40 md:hidden transition-all duration-300 border-b border-slate-200 dark:border-slate-700",
        isMobileMenuOpen 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 -translate-y-4 pointer-events-none"
      )}>
        {/* Mobile menu background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0057A0]/5 via-transparent to-[#F9A825]/5" />
        
        <nav className="container pt-6 pb-8 flex flex-col space-y-2 relative">
          {filteredLinks.map((link, index) => (
            <Link 
              href={link.href}
              key={link.href}
              className={cn(
                "group relative px-4 py-4 text-base font-medium rounded-xl transition-all duration-300 flex items-center gap-3",
                "hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-50/50 dark:hover:from-slate-800 dark:hover:to-slate-800/50",
                pathname === link.href 
                  ? "bg-gradient-to-r from-[#0057A0] to-[#0057A0]/90 text-white shadow-lg shadow-[#0057A0]/20" 
                  : "text-slate-700 dark:text-slate-200 hover:text-[#0057A0] dark:hover:text-[#F9A825]"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ 
                animationDelay: `${index * 50}ms`,
                animation: isMobileMenuOpen ? 'slideInFromRight 0.3s ease-out forwards' : 'none'
              }}
            >
              {/* Active background */}
              {pathname === link.href && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#0057A0] to-[#0057A0]/90 rounded-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 rounded-xl" />
                </div>
              )}
              
              {/* Icon */}
              {link.icon && (
                <div className="relative">
                  <link.icon className="h-5 w-5 relative z-10" />
                  {pathname === link.href && (
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-sm" />
                  )}
                </div>
              )}
              
              {/* Label */}
              <span className="relative z-10 flex-1">{link.label}</span>
              
              {/* Chevron for active item */}
              {pathname === link.href && (
                <ChevronDown className="h-4 w-4 relative z-10 rotate-[-90deg]" />
              )}
              
              {/* Hover indicator */}
              <div className={cn(
                "absolute right-2 w-1 h-8 bg-gradient-to-b from-[#F9A825] to-[#0057A0] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                pathname !== link.href && "group-hover:opacity-100"
              )} />
            </Link>
          ))}
          
          {/* Login button for mobile */}
          {!isAuthenticated && (
            <Button 
              asChild 
              className="mt-6 w-full bg-gradient-to-r from-[#0057A0] to-[#0057A0]/90 hover:from-[#0057A0]/90 hover:to-[#F9A825] text-white shadow-lg shadow-[#0057A0]/25 hover:shadow-[#F9A825]/25 transition-all duration-300 rounded-xl h-12 relative overflow-hidden group"
            >
              <Link href="/auth/login">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <LogIn className="h-5 w-5 mr-3 relative z-10" />
                <span className="relative z-10 font-semibold">Se connecter</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
      
      {/* Custom animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
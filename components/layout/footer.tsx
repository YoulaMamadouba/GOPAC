import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gradient-to-br from-[#0057A0] to-[#003d73] text-white relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F9A825] rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F9A825] rounded-full translate-y-24 -translate-x-24"></div>
      </div>
      
      <div className="container px-4 md:px-6 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="flex flex-col space-y-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-[#F9A825] rounded-lg transition-transform group-hover:scale-110">
                <BookOpen className="h-6 w-6 text-[#0057A0]" />
              </div>
              <span className="font-bold text-2xl tracking-tight">GOPAC</span>
            </Link>
            <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
              Gouvernance Optimisée des Procédures Administratives au Centre Informatique de l'UGANC
            </p>
            <div className="w-16 h-1 bg-[#F9A825] rounded-full"></div>
          </div>
          
          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-[#F9A825] uppercase tracking-wider">
                Liens rapides
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-sm text-blue-100 hover:text-[#F9A825] transition-colors duration-200 hover:translate-x-1 inline-block">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-sm text-blue-100 hover:text-[#F9A825] transition-colors duration-200 hover:translate-x-1 inline-block">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-blue-100 hover:text-[#F9A825] transition-colors duration-200 hover:translate-x-1 inline-block">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-[#F9A825] uppercase tracking-wider">
                Ressources
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/faq" className="text-sm text-blue-100 hover:text-[#F9A825] transition-colors duration-200 hover:translate-x-1 inline-block">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/guide" className="text-sm text-blue-100 hover:text-[#F9A825] transition-colors duration-200 hover:translate-x-1 inline-block">
                    Guide d'utilisation
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-blue-100 hover:text-[#F9A825] transition-colors duration-200 hover:translate-x-1 inline-block">
                    Confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Contact Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#F9A825] uppercase tracking-wider">
              Contact
            </h4>
            <address className="not-italic text-sm text-blue-100 space-y-3 leading-relaxed">
              <p className="flex items-start">
                <span className="inline-block w-2 h-2 bg-[#F9A825] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Centre Informatique de l'UGANC
              </p>
              <p className="flex items-start">
                <span className="inline-block w-2 h-2 bg-[#F9A825] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Conakry, Guinée
              </p>
              <p className="flex items-start">
                <span className="inline-block w-2 h-2 bg-[#F9A825] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <a 
                  href="mailto:contact@uganc.edu.gn" 
                  className="hover:text-[#F9A825] transition-colors duration-200 underline-offset-2 hover:underline"
                >
                  contact@uganc.edu.gn
                </a>
              </p>
            </address>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-blue-300/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-xs text-blue-200 flex items-center">
              <span className="inline-block w-1 h-1 bg-[#F9A825] rounded-full mr-2"></span>
              &copy; {currentYear} Centre Informatique de l'UGANC. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-6">
              <Link 
                href="/terms" 
                className="text-xs text-blue-200 hover:text-[#F9A825] transition-colors duration-200 underline-offset-2 hover:underline"
              >
                Conditions d'utilisation
              </Link>
              <span className="text-blue-300/40">|</span>
              <Link 
                href="/privacy" 
                className="text-xs text-blue-200 hover:text-[#F9A825] transition-colors duration-200 underline-offset-2 hover:underline"
              >
                Politique de confidentialité
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
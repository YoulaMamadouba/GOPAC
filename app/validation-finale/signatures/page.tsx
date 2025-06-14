"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  FileSignature,
  Upload,
  Paintbrush,
  Trash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignatureManagement() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || !event.target.files[0]) return;

      setUploading(true);
      // TODO: Implement actual file upload to Supabase Storage

      toast({
        title: "Succès",
        description: "Signature téléchargée avec succès",
      });
    } catch (error) {
      console.error("Error uploading signature:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la signature",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pt-24 pb-16">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gestion des signatures
            </h1>
            <p className="text-muted-foreground mt-1">
              Configurez et gérez votre signature numérique
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Signature actuelle</CardTitle>
              <CardDescription>
                Votre signature numérique active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-8 border rounded-lg flex items-center justify-center">
                <img
                  src="https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg"
                  alt="Signature"
                  className="max-w-full h-32 object-contain"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => document.getElementById("signature-upload")?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4" />
                  Changer
                </Button>
                <input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSignatureUpload}
                  disabled={uploading}
                />
                
                <Button
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de votre signature
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Style de signature</Label>
                <Select defaultValue="cursive">
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cursive">Cursive</SelectItem>
                    <SelectItem value="formal">Formelle</SelectItem>
                    <SelectItem value="simple">Simple</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-12 h-12 p-1 bg-transparent"
                    defaultValue="#000000"
                  />
                  <Input
                    type="text"
                    placeholder="#000000"
                    className="flex-1"
                    defaultValue="#000000"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Méthodes de capture</h4>
                
                <Button variant="outline" className="w-full gap-2">
                  <Camera className="h-4 w-4" />
                  Capturer avec la caméra
                </Button>
                
                <Button variant="outline" className="w-full gap-2">
                  <Paintbrush className="h-4 w-4" />
                  Dessiner à main levée
                </Button>
                
                <Button variant="outline" className="w-full gap-2">
                  <FileSignature className="h-4 w-4" />
                  Utiliser un modèle
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Position par défaut</Label>
                <Select defaultValue="bottom-right">
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bas droite</SelectItem>
                    <SelectItem value="bottom-left">Bas gauche</SelectItem>
                    <SelectItem value="custom">Personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full gap-2">
                <Save className="h-4 w-4" />
                Enregistrer les paramètres
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
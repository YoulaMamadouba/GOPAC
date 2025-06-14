"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Download,
  FileCheck,
  FileSignature,
  FileText,
  MessageSquare,
  Send,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data (replace with actual data from Supabase)
const requestDetails = {
  id: "REQ-2023-001",
  type: "Attestation d'inscription",
  student: {
    name: "Mamadou Diallo",
    email: "m.diallo@uganc.edu.gn",
    department: "DL",
    level: "Licence 3",
  },
  date: "2023-05-15",
  status: "pending",
  priority: "normal",
  processor: "Dr. Sow",
  processingNote: "Dossier complet et vérifié. En attente de validation finale.",
  documents: [
    {
      name: "Formulaire_inscription.pdf",
      type: "application/pdf",
      size: "245 KB",
    },
    {
      name: "Document_prepare.pdf",
      type: "application/pdf",
      size: "180 KB",
    },
  ],
  messages: [
    {
      id: 1,
      sender: "Dr. Sow",
      content: "Document préparé et vérifié. Prêt pour signature.",
      timestamp: "2023-05-16 10:30",
    },
  ],
};

export default function RequestValidation({ params }: { params: { id: string } }) {
  const [signing, setSigning] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleValidation = async (action: "sign" | "reject", reason?: string) => {
    try {
      setSigning(true);
      // TODO: Implement actual validation logic with Supabase
      
      toast({
        title: "Succès",
        description: `Document ${action === "sign" ? "signé" : "rejeté"} avec succès`,
      });
      
      router.push("/validation-finale/demandes");
    } catch (error) {
      console.error("Error processing validation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter la validation",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="pt-24 pb-16">
      <div className="container px-4 md:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 mb-8"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{requestDetails.type}</CardTitle>
                    <CardDescription>
                      Référence: {requestDetails.id}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      requestDetails.status === "pending"
                        ? "secondary"
                        : requestDetails.status === "signed"
                        ? "default"
                        : "outline"
                    }
                  >
                    {requestDetails.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Informations étudiant</h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Nom:</span>{" "}
                          {requestDetails.student.name}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Email:</span>{" "}
                          {requestDetails.student.email}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Département:
                          </span>{" "}
                          {requestDetails.student.department}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Niveau:</span>{" "}
                          {requestDetails.student.level}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Détails traitement</h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Date:</span>{" "}
                          {requestDetails.date}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Priorité:</span>{" "}
                          <Badge variant="outline">
                            {requestDetails.priority}
                          </Badge>
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Traité par:
                          </span>{" "}
                          {requestDetails.processor}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Note de traitement</h4>
                    <p className="text-sm text-muted-foreground">
                      {requestDetails.processingNote}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Documents</h4>
                    <div className="space-y-2">
                      {requestDetails.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.type} - {doc.size}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Messages</h4>
                    <div className="space-y-4 mb-4">
                      {requestDetails.messages.map((message) => (
                        <div
                          key={message.id}
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">
                              {message.sender}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {message.timestamp}
                            </p>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <Button className="shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation</CardTitle>
                <CardDescription>
                  Validez ou rejetez cette demande
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full gap-2"
                      disabled={signing}
                    >
                      <FileSignature className="h-4 w-4" />
                      Signer et valider
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Signer ce document ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le document sera signé
                        numériquement et envoyé à l'étudiant.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleValidation("sign")}
                      >
                        Signer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-destructive hover:text-destructive"
                      disabled={signing}
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeter
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Rejeter cette demande ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le document sera renvoyé
                        pour correction.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                      placeholder="Motif du rejet..."
                      className="my-4"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleValidation("reject")}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Rejeter
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signature</CardTitle>
                <CardDescription>
                  Votre signature numérique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <img
                      src="https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg"
                      alt="Signature"
                      className="w-full h-20 object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    asChild
                  >
                    <Link href="/validation-finale/signatures">
                      <FileSignature className="h-4 w-4" />
                      Gérer ma signature
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
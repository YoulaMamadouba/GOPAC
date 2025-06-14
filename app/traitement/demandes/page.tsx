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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  FileText,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";

// Mock data (replace with actual data from Supabase)
const requests = [
  {
    id: "REQ-2023-001",
    type: "Attestation d'inscription",
    student: "Mamadou Diallo",
    date: "2023-05-15",
    status: "pending",
    department: "DL",
    priority: "normal",
  },
  // Add more mock data
];

export default function ProcessingRequests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const handleProcess = async (request, action, reason = "") => {
    try {
      // TODO: Implement actual processing logic with Supabase
      console.log("Processing request:", { request, action, reason });
    } catch (error) {
      console.error("Error processing request:", error);
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
              Traitement des demandes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez et traitez les demandes administratives
            </p>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des demandes</CardTitle>
            <CardDescription>
              Toutes les demandes nécessitant votre attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-4">
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="processing">En traitement</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="rejected">Rejetée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.id}
                      </TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell>{request.student}</TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "secondary"
                              : request.status === "processing"
                              ? "default"
                              : "outline"
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.department}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.priority === "urgent"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Détails
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Détails de la demande
                                </DialogTitle>
                                <DialogDescription>
                                  {request.id} - {request.type}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                {/* Add request details here */}
                              </div>
                              <DialogFooter className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    handleProcess(request, "reject")
                                  }
                                  className="gap-2"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Rejeter
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleProcess(request, "approve")
                                  }
                                  className="gap-2"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Approuver
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
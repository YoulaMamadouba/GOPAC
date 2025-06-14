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
  FileCheck,
  FileSignature,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import Link from "next/link";

// Mock data (replace with actual data from Supabase)
const requests = [
  {
    id: "REQ-2023-001",
    type: "Attestation d'inscription",
    student: "Mamadou Diallo",
    date: "2023-05-15",
    status: "pending",
    department: "DL",
    processor: "Dr. Sow",
    priority: "normal",
  },
  // Add more mock data as needed
];

export default function ValidatorRequests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
              Demandes à valider
            </h1>
            <p className="text-muted-foreground mt-1">
              Liste des demandes nécessitant une validation finale
            </p>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des demandes</CardTitle>
            <CardDescription>
              Toutes les demandes en attente de validation
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
                    <SelectItem value="signed">Signés</SelectItem>
                    <SelectItem value="rejected">Rejetés</SelectItem>
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
                    <TableHead>Traité par</TableHead>
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
                              : request.status === "signed"
                              ? "default"
                              : "outline"
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.department}</TableCell>
                      <TableCell>{request.processor}</TableCell>
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
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/validation-finale/demande/${request.id}`}>
                              <FileSignature className="h-4 w-4 mr-2" />
                              Valider
                            </Link>
                          </Button>
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
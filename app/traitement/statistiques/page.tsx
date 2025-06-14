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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  BarChart as BarChartIcon,
  Calendar,
  Clock,
  FileCheck,
  FileX,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mock data (replace with actual data from Supabase)
const monthlyData = [
  { name: "Jan", completed: 45, rejected: 5, pending: 10 },
  { name: "Fév", completed: 50, rejected: 3, pending: 8 },
  { name: "Mar",completed: 35, rejected: 7, pending: 12 },
  { name: "Avr", completed: 40, rejected: 4, pending: 15 },
  { name: "Mai", completed: 55, rejected: 6, pending: 9 },
];

const statusData = [
  { name: "Complétées", value: 45, color: "hsl(var(--chart-1))" },
  { name: "En cours", value: 15, color: "hsl(var(--chart-2))" },
  { name: "En attente", value: 25, color: "hsl(var(--chart-3))" },
  { name: "Rejetées", value: 15, color: "hsl(var(--chart-4))" },
];

const performanceData = {
  averageTime: "2.5 jours",
  completionRate: "92%",
  satisfactionRate: "4.8/5",
  totalProcessed: 150,
};

export default function Statistics() {
  const [timeRange, setTimeRange] = useState("month");

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
              Statistiques
            </h1>
            <p className="text-muted-foreground mt-1">
              Analyse détaillée des demandes administratives
            </p>
          </div>
          
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total traitées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceData.totalProcessed}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Demandes traitées
              </p>
              <Progress
                value={(performanceData.totalProcessed / 200) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Temps moyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceData.averageTime}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Par demande
              </p>
              <Progress value={75} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Taux de complétion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceData.completionRate}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Demandes complétées
              </p>
              <Progress value={92} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceData.satisfactionRate}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Note moyenne
              </p>
              <Progress value={96} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution mensuelle</CardTitle>
              <CardDescription>
                Nombre de demandes par statut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="completed"
                      stackId="a"
                      fill="hsl(var(--chart-1))"
                    />
                    <Bar
                      dataKey="rejected"
                      stackId="a"
                      fill="hsl(var(--chart-2))"
                    />
                    <Bar
                      dataKey="pending"
                      stackId="a"
                      fill="hsl(var(--chart-3))"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Répartition par statut</CardTitle>
              <CardDescription>
                Distribution des demandes selon leur état
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {statusData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
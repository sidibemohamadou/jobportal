import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Eye,
  Download,
  Send,
  User,
  Briefcase,
  Settings,
  PiggyBank,
  Plane,
  Gift,
  CreditCard,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";

interface HRDashboardStats {
  totalEmployees: number;
  activeContracts: number;
  pendingLeaveRequests: number;
  upcomingLeaves: number;
  payrollToPrepare: number;
  totalSalaryBudget: number;
  pendingBonuses: number;
  expiredContracts: number;
}

export default function HRDashboard() {
  const [activeModule, setActiveModule] = useState("dashboard");

  const { data: stats = {} as HRDashboardStats, isLoading } = useQuery({
    queryKey: ["/api/hr/dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/hr/dashboard");
      return response.json();
    },
  });

  const hrModules = [
    {
      id: "payroll",
      title: "Gestion des Salaires",
      description: "Fiches de paie, calculs automatiques, virements",
      icon: DollarSign,
      color: "bg-green-500",
      route: "/hr/payroll",
      stats: {
        label: "Paies à préparer",
        value: stats.payrollToPrepare || 0,
        urgent: stats.payrollToPrepare > 5
      }
    },
    {
      id: "leaves",
      title: "Gestion des Congés",
      description: "Demandes, planification, soldes de congés",
      icon: Calendar,
      color: "bg-blue-500",
      route: "/hr/leaves",
      stats: {
        label: "Demandes en attente",
        value: stats.pendingLeaveRequests || 0,
        urgent: stats.pendingLeaveRequests > 3
      }
    },
    {
      id: "benefits",
      title: "Indemnités & Avantages",
      description: "Primes, indemnités, avantages en nature",
      icon: Gift,
      color: "bg-purple-500",
      route: "/hr/benefits",
      stats: {
        label: "Primes en attente",
        value: stats.pendingBonuses || 0,
        urgent: stats.pendingBonuses > 2
      }
    },
    {
      id: "contracts",
      title: "Contrats & Carrières",
      description: "Gestion des contrats, évolution de carrière",
      icon: FileText,
      color: "bg-orange-500",
      route: "/contracts",
      stats: {
        label: "Contrats à renouveler",
        value: stats.expiredContracts || 0,
        urgent: stats.expiredContracts > 0
      }
    },
    {
      id: "employees",
      title: "Gestion du Personnel",
      description: "Dossiers employés, formations, évaluations",
      icon: Users,
      color: "bg-teal-500",
      route: "/admin/employees",
      stats: {
        label: "Employés actifs",
        value: stats.totalEmployees || 0,
        urgent: false
      }
    },
    {
      id: "reports",
      title: "Rapports & Analytics",
      description: "Tableaux de bord, statistiques RH",
      icon: TrendingUp,
      color: "bg-indigo-500",
      route: "/hr/reports",
      stats: {
        label: "Budget salarial",
        value: `${(stats.totalSalaryBudget || 0).toLocaleString('fr-FR')}€`,
        urgent: false
      }
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center space-x-2">
              <Plane className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Centre RH AeroRecrutement</h1>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Employés</p>
                    <p className="text-2xl font-bold">{stats.totalEmployees || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Congés en cours</p>
                    <p className="text-2xl font-bold">{stats.upcomingLeaves || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Budget mensuel</p>
                    <p className="text-2xl font-bold">{(stats.totalSalaryBudget || 0).toLocaleString('fr-FR')}€</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Actions urgentes</p>
                    <p className="text-2xl font-bold">
                      {(stats.payrollToPrepare || 0) + (stats.pendingLeaveRequests || 0) + (stats.expiredContracts || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modules RH */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Modules de Gestion RH</h2>
          <p className="text-muted-foreground">
            Accédez à tous les outils de gestion des ressources humaines de votre organisation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hrModules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Card 
                key={module.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${module.color} group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={module.stats.urgent ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {module.stats.label}
                      </Badge>
                      <p className="text-lg font-bold mt-1">{module.stats.value}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {module.description}
                  </p>
                  
                  <Link href={module.route}>
                    <Button className="w-full" data-testid={`button-${module.id}`}>
                      Accéder au module
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions rapides */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-foreground mb-6">Actions Rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/hr/payroll">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium">Nouvelle Paie</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/hr/leaves">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="font-medium">Planifier Congés</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/contracts">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <p className="font-medium">Nouveau Contrat</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/employees">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-teal-500" />
                  <p className="font-medium">Ajouter Employé</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Notifications urgentes */}
        {(stats.payrollToPrepare > 0 || stats.pendingLeaveRequests > 0 || stats.expiredContracts > 0) && (
          <div className="mt-12">
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Actions Urgentes Requises</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.payrollToPrepare > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <span className="font-medium">{stats.payrollToPrepare} fiches de paie à préparer</span>
                    </div>
                    <Link href="/hr/payroll">
                      <Button size="sm">Traiter</Button>
                    </Link>
                  </div>
                )}
                
                {stats.pendingLeaveRequests > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">{stats.pendingLeaveRequests} demandes de congés en attente</span>
                    </div>
                    <Link href="/hr/leaves">
                      <Button size="sm">Examiner</Button>
                    </Link>
                  </div>
                )}
                
                {stats.expiredContracts > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-red-500" />
                      <span className="font-medium">{stats.expiredContracts} contrats à renouveler</span>
                    </div>
                    <Link href="/contracts">
                      <Button size="sm">Gérer</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
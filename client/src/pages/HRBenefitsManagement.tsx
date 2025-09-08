import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Gift,
  DollarSign,
  TrendingUp,
  Users,
  Plus,
  Eye,
  Edit,
  User,
  CreditCard,
  Award,
  Car,
  Home,
  Coffee,
  Plane,
  Search
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Benefit {
  id: number;
  employeeId: number;
  employeeName: string;
  benefitType: string;
  title: string;
  description: string;
  amount: number;
  frequency: string;
  status: "active" | "pending" | "expired";
  startDate: string;
  endDate?: string;
  createdAt: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  salary: number;
}

export default function HRBenefitsManagement() {
  const [activeTab, setActiveTab] = useState("benefits");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [newBenefit, setNewBenefit] = useState({
    employeeId: "",
    benefitType: "bonus",
    title: "",
    description: "",
    amount: "",
    frequency: "monthly",
    startDate: "",
    endDate: ""
  });

  const queryClient = useQueryClient();

  const { data: benefits = [], isLoading } = useQuery({
    queryKey: ["/api/benefits"],
    queryFn: async () => {
      const response = await fetch("/api/benefits");
      return response.json();
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch("/api/employees");
      return response.json();
    },
  });

  const createBenefitMutation = useMutation({
    mutationFn: async (benefitData: any) => {
      const response = await apiRequest("POST", "/api/benefits", {
        ...benefitData,
        amount: parseFloat(benefitData.amount),
        status: "active"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/benefits"] });
      setShowCreateDialog(false);
      setNewBenefit({
        employeeId: "",
        benefitType: "bonus",
        title: "",
        description: "",
        amount: "",
        frequency: "monthly",
        startDate: "",
        endDate: ""
      });
    },
  });

  const updateBenefitMutation = useMutation({
    mutationFn: async ({ id, ...benefitData }: any) => {
      const response = await apiRequest("PATCH", `/api/benefits/${id}`, benefitData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/benefits"] });
      setShowEditDialog(false);
      setSelectedBenefit(null);
    },
  });

  const benefitTypes = {
    bonus: { label: "Prime", icon: Award, color: "bg-yellow-500" },
    allowance: { label: "Indemnité", icon: DollarSign, color: "bg-green-500" },
    car: { label: "Véhicule de fonction", icon: Car, color: "bg-blue-500" },
    housing: { label: "Logement", icon: Home, color: "bg-purple-500" },
    meal: { label: "Tickets restaurant", icon: Coffee, color: "bg-orange-500" },
    health: { label: "Mutuelle santé", icon: User, color: "bg-red-500" },
    transport: { label: "Transport", icon: Plane, color: "bg-indigo-500" },
    other: { label: "Autre", icon: Gift, color: "bg-gray-500" }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800">Expiré</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const filteredBenefits = benefits.filter((benefit: Benefit) => {
    const matchesSearch = benefit.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         benefit.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || benefit.benefitType === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalBenefits: benefits.length,
    activeBenefits: benefits.filter((b: Benefit) => b.status === "active").length,
    totalAmount: benefits.reduce((sum: number, b: Benefit) => sum + (b.amount || 0), 0),
    avgBenefitValue: benefits.length ? Math.round(benefits.reduce((sum: number, b: Benefit) => sum + (b.amount || 0), 0) / benefits.length) : 0
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Gift className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Indemnités & Avantages</h1>
              <p className="text-muted-foreground">Gérez les primes, indemnités et avantages des employés</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center space-x-2"
            data-testid="button-new-benefit"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvel avantage</span>
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Gift className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total avantages</p>
                  <p className="text-2xl font-bold">{stats.totalBenefits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Award className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avantages actifs</p>
                  <p className="text-2xl font-bold">{stats.activeBenefits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="text-2xl font-bold">{stats.totalAmount.toLocaleString('fr-FR')}€</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Valeur moyenne</p>
                  <p className="text-2xl font-bold">{stats.avgBenefitValue.toLocaleString('fr-FR')}€</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="benefits">Avantages en cours</TabsTrigger>
            <TabsTrigger value="summary">Résumé par employé</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
          </TabsList>

          <TabsContent value="benefits">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Avantages et indemnités</CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                        data-testid="input-search-benefit"
                      />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {Object.entries(benefitTypes).map(([key, type]) => (
                          <SelectItem key={key} value={key}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Fréquence</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBenefits.map((benefit: Benefit) => {
                      const benefitType = benefitTypes[benefit.benefitType as keyof typeof benefitTypes];
                      const IconComponent = benefitType?.icon || Gift;
                      
                      return (
                        <TableRow key={benefit.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{benefit.employeeName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className={`p-1 rounded ${benefitType?.color || 'bg-gray-500'}`}>
                                <IconComponent className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm">{benefitType?.label || 'Autre'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{benefit.title}</div>
                              <div className="text-sm text-muted-foreground">{benefit.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-bold">{benefit.amount?.toLocaleString('fr-FR')}€</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {benefit.frequency === "monthly" ? "Mensuel" : 
                               benefit.frequency === "quarterly" ? "Trimestriel" :
                               benefit.frequency === "yearly" ? "Annuel" : "Unique"}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(benefit.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBenefit(benefit);
                                  setShowEditDialog(true);
                                }}
                                data-testid={`button-edit-${benefit.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Résumé par employé</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Salaire de base</TableHead>
                      <TableHead>Avantages totaux</TableHead>
                      <TableHead>Rémunération totale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee: Employee) => {
                      const employeeBenefits = benefits.filter((b: Benefit) => 
                        b.employeeId === employee.id && b.status === "active"
                      );
                      const totalBenefits = employeeBenefits.reduce((sum, b) => sum + (b.amount || 0), 0);
                      const totalCompensation = (employee.salary || 0) + totalBenefits;

                      return (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                              <div className="text-sm text-muted-foreground">{employee.position}</div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>
                            <span className="font-medium">{(employee.salary || 0).toLocaleString('fr-FR')}€</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium text-green-600">{totalBenefits.toLocaleString('fr-FR')}€</span>
                              <div className="text-xs text-muted-foreground">
                                {employeeBenefits.length} avantage{employeeBenefits.length > 1 ? 's' : ''}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-lg">{totalCompensation.toLocaleString('fr-FR')}€</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(benefitTypes).map(([key, type]) => {
                      const count = benefits.filter((b: Benefit) => b.benefitType === key).length;
                      const total = benefits.filter((b: Benefit) => b.benefitType === key)
                                           .reduce((sum, b) => sum + (b.amount || 0), 0);
                      
                      return (
                        <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded ${type.color}`}>
                              <type.icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-muted-foreground">{count} avantage{count > 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{total.toLocaleString('fr-FR')}€</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendances mensuelles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>Graphiques de tendances en cours de développement</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog pour nouvel avantage */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvel avantage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee">Employé</Label>
                <Select value={newBenefit.employeeId} onValueChange={(value) => setNewBenefit({ ...newBenefit, employeeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee: Employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="benefitType">Type d'avantage</Label>
                <Select value={newBenefit.benefitType} onValueChange={(value) => setNewBenefit({ ...newBenefit, benefitType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(benefitTypes).map(([key, type]) => (
                      <SelectItem key={key} value={key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  value={newBenefit.title}
                  onChange={(e) => setNewBenefit({ ...newBenefit, title: e.target.value })}
                  placeholder="Ex: Prime de performance Q4"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  value={newBenefit.description}
                  onChange={(e) => setNewBenefit({ ...newBenefit, description: e.target.value })}
                  placeholder="Description de l'avantage..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Montant (€)</Label>
                  <Input
                    type="number"
                    value={newBenefit.amount}
                    onChange={(e) => setNewBenefit({ ...newBenefit, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Fréquence</Label>
                  <Select value={newBenefit.frequency} onValueChange={(value) => setNewBenefit({ ...newBenefit, frequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Unique</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="quarterly">Trimestriel</SelectItem>
                      <SelectItem value="yearly">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    type="date"
                    value={newBenefit.startDate}
                    onChange={(e) => setNewBenefit({ ...newBenefit, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Date de fin (optionnel)</Label>
                  <Input
                    type="date"
                    value={newBenefit.endDate}
                    onChange={(e) => setNewBenefit({ ...newBenefit, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => createBenefitMutation.mutate(newBenefit)}
                  disabled={!newBenefit.employeeId || !newBenefit.title || !newBenefit.amount}
                >
                  Créer l'avantage
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
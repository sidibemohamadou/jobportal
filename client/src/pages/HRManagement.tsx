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
  Settings
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface PayrollFormData {
  employeeId: number;
  period: string;
  baseSalary: number;
  bonuses?: number;
  overtime?: number;
  absenceDays?: number;
}

interface LeaveRequestFormData {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

interface HRRequestFormData {
  requestType: string;
  title: string;
  description: string;
  priority: string;
}

export default function HRManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showHRRequestForm, setShowHRRequestForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const [payrollForm, setPayrollForm] = useState<PayrollFormData>({
    employeeId: 0,
    period: new Date().toISOString().slice(0, 7), // YYYY-MM
    baseSalary: 0,
    bonuses: 0,
    overtime: 0,
    absenceDays: 0,
  });

  const [leaveForm, setLeaveForm] = useState<LeaveRequestFormData>({
    leaveType: "vacation",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [hrRequestForm, setHRRequestForm] = useState<HRRequestFormData>({
    requestType: "address_change",
    title: "",
    description: "",
    priority: "normal",
  });

  // Queries
  const { data: hrMetrics } = useQuery({
    queryKey: ["/api/hr/metrics"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ["/api/leave/requests"],
  });

  const { data: hrRequests = [] } = useQuery({
    queryKey: ["/api/hr/requests"],
  });

  // Mutations
  const generatePayrollMutation = useMutation({
    mutationFn: async (data: { employeeId: number; period: string; payrollData: any }) =>
      apiRequest("POST", "/api/payroll/generate", data),
    onSuccess: () => {
      setShowPayrollForm(false);
      resetPayrollForm();
    },
  });

  const createLeaveRequestMutation = useMutation({
    mutationFn: async (data: LeaveRequestFormData) =>
      apiRequest("POST", "/api/leave/request", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave/requests"] });
      setShowLeaveForm(false);
      resetLeaveForm();
    },
  });

  const approveLeaveRequestMutation = useMutation({
    mutationFn: async (id: number) =>
      apiRequest("PUT", `/api/leave/requests/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave/requests"] });
    },
  });

  const rejectLeaveRequestMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) =>
      apiRequest("PUT", `/api/leave/requests/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave/requests"] });
    },
  });

  const createHRRequestMutation = useMutation({
    mutationFn: async (data: HRRequestFormData) =>
      apiRequest("POST", "/api/hr/requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/requests"] });
      setShowHRRequestForm(false);
      resetHRRequestForm();
    },
  });

  const resetPayrollForm = () => {
    setPayrollForm({
      employeeId: 0,
      period: new Date().toISOString().slice(0, 7),
      baseSalary: 0,
      bonuses: 0,
      overtime: 0,
      absenceDays: 0,
    });
  };

  const resetLeaveForm = () => {
    setLeaveForm({
      leaveType: "vacation",
      startDate: "",
      endDate: "",
      reason: "",
    });
  };

  const resetHRRequestForm = () => {
    setHRRequestForm({
      requestType: "address_change",
      title: "",
      description: "",
      priority: "normal",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: "En attente",
      approved: "Approuvée",
      rejected: "Refusée",
      in_progress: "En cours",
      completed: "Terminée",
      cancelled: "Annulée",
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getLeaveTypeText = (type: string) => {
    const types = {
      vacation: "Congés payés",
      sick: "Congé maladie",
      personal: "Congé personnel",
      maternity: "Congé maternité",
      paternity: "Congé paternité",
    };
    return types[type as keyof typeof types] || type;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      normal: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const isAdmin = (user as any)?.role === "admin" || (user as any)?.role === "hr";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion RH</h1>
          <p className="text-muted-foreground">
            Paie, congés, demandes internes et gestion du personnel
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="payroll">Paie</TabsTrigger>
          <TabsTrigger value="leaves">Congés</TabsTrigger>
          <TabsTrigger value="requests">Demandes RH</TabsTrigger>
          <TabsTrigger value="employees">Employés</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hrMetrics?.totalEmployees || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {hrMetrics?.activeContracts || 0} contrats actifs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Demandes Congés</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hrMetrics?.pendingLeaveRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {hrMetrics?.upcomingLeaves || 0} congés à venir
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fiches de Paie</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hrMetrics?.payrollToPrepare || 0}</div>
                <p className="text-xs text-muted-foreground">
                  à préparer ce mois
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Demandes en Attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Demandes de congés</span>
                    <Badge variant="secondary">{hrMetrics?.pendingLeaveRequests || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Demandes RH</span>
                    <Badge variant="secondary">{hrMetrics?.pendingHrRequests || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fiches de paie</span>
                    <Badge variant="secondary">{hrMetrics?.payrollToPrepare || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isAdmin && (
                  <Button
                    onClick={() => setShowPayrollForm(true)}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Générer Fiche de Paie
                  </Button>
                )}
                <Button
                  onClick={() => setShowLeaveForm(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Demande de Congés
                </Button>
                <Button
                  onClick={() => setShowHRRequestForm(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Demande RH
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Gestion de la Paie</h2>
            {isAdmin && (
              <Button onClick={() => setShowPayrollForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Générer Fiche de Paie
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fiches de Paie du Mois</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Les fiches de paie seront affichées ici une fois générées
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Gestion des Congés</h2>
            <Button onClick={() => setShowLeaveForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Demande
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Demandes de Congés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune demande de congés
                  </p>
                ) : (
                  leaveRequests.map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {getLeaveTypeText(request.leaveType)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Du {new Date(request.startDate).toLocaleDateString('fr-FR')} au{' '}
                          {new Date(request.endDate).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.totalDays} jour{request.totalDays > 1 ? 's' : ''}
                          {request.reason && ` - ${request.reason}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadge(request.status)}>
                          {getStatusText(request.status)}
                        </Badge>
                        {isAdmin && request.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => approveLeaveRequestMutation.mutate(request.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectLeaveRequestMutation.mutate({
                                id: request.id,
                                reason: "À préciser"
                              })}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Demandes RH</h2>
            <Button onClick={() => setShowHRRequestForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Demande
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Demandes Internes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hrRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune demande RH
                  </p>
                ) : (
                  hrRequests.map((request: any) => (
                    <div key={request.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{request.title}</p>
                          <Badge className={getPriorityBadge(request.priority)}>
                            {request.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Type: {request.requestType} • Créée le{' '}
                          {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={getStatusBadge(request.status)}>
                          {getStatusText(request.status)}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <h2 className="text-2xl font-semibold">Gestion des Employés</h2>

          <Card>
            <CardHeader>
              <CardTitle>Liste des Employés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun employé enregistré
                  </p>
                ) : (
                  employees.map((employee: any) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {employee.user?.firstName} {employee.user?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {employee.position} • {employee.department}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            N° employé: {employee.employeeNumber} • Depuis le{' '}
                            {new Date(employee.startDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                          {employee.status === "active" ? "Actif" : "Inactif"}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Fiche de Paie */}
      <Dialog open={showPayrollForm} onOpenChange={setShowPayrollForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Générer Fiche de Paie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="employee">Employé</Label>
              <Select
                value={payrollForm.employeeId.toString()}
                onValueChange={(value) => setPayrollForm(prev => ({ ...prev, employeeId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.user?.firstName} {employee.user?.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="period">Période</Label>
              <Input
                type="month"
                value={payrollForm.period}
                onChange={(e) => setPayrollForm(prev => ({ ...prev, period: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="base-salary">Salaire de base (€)</Label>
              <Input
                type="number"
                value={payrollForm.baseSalary}
                onChange={(e) => setPayrollForm(prev => ({ ...prev, baseSalary: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="bonuses">Primes (€)</Label>
              <Input
                type="number"
                value={payrollForm.bonuses}
                onChange={(e) => setPayrollForm(prev => ({ ...prev, bonuses: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="overtime">Heures supplémentaires (€)</Label>
              <Input
                type="number"
                value={payrollForm.overtime}
                onChange={(e) => setPayrollForm(prev => ({ ...prev, overtime: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="absence-days">Jours d'absence</Label>
              <Input
                type="number"
                value={payrollForm.absenceDays}
                onChange={(e) => setPayrollForm(prev => ({ ...prev, absenceDays: parseInt(e.target.value) }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPayrollForm(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => generatePayrollMutation.mutate({
                  employeeId: payrollForm.employeeId,
                  period: payrollForm.period,
                  payrollData: {
                    baseSalary: payrollForm.baseSalary,
                    bonuses: payrollForm.bonuses,
                    overtime: payrollForm.overtime,
                    absenceDays: payrollForm.absenceDays,
                  },
                })}
                disabled={generatePayrollMutation.isPending}
              >
                {generatePayrollMutation.isPending ? "Génération..." : "Générer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Demande de Congés */}
      <Dialog open={showLeaveForm} onOpenChange={setShowLeaveForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Demande de Congés</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="leave-type">Type de congé</Label>
              <Select
                value={leaveForm.leaveType}
                onValueChange={(value) => setLeaveForm(prev => ({ ...prev, leaveType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Congés payés</SelectItem>
                  <SelectItem value="sick">Congé maladie</SelectItem>
                  <SelectItem value="personal">Congé personnel</SelectItem>
                  <SelectItem value="maternity">Congé maternité</SelectItem>
                  <SelectItem value="paternity">Congé paternité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Date de début</Label>
              <Input
                type="date"
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="end-date">Date de fin</Label>
              <Input
                type="date"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="reason">Motif (optionnel)</Label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Précisez le motif si nécessaire..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLeaveForm(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => createLeaveRequestMutation.mutate(leaveForm)}
                disabled={createLeaveRequestMutation.isPending}
              >
                {createLeaveRequestMutation.isPending ? "Envoi..." : "Envoyer la Demande"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Demande RH */}
      <Dialog open={showHRRequestForm} onOpenChange={setShowHRRequestForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle Demande RH</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="request-type">Type de demande</Label>
              <Select
                value={hrRequestForm.requestType}
                onValueChange={(value) => setHRRequestForm(prev => ({ ...prev, requestType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="address_change">Changement d'adresse</SelectItem>
                  <SelectItem value="equipment">Demande de matériel</SelectItem>
                  <SelectItem value="certificate">Attestation</SelectItem>
                  <SelectItem value="training">Formation</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Titre de la demande</Label>
              <Input
                value={hrRequestForm.title}
                onChange={(e) => setHRRequestForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Demande d'ordinateur portable"
              />
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={hrRequestForm.priority}
                onValueChange={(value) => setHRRequestForm(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                value={hrRequestForm.description}
                onChange={(e) => setHRRequestForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre demande en détail..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowHRRequestForm(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => createHRRequestMutation.mutate(hrRequestForm)}
                disabled={createHRRequestMutation.isPending}
              >
                {createHRRequestMutation.isPending ? "Envoi..." : "Envoyer la Demande"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
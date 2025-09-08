import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Système de notification simple
import { Calendar, DollarSign, FileText, Plus, Search, User, Edit, Download, Mail, Eye, Printer } from "lucide-react";

export default function PayrollManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newPayroll, setNewPayroll] = useState({
    employeeId: "",
    grossSalary: "",
    netSalary: "",
    deductions: "",
    bonuses: "",
    period: "",
    status: "pending" as const
  });

  // États pour modals d'édition et partage
  const [showEditPayslipDialog, setShowEditPayslipDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [editPayslipData, setEditPayslipData] = useState({
    baseSalary: "",
    bonuses: "",
    overtime: "",
    deductions: "",
    socialCharges: "",
    taxes: "",
    netSalary: "",
    workingDays: "",
    absenceDays: "",
    notes: ""
  });
  const [emailData, setEmailData] = useState({
    email: "",
    customMessage: ""
  });

  // Notification simple (remplace useToast)
  const showNotification = (message: string, type: "success" | "error" = "success") => {
    console.log(`${type.toUpperCase()}: ${message}`);
    // TODO: Implémenter système de notification
  };
  const queryClient = useQueryClient();

  const { data: payrolls = [], isLoading } = useQuery({
    queryKey: ["/api/payroll"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const createPayrollMutation = useMutation({
    mutationFn: async (payrollData: any) => {
      const response = await apiRequest("POST", "/api/payroll", payrollData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      setShowCreateDialog(false);
      setNewPayroll({
        employeeId: "",
        grossSalary: "",
        netSalary: "",
        deductions: "",
        bonuses: "",
        period: "",
        status: "pending"
      });
      toast({
        title: "Succès",
        description: "Bulletin de paie créé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le bulletin de paie",
        variant: "destructive",
      });
    },
  });

  const updatePayrollMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/payroll/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      toast({
        title: "Succès",
        description: "Statut du paiement mis à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const savePayslipMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/payroll/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      setShowEditPayslipDialog(false);
      toast({
        title: "Succès",
        description: "Bulletin de paie mis à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ id, email, customMessage }: { id: number; email: string; customMessage: string }) => {
      const response = await apiRequest("POST", `/api/payroll/${id}/send-email`, { email, customMessage });
      return response.json();
    },
    onSuccess: () => {
      setShowEmailDialog(false);
      toast({
        title: "Succès",
        description: "Email envoyé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email",
        variant: "destructive",
      });
    },
  });

  const handleCreatePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    createPayrollMutation.mutate({
      ...newPayroll,
      employeeId: parseInt(newPayroll.employeeId),
      grossSalary: parseFloat(newPayroll.grossSalary),
      netSalary: parseFloat(newPayroll.netSalary),
      deductions: parseFloat(newPayroll.deductions || "0"),
      bonuses: parseFloat(newPayroll.bonuses || "0"),
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "processing":
        return "outline";
      default:
        return "destructive";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Payé";
      case "pending":
        return "En attente";
      case "processing":
        return "En traitement";
      case "failed":
        return "Échoué";
      default:
        return status;
    }
  };

  // Fonctions de gestion des bulletins de paie
  const handleViewPayslip = (payroll: any) => {
    setSelectedPayroll(payroll);
    // TODO: Ouvrir modal de prévisualisation
    toast({
      title: "Prévisualisation",
      description: `Bulletin de paie de ${payroll.employee?.firstName} ${payroll.employee?.lastName} pour ${payroll.period}`,
    });
  };

  const handleEditPayslip = (payroll: any) => {
    setSelectedPayroll(payroll);
    setEditPayslipData({
      baseSalary: payroll.baseSalary?.toString() || "",
      bonuses: payroll.bonuses?.toString() || "",
      overtime: payroll.overtime?.toString() || "",
      deductions: payroll.deductions?.toString() || "",
      socialCharges: payroll.socialCharges?.toString() || "",
      taxes: payroll.taxes?.toString() || "",
      netSalary: payroll.netSalary?.toString() || "",
      workingDays: payroll.workingDays?.toString() || "",
      absenceDays: payroll.absenceDays?.toString() || "",
      notes: payroll.notes || ""
    });
    setShowEditPayslipDialog(true);
  };

  const handleGeneratePDF = (payrollId: number) => {
    // TODO: Implémenter génération PDF
    toast({
      title: "Génération PDF",
      description: "Génération du bulletin de paie en cours...",
    });
  };

  const handleSendEmail = (payroll: any) => {
    setSelectedPayroll(payroll);
    setEmailData({
      email: payroll.employee?.email || "",
      customMessage: `Bonjour ${payroll.employee?.firstName},\n\nVeuillez trouver ci-joint votre bulletin de paie pour la période ${payroll.period}.\n\nCordialement,\nService RH`
    });
    setShowEmailDialog(true);
  };

  const handleSavePayslip = () => {
    if (!selectedPayroll) return;
    
    const updatedData = {
      baseSalary: parseFloat(editPayslipData.baseSalary) || 0,
      bonuses: parseFloat(editPayslipData.bonuses) || 0,
      overtime: parseFloat(editPayslipData.overtime) || 0,
      deductions: parseFloat(editPayslipData.deductions) || 0,
      socialCharges: parseFloat(editPayslipData.socialCharges) || 0,
      taxes: parseFloat(editPayslipData.taxes) || 0,
      netSalary: parseFloat(editPayslipData.netSalary) || 0,
      workingDays: parseInt(editPayslipData.workingDays) || 22,
      absenceDays: parseInt(editPayslipData.absenceDays) || 0,
      notes: editPayslipData.notes
    };

    savePayslipMutation.mutate({
      id: selectedPayroll.id,
      data: updatedData
    });
  };

  const handleSendEmailAction = () => {
    if (!selectedPayroll || !emailData.email) return;
    
    sendEmailMutation.mutate({
      id: selectedPayroll.id,
      email: emailData.email,
      customMessage: emailData.customMessage
    });
  };

  // Filter payrolls based on search term and selected period
  const filteredPayrolls = payrolls.filter((payroll: any) => {
    const matchesSearch = payroll.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payroll.employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payroll.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = !selectedPeriod || payroll.period === selectedPeriod;
    return matchesSearch && matchesPeriod;
  });

  // Get unique periods for filter
  const periods = Array.from(new Set(payrolls.map((p: any) => p.period))).sort();

  // Calculate summary statistics
  const totalAmount = filteredPayrolls.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);
  const paidAmount = filteredPayrolls.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);
  const pendingCount = filteredPayrolls.filter((p: any) => p.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Salaires</h1>
          <p className="text-muted-foreground">Gérer et suivre les paiements de salaires</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-payroll">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Bulletin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un Bulletin de Paie</DialogTitle>
              <DialogDescription>
                Ajouter un nouveau bulletin de paie pour un employé
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePayroll} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employé</Label>
                <Select value={newPayroll.employeeId} onValueChange={(value) => setNewPayroll({...newPayroll, employeeId: value})}>
                  <SelectTrigger data-testid="select-employee">
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grossSalary">Salaire Brut (€)</Label>
                  <Input
                    id="grossSalary"
                    type="number"
                    step="0.01"
                    value={newPayroll.grossSalary}
                    onChange={(e) => setNewPayroll({...newPayroll, grossSalary: e.target.value})}
                    required
                    data-testid="input-gross-salary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="netSalary">Salaire Net (€)</Label>
                  <Input
                    id="netSalary"
                    type="number"
                    step="0.01"
                    value={newPayroll.netSalary}
                    onChange={(e) => setNewPayroll({...newPayroll, netSalary: e.target.value})}
                    required
                    data-testid="input-net-salary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deductions">Déductions (€)</Label>
                  <Input
                    id="deductions"
                    type="number"
                    step="0.01"
                    value={newPayroll.deductions}
                    onChange={(e) => setNewPayroll({...newPayroll, deductions: e.target.value})}
                    data-testid="input-deductions"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonuses">Primes (€)</Label>
                  <Input
                    id="bonuses"
                    type="number"
                    step="0.01"
                    value={newPayroll.bonuses}
                    onChange={(e) => setNewPayroll({...newPayroll, bonuses: e.target.value})}
                    data-testid="input-bonuses"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Période</Label>
                <Input
                  id="period"
                  value={newPayroll.period}
                  onChange={(e) => setNewPayroll({...newPayroll, period: e.target.value})}
                  placeholder="ex: 2024-01"
                  required
                  data-testid="input-period"
                />
              </div>
              <Button type="submit" disabled={createPayrollMutation.isPending} data-testid="button-create-payroll">
                {createPayrollMutation.isPending ? "Création..." : "Créer le Bulletin"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total à Payer</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-amount">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(totalAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Déjà Payé</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-paid-amount">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(paidAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-count">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bulletins</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-payrolls">
              {filteredPayrolls.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal d'édition de bulletin de paie */}
      <Dialog open={showEditPayslipDialog} onOpenChange={setShowEditPayslipDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le bulletin de paie</DialogTitle>
            <DialogDescription>
              {selectedPayroll && `${selectedPayroll.employee?.firstName} ${selectedPayroll.employee?.lastName} - ${selectedPayroll.period}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-base-salary">Salaire de base (€)</Label>
                <Input
                  id="edit-base-salary"
                  type="number"
                  step="0.01"
                  value={editPayslipData.baseSalary}
                  onChange={(e) => setEditPayslipData({...editPayslipData, baseSalary: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bonuses">Primes (€)</Label>
                <Input
                  id="edit-bonuses"
                  type="number"
                  step="0.01"
                  value={editPayslipData.bonuses}
                  onChange={(e) => setEditPayslipData({...editPayslipData, bonuses: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-overtime">Heures supplémentaires (€)</Label>
                <Input
                  id="edit-overtime"
                  type="number"
                  step="0.01"
                  value={editPayslipData.overtime}
                  onChange={(e) => setEditPayslipData({...editPayslipData, overtime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deductions">Déductions (€)</Label>
                <Input
                  id="edit-deductions"
                  type="number"
                  step="0.01"
                  value={editPayslipData.deductions}
                  onChange={(e) => setEditPayslipData({...editPayslipData, deductions: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-social-charges">Charges sociales (€)</Label>
                <Input
                  id="edit-social-charges"
                  type="number"
                  step="0.01"
                  value={editPayslipData.socialCharges}
                  onChange={(e) => setEditPayslipData({...editPayslipData, socialCharges: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-taxes">Impôts (€)</Label>
                <Input
                  id="edit-taxes"
                  type="number"
                  step="0.01"
                  value={editPayslipData.taxes}
                  onChange={(e) => setEditPayslipData({...editPayslipData, taxes: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-net-salary">Salaire net (€)</Label>
                <Input
                  id="edit-net-salary"
                  type="number"
                  step="0.01"
                  value={editPayslipData.netSalary}
                  onChange={(e) => setEditPayslipData({...editPayslipData, netSalary: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-working-days">Jours travaillés</Label>
                <Input
                  id="edit-working-days"
                  type="number"
                  value={editPayslipData.workingDays}
                  onChange={(e) => setEditPayslipData({...editPayslipData, workingDays: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-absence-days">Jours d'absence</Label>
                <Input
                  id="edit-absence-days"
                  type="number"
                  value={editPayslipData.absenceDays}
                  onChange={(e) => setEditPayslipData({...editPayslipData, absenceDays: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editPayslipData.notes}
                onChange={(e) => setEditPayslipData({...editPayslipData, notes: e.target.value})}
                placeholder="Notes complémentaires..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditPayslipDialog(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSavePayslip}
                disabled={savePayslipMutation.isPending}
                data-testid="button-save-payslip"
              >
                {savePayslipMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'envoi par email */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Envoyer le bulletin de paie par email</DialogTitle>
            <DialogDescription>
              {selectedPayroll && `${selectedPayroll.employee?.firstName} ${selectedPayroll.employee?.lastName} - ${selectedPayroll.period}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-address">Adresse email</Label>
              <Input
                id="email-address"
                type="email"
                value={emailData.email}
                onChange={(e) => setEmailData({...emailData, email: e.target.value})}
                placeholder="employee@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-message">Message personnalisé</Label>
              <Textarea
                id="email-message"
                value={emailData.customMessage}
                onChange={(e) => setEmailData({...emailData, customMessage: e.target.value})}
                placeholder="Message d'accompagnement..."
                rows={6}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSendEmailAction}
                disabled={sendEmailMutation.isPending || !emailData.email}
                data-testid="button-send-email"
              >
                <Mail className="h-4 w-4 mr-2" />
                {sendEmailMutation.isPending ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="search">Rechercher</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Rechercher par nom d'employé ou période..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              data-testid="input-search-payroll"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="period">Filtrer par Période</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48" data-testid="select-period-filter">
              <SelectValue placeholder="Toutes les périodes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les périodes</SelectItem>
              {periods.map((period: string) => (
                <SelectItem key={period} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payrolls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bulletins de Paie</CardTitle>
          <CardDescription>
            Liste de tous les bulletins de paie avec leur statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Salaire Brut</TableHead>
                <TableHead>Salaire Net</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun bulletin de paie trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayrolls.map((payroll: any) => (
                  <TableRow key={payroll.id} data-testid={`row-payroll-${payroll.id}`}>
                    <TableCell className="font-medium">
                      {payroll.employee ? `${payroll.employee.firstName} ${payroll.employee.lastName}` : `Employé #${payroll.employeeId}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        {payroll.period}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      }).format(payroll.grossSalary)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR' 
                      }).format(payroll.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(payroll.status)}>
                        {getStatusLabel(payroll.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPayslip(payroll)}
                          data-testid={`button-view-payslip-${payroll.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPayslip(payroll)}
                          data-testid={`button-edit-payslip-${payroll.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGeneratePDF(payroll.id)}
                          data-testid={`button-pdf-${payroll.id}`}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendEmail(payroll)}
                          data-testid={`button-email-${payroll.id}`}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                        {payroll.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => updatePayrollMutation.mutate({ 
                              id: payroll.id, 
                              status: "paid" 
                            })}
                            disabled={updatePayrollMutation.isPending}
                            data-testid={`button-mark-paid-${payroll.id}`}
                          >
                            Marquer Payé
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
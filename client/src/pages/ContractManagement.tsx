import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit,
  Eye,
  Download,
  Signature
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ContractFormData {
  applicationId: number;
  contractType: string;
  startDate: string;
  endDate?: string;
  baseSalary: number;
  workingHours: number;
  vacationDays: number;
}

interface AmendmentFormData {
  amendmentType: string;
  description: string;
  effectiveDate: string;
  previousValue?: string;
  newValue: string;
}

export default function ContractManagement() {
  const { user } = useAuth();
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showAmendmentForm, setShowAmendmentForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Formulaires
  const [contractForm, setContractForm] = useState<ContractFormData>({
    applicationId: 0,
    contractType: "CDI",
    startDate: "",
    endDate: "",
    baseSalary: 0,
    workingHours: 35,
    vacationDays: 25,
  });

  const [amendmentForm, setAmendmentForm] = useState<AmendmentFormData>({
    amendmentType: "",
    description: "",
    effectiveDate: "",
    previousValue: "",
    newValue: "",
  });

  // Queries
  const { data: contracts = [] } = useQuery({
    queryKey: ["/api/contracts"],
  });

  const { data: pendingContracts = [] } = useQuery({
    queryKey: ["/api/contracts/pending"],
  });

  const { data: acceptedApplications = [] } = useQuery({
    queryKey: ["/api/admin/applications"],
    select: (data: any[]) => data.filter(app => app.status === "accepted" || app.status === "validated"),
  });

  // Mutations
  const generateContractMutation = useMutation({
    mutationFn: async (data: { applicationId: number; contractData: any }) =>
      apiRequest("POST", "/api/contracts/generate", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setShowContractForm(false);
      setContractForm({
        applicationId: 0,
        contractType: "CDI",
        startDate: "",
        endDate: "",
        baseSalary: 0,
        workingHours: 35,
        vacationDays: 25,
      });
    },
  });

  const activateContractMutation = useMutation({
    mutationFn: async (contractId: number) =>
      apiRequest("PUT", `/api/contracts/${contractId}/activate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    },
  });

  const createAmendmentMutation = useMutation({
    mutationFn: async (data: { contractId: number; amendmentData: any }) =>
      apiRequest("POST", `/api/contracts/${data.contractId}/amendments`, data.amendmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setShowAmendmentForm(false);
      setAmendmentForm({
        amendmentType: "",
        description: "",
        effectiveDate: "",
        previousValue: "",
        newValue: "",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      active: "default",
      pending: "outline",
      signed: "default",
      terminated: "destructive",
    } as const;
    
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      signed: "bg-blue-100 text-blue-800",
      terminated: "bg-red-100 text-red-800",
    };

    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const texts = {
      draft: "Brouillon",
      active: "Actif",
      pending: "En attente",
      signed: "Signé",
      terminated: "Terminé",
    };
    return texts[status as keyof typeof texts] || status;
  };

  const handleGenerateContract = () => {
    if (!selectedApplication) return;

    generateContractMutation.mutate({
      applicationId: selectedApplication,
      contractData: {
        contractType: contractForm.contractType,
        startDate: contractForm.startDate,
        endDate: contractForm.contractType === "CDD" ? contractForm.endDate : null,
        baseSalary: contractForm.baseSalary,
        workingHours: contractForm.workingHours,
        vacationDays: contractForm.vacationDays,
      },
    });
  };

  const handleCreateAmendment = () => {
    if (!selectedContract) return;

    createAmendmentMutation.mutate({
      contractId: selectedContract.id,
      amendmentData: amendmentForm,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Contrats</h1>
          <p className="text-muted-foreground">
            Automatisation de la génération et gestion des contrats employés
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="generate">Générer Contrats</TabsTrigger>
          <TabsTrigger value="active">Contrats Actifs</TabsTrigger>
          <TabsTrigger value="amendments">Avenants</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contrats Actifs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {contracts.filter((c: any) => c.status === "active").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {contracts.length} au total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingContracts.length}</div>
                <p className="text-xs text-muted-foreground">
                  signature requise
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Candidats Validés</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{acceptedApplications.length}</div>
                <p className="text-xs text-muted-foreground">
                  prêts pour contrat
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiration</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {contracts.filter((c: any) => {
                    if (!c.endDate) return false;
                    const endDate = new Date(c.endDate);
                    const today = new Date();
                    const diffTime = endDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 30 && diffDays > 0;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  dans 30 jours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contrats en attente de signature */}
          {pendingContracts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Contrats en Attente de Signature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingContracts.map((contract: any) => (
                    <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-semibold">Contrat #{contract.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {contract.contractType} - {contract.baseSalary}€
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Début: {new Date(contract.startDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadge(contract.signatureStatus)}>
                          {getStatusText(contract.signatureStatus)}
                        </Badge>
                        <Button
                          onClick={() => activateContractMutation.mutate(contract.id)}
                          size="sm"
                          disabled={contract.signatureStatus !== "signed"}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Activer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Générer un Contrat</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sélectionnez un candidat validé pour générer automatiquement son contrat
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {acceptedApplications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun candidat validé disponible pour la génération de contrat
                </p>
              ) : (
                <>
                  <div>
                    <Label htmlFor="candidate-select">Sélectionner un candidat</Label>
                    <Select
                      value={selectedApplication?.toString() || ""}
                      onValueChange={(value) => setSelectedApplication(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un candidat..." />
                      </SelectTrigger>
                      <SelectContent>
                        {acceptedApplications.map((application: any) => (
                          <SelectItem key={application.id} value={application.id.toString()}>
                            {application.user?.firstName} {application.user?.lastName} - {application.job?.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedApplication && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contract-type">Type de contrat</Label>
                        <Select
                          value={contractForm.contractType}
                          onValueChange={(value) => setContractForm(prev => ({ ...prev, contractType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CDI">CDI</SelectItem>
                            <SelectItem value="CDD">CDD</SelectItem>
                            <SelectItem value="Stage">Stage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="start-date">Date de début</Label>
                        <Input
                          type="date"
                          value={contractForm.startDate}
                          onChange={(e) => setContractForm(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>

                      {contractForm.contractType === "CDD" && (
                        <div>
                          <Label htmlFor="end-date">Date de fin</Label>
                          <Input
                            type="date"
                            value={contractForm.endDate}
                            onChange={(e) => setContractForm(prev => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="salary">Salaire de base (€)</Label>
                        <Input
                          type="number"
                          value={contractForm.baseSalary}
                          onChange={(e) => setContractForm(prev => ({ ...prev, baseSalary: parseInt(e.target.value) }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="working-hours">Heures hebdomadaires</Label>
                        <Input
                          type="number"
                          value={contractForm.workingHours}
                          onChange={(e) => setContractForm(prev => ({ ...prev, workingHours: parseInt(e.target.value) }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="vacation-days">Jours de congés annuels</Label>
                        <Input
                          type="number"
                          value={contractForm.vacationDays}
                          onChange={(e) => setContractForm(prev => ({ ...prev, vacationDays: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={handleGenerateContract}
                      disabled={!selectedApplication || generateContractMutation.isPending}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {generateContractMutation.isPending ? "Génération..." : "Générer le Contrat"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contrats Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contracts.filter((c: any) => c.status === "active").map((contract: any) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-semibold">Contrat #{contract.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.contractType} - {contract.baseSalary}€
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Du {new Date(contract.startDate).toLocaleDateString('fr-FR')}
                        {contract.endDate && ` au ${new Date(contract.endDate).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadge(contract.status)}>
                        {getStatusText(contract.status)}
                      </Badge>
                      <Button
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowAmendmentForm(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Avenant
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amendments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Avenants</CardTitle>
              <p className="text-sm text-muted-foreground">
                Modifications et avenants aux contrats existants
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Les avenants seront listés ici une fois créés
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal pour créer un avenant */}
      <Dialog open={showAmendmentForm} onOpenChange={setShowAmendmentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un Avenant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amendment-type">Type d'avenant</Label>
              <Select
                value={amendmentForm.amendmentType}
                onValueChange={(value) => setAmendmentForm(prev => ({ ...prev, amendmentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary_change">Modification salaire</SelectItem>
                  <SelectItem value="role_change">Changement de poste</SelectItem>
                  <SelectItem value="schedule_change">Modification horaires</SelectItem>
                  <SelectItem value="location_change">Changement de lieu</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                value={amendmentForm.description}
                onChange={(e) => setAmendmentForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez la modification..."
              />
            </div>

            <div>
              <Label htmlFor="effective-date">Date d'effet</Label>
              <Input
                type="date"
                value={amendmentForm.effectiveDate}
                onChange={(e) => setAmendmentForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="previous-value">Valeur précédente</Label>
              <Input
                value={amendmentForm.previousValue}
                onChange={(e) => setAmendmentForm(prev => ({ ...prev, previousValue: e.target.value }))}
                placeholder="Ex: 2500€"
              />
            </div>

            <div>
              <Label htmlFor="new-value">Nouvelle valeur</Label>
              <Input
                value={amendmentForm.newValue}
                onChange={(e) => setAmendmentForm(prev => ({ ...prev, newValue: e.target.value }))}
                placeholder="Ex: 2800€"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAmendmentForm(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleCreateAmendment}
                disabled={createAmendmentMutation.isPending}
              >
                {createAmendmentMutation.isPending ? "Création..." : "Créer l'Avenant"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
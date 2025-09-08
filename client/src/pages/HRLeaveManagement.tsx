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
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Eye,
  User,
  CalendarDays,
  Plane,
  FileText,
  Search
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  leaveBalance: {
    annual: number;
    sick: number;
    personal: number;
  };
}

export default function HRLeaveManagement() {
  const [activeTab, setActiveTab] = useState("requests");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [newLeave, setNewLeave] = useState({
    employeeId: "",
    leaveType: "annual",
    startDate: "",
    endDate: "",
    reason: ""
  });

  const queryClient = useQueryClient();

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ["/api/leave-requests"],
    queryFn: async () => {
      const response = await fetch("/api/leave-requests");
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

  const createLeaveMutation = useMutation({
    mutationFn: async (leaveData: any) => {
      const days = differenceInDays(new Date(leaveData.endDate), new Date(leaveData.startDate)) + 1;
      const response = await apiRequest("POST", "/api/leave-requests", {
        ...leaveData,
        days,
        status: "pending"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      setShowCreateDialog(false);
      setNewLeave({
        employeeId: "",
        leaveType: "annual",
        startDate: "",
        endDate: "",
        reason: ""
      });
    },
  });

  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: number; status: string; comments?: string }) => {
      const response = await apiRequest("PATCH", `/api/leave-requests/${id}`, {
        status,
        approvedBy: "Admin",
        approvedAt: new Date().toISOString(),
        comments
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      setShowApprovalDialog(false);
      setSelectedRequest(null);
    },
  });

  const leaveTypes = {
    annual: "Congés annuels",
    sick: "Congé maladie",
    personal: "Congé personnel",
    maternity: "Congé maternité",
    paternity: "Congé paternité",
    unpaid: "Congé sans solde"
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approuvé</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Refusé</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
    }
  };

  const filteredRequests = leaveRequests.filter((request: LeaveRequest) => {
    const matchesSearch = request.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalRequests: leaveRequests.length,
    pendingRequests: leaveRequests.filter((r: LeaveRequest) => r.status === "pending").length,
    approvedRequests: leaveRequests.filter((r: LeaveRequest) => r.status === "approved").length,
    rejectedRequests: leaveRequests.filter((r: LeaveRequest) => r.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestion des Congés</h1>
              <p className="text-muted-foreground">Gérez les demandes et planifiez les congés</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center space-x-2"
            data-testid="button-new-leave"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle demande</span>
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total demandes</p>
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Approuvées</p>
                  <p className="text-2xl font-bold">{stats.approvedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Refusées</p>
                  <p className="text-2xl font-bold">{stats.rejectedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="requests">Demandes de congés</TabsTrigger>
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
            <TabsTrigger value="balances">Soldes de congés</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Demandes de congés</CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un employé..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                        data-testid="input-search-employee"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="approved">Approuvées</SelectItem>
                        <SelectItem value="rejected">Refusées</SelectItem>
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
                      <TableHead>Type de congé</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request: LeaveRequest) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{request.employeeName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {leaveTypes[request.leaveType as keyof typeof leaveTypes]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(request.startDate), "dd/MM/yyyy", { locale: fr })}</div>
                            <div className="text-muted-foreground">
                              au {format(new Date(request.endDate), "dd/MM/yyyy", { locale: fr })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <CalendarDays className="h-4 w-4" />
                            <span>{request.days} jour{request.days > 1 ? 's' : ''}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApprovalDialog(true);
                              }}
                              data-testid={`button-view-${request.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => updateLeaveMutation.mutate({ id: request.id, status: "approved" })}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateLeaveMutation.mutate({ id: request.id, status: "rejected" })}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Calendrier des congés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4" />
                  <p>Vue calendrier en cours de développement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balances">
            <Card>
              <CardHeader>
                <CardTitle>Soldes de congés par employé</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Congés annuels</TableHead>
                      <TableHead>Congés maladie</TableHead>
                      <TableHead>Congés personnels</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee: Employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                            <div className="text-sm text-muted-foreground">{employee.position}</div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {employee.leaveBalance?.annual || 25} jours
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {employee.leaveBalance?.sick || 10} jours
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {employee.leaveBalance?.personal || 5} jours
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog pour nouvelle demande */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle demande de congé</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee">Employé</Label>
                <Select value={newLeave.employeeId} onValueChange={(value) => setNewLeave({ ...newLeave, employeeId: value })}>
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
                <Label htmlFor="leaveType">Type de congé</Label>
                <Select value={newLeave.leaveType} onValueChange={(value) => setNewLeave({ ...newLeave, leaveType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(leaveTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    type="date"
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    type="date"
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Motif (optionnel)</Label>
                <Textarea
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  placeholder="Motif de la demande..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => createLeaveMutation.mutate(newLeave)}
                  disabled={!newLeave.employeeId || !newLeave.startDate || !newLeave.endDate}
                >
                  Créer la demande
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
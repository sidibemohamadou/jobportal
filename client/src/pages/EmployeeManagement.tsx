import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users,
  Star,
  BookOpen,
  AlertTriangle,
  FileText,
  Clock,
  Plus,
  Edit,
  Eye,
  Calendar,
  Award,
  TrendingUp,
  Download,
  Upload,
  UserCheck,
  Timer
} from "lucide-react";

// Performance Review Component
function PerformanceReviews() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [reviewData, setReviewData] = useState({
    reviewPeriod: "",
    reviewType: "annual",
    overallRating: 3,
    goals: "",
    achievements: "",
    areasForImprovement: "",
    developmentPlan: "",
    managerComments: "",
    employeeComments: "",
    reviewDate: new Date().toISOString().split('T')[0]
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"]
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/performance-reviews"]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/performance-reviews", {
        employeeId: parseInt(selectedEmployee),
        ...reviewData,
        reviewDate: new Date(reviewData.reviewDate)
      });
    },
    onSuccess: () => {
      toast({
        title: "Évaluation créée",
        description: "L'évaluation de performance a été créée avec succès."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/performance-reviews"] });
      setSelectedEmployee("");
      setReviewData({
        reviewPeriod: "",
        reviewType: "annual",
        overallRating: 3,
        goals: "",
        achievements: "",
        areasForImprovement: "",
        developmentPlan: "",
        managerComments: "",
        employeeComments: "",
        reviewDate: new Date().toISOString().split('T')[0]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'évaluation.",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Évaluations de Performance</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="button-create-performance-review">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle évaluation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une évaluation de performance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee">Employé</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger data-testid="select-employee">
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reviewPeriod">Période d'évaluation</Label>
                  <Input
                    id="reviewPeriod"
                    placeholder="Ex: Q1 2024, Annuel 2024"
                    value={reviewData.reviewPeriod}
                    onChange={(e) => setReviewData({ ...reviewData, reviewPeriod: e.target.value })}
                    data-testid="input-review-period"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reviewType">Type d'évaluation</Label>
                  <Select value={reviewData.reviewType} onValueChange={(value) => setReviewData({ ...reviewData, reviewType: value })}>
                    <SelectTrigger data-testid="select-review-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annuelle</SelectItem>
                      <SelectItem value="quarterly">Trimestrielle</SelectItem>
                      <SelectItem value="probation">Période d'essai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="overallRating">Note globale (1-5)</Label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={reviewData.overallRating}
                      onChange={(e) => setReviewData({ ...reviewData, overallRating: parseInt(e.target.value) })}
                      className="w-full"
                      data-testid="slider-overall-rating"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span className="font-semibold">{reviewData.overallRating}</span>
                      <span>5</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="goals">Objectifs</Label>
                <Textarea
                  id="goals"
                  placeholder="Objectifs pour la période évaluée..."
                  value={reviewData.goals}
                  onChange={(e) => setReviewData({ ...reviewData, goals: e.target.value })}
                  data-testid="textarea-goals"
                />
              </div>

              <div>
                <Label htmlFor="achievements">Réalisations</Label>
                <Textarea
                  id="achievements"
                  placeholder="Principales réalisations..."
                  value={reviewData.achievements}
                  onChange={(e) => setReviewData({ ...reviewData, achievements: e.target.value })}
                  data-testid="textarea-achievements"
                />
              </div>

              <div>
                <Label htmlFor="improvements">Domaines d'amélioration</Label>
                <Textarea
                  id="improvements"
                  placeholder="Points à améliorer..."
                  value={reviewData.areasForImprovement}
                  onChange={(e) => setReviewData({ ...reviewData, areasForImprovement: e.target.value })}
                  data-testid="textarea-improvements"
                />
              </div>

              <div>
                <Label htmlFor="developmentPlan">Plan de développement</Label>
                <Textarea
                  id="developmentPlan"
                  placeholder="Plan de développement professionnel..."
                  value={reviewData.developmentPlan}
                  onChange={(e) => setReviewData({ ...reviewData, developmentPlan: e.target.value })}
                  data-testid="textarea-development-plan"
                />
              </div>

              <div>
                <Label htmlFor="managerComments">Commentaires du manager</Label>
                <Textarea
                  id="managerComments"
                  placeholder="Commentaires et feedback du manager..."
                  value={reviewData.managerComments}
                  onChange={(e) => setReviewData({ ...reviewData, managerComments: e.target.value })}
                  data-testid="textarea-manager-comments"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => createReviewMutation.mutate()}
                  disabled={createReviewMutation.isPending || !selectedEmployee}
                  className="flex-1"
                  data-testid="button-save-performance-review"
                >
                  {createReviewMutation.isPending ? "Création..." : "Créer l'évaluation"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((review: any) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{review.employee?.firstName} {review.employee?.lastName}</h4>
                  <p className="text-sm text-muted-foreground">{review.reviewPeriod}</p>
                </div>
                <Badge variant="outline">
                  {Array.from({ length: review.overallRating }, (_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Type: </span>
                  {review.reviewType === "annual" ? "Annuelle" : 
                   review.reviewType === "quarterly" ? "Trimestrielle" : "Période d'essai"}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Statut: </span>
                  <Badge className={review.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {review.status === "completed" ? "Terminé" : 
                     review.status === "acknowledged" ? "Validé" : "Brouillon"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <Card className="p-8 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Aucune évaluation</h3>
          <p className="text-sm text-muted-foreground">
            Commencez par créer une évaluation de performance.
          </p>
        </Card>
      )}
    </div>
  );
}

// Training Management Component  
function TrainingManagement() {
  const [programData, setProgramData] = useState({
    name: "",
    description: "",
    category: "",
    duration: "",
    isRequired: false,
    provider: "",
    cost: ""
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["/api/training-programs"]
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ["/api/employee-training"]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProgramMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/training-programs", {
        ...programData,
        duration: parseInt(programData.duration) || null
      });
    },
    onSuccess: () => {
      toast({
        title: "Programme créé",
        description: "Le programme de formation a été créé avec succès."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training-programs"] });
      setProgramData({
        name: "",
        description: "",
        category: "",
        duration: "",
        isRequired: false,
        provider: "",
        cost: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le programme.",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gestion des Formations</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="button-create-training-program">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau programme
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un programme de formation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du programme</Label>
                <Input
                  id="name"
                  placeholder="Ex: Formation sécurité aéroportuaire"
                  value={programData.name}
                  onChange={(e) => setProgramData({ ...programData, name: e.target.value })}
                  data-testid="input-program-name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description détaillée du programme..."
                  value={programData.description}
                  onChange={(e) => setProgramData({ ...programData, description: e.target.value })}
                  data-testid="textarea-program-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={programData.category} onValueChange={(value) => setProgramData({ ...programData, category: value })}>
                    <SelectTrigger data-testid="select-program-category">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safety">Sécurité</SelectItem>
                      <SelectItem value="technical">Technique</SelectItem>
                      <SelectItem value="compliance">Conformité</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="customer_service">Service client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Durée (heures)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="Ex: 8"
                    value={programData.duration}
                    onChange={(e) => setProgramData({ ...programData, duration: e.target.value })}
                    data-testid="input-program-duration"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider">Formateur/Organisme</Label>
                  <Input
                    id="provider"
                    placeholder="Ex: Centre de formation XYZ"
                    value={programData.provider}
                    onChange={(e) => setProgramData({ ...programData, provider: e.target.value })}
                    data-testid="input-program-provider"
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Coût</Label>
                  <Input
                    id="cost"
                    placeholder="Ex: 500€"
                    value={programData.cost}
                    onChange={(e) => setProgramData({ ...programData, cost: e.target.value })}
                    data-testid="input-program-cost"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={programData.isRequired}
                  onChange={(e) => setProgramData({ ...programData, isRequired: e.target.checked })}
                  data-testid="checkbox-program-required"
                />
                <Label htmlFor="isRequired">Formation obligatoire</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => createProgramMutation.mutate()}
                  disabled={createProgramMutation.isPending || !programData.name}
                  className="flex-1"
                  data-testid="button-save-training-program"
                >
                  {createProgramMutation.isPending ? "Création..." : "Créer le programme"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((program: any) => (
          <Card key={program.id}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{program.name}</h4>
                  {program.isRequired && (
                    <Badge className="bg-red-100 text-red-800">Obligatoire</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {program.description}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Durée: {program.duration}h</span>
                  <span className="text-muted-foreground">Coût: {program.cost}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Catégorie: </span>
                  <Badge variant="outline">{program.category}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {programs.length === 0 && (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Aucun programme de formation</h3>
          <p className="text-sm text-muted-foreground">
            Créez votre premier programme de formation.
          </p>
        </Card>
      )}
    </div>
  );
}

// Time Tracking Component
function TimeTracking() {
  const [timeEntry, setTimeEntry] = useState({
    employeeId: "",
    entryDate: new Date().toISOString().split('T')[0],
    clockIn: "",
    clockOut: "",
    breakStart: "",
    breakEnd: "",
    notes: ""
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"]
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["/api/time-entries"]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEntryMutation = useMutation({
    mutationFn: async () => {
      // Calculate total hours
      const clockIn = new Date(`${timeEntry.entryDate}T${timeEntry.clockIn}`);
      const clockOut = new Date(`${timeEntry.entryDate}T${timeEntry.clockOut}`);
      const breakTime = timeEntry.breakStart && timeEntry.breakEnd ? 
        (new Date(`${timeEntry.entryDate}T${timeEntry.breakEnd}`) - new Date(`${timeEntry.entryDate}T${timeEntry.breakStart}`)) / (1000 * 60) : 0;
      
      const totalMinutes = (clockOut - clockIn) / (1000 * 60) - breakTime;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.floor(totalMinutes % 60);
      const totalHours = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      await apiRequest("POST", "/api/time-entries", {
        ...timeEntry,
        employeeId: parseInt(timeEntry.employeeId),
        entryDate: new Date(timeEntry.entryDate),
        clockIn: clockIn,
        clockOut: clockOut,
        breakStart: timeEntry.breakStart ? new Date(`${timeEntry.entryDate}T${timeEntry.breakStart}`) : null,
        breakEnd: timeEntry.breakEnd ? new Date(`${timeEntry.entryDate}T${timeEntry.breakEnd}`) : null,
        totalHours
      });
    },
    onSuccess: () => {
      toast({
        title: "Temps enregistré",
        description: "L'entrée de temps a été enregistrée avec succès."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      setTimeEntry({
        employeeId: "",
        entryDate: new Date().toISOString().split('T')[0],
        clockIn: "",
        clockOut: "",
        breakStart: "",
        breakEnd: "",
        notes: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le temps.",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pointage et Suivi du Temps</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="button-create-time-entry">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle entrée
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer le temps de travail</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee">Employé</Label>
                  <Select value={timeEntry.employeeId} onValueChange={(value) => setTimeEntry({ ...timeEntry, employeeId: value })}>
                    <SelectTrigger data-testid="select-time-entry-employee">
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="entryDate">Date</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    value={timeEntry.entryDate}
                    onChange={(e) => setTimeEntry({ ...timeEntry, entryDate: e.target.value })}
                    data-testid="input-entry-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clockIn">Heure d'arrivée</Label>
                  <Input
                    id="clockIn"
                    type="time"
                    value={timeEntry.clockIn}
                    onChange={(e) => setTimeEntry({ ...timeEntry, clockIn: e.target.value })}
                    data-testid="input-clock-in"
                  />
                </div>
                <div>
                  <Label htmlFor="clockOut">Heure de départ</Label>
                  <Input
                    id="clockOut"
                    type="time"
                    value={timeEntry.clockOut}
                    onChange={(e) => setTimeEntry({ ...timeEntry, clockOut: e.target.value })}
                    data-testid="input-clock-out"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="breakStart">Début pause</Label>
                  <Input
                    id="breakStart"
                    type="time"
                    value={timeEntry.breakStart}
                    onChange={(e) => setTimeEntry({ ...timeEntry, breakStart: e.target.value })}
                    data-testid="input-break-start"
                  />
                </div>
                <div>
                  <Label htmlFor="breakEnd">Fin pause</Label>
                  <Input
                    id="breakEnd"
                    type="time"
                    value={timeEntry.breakEnd}
                    onChange={(e) => setTimeEntry({ ...timeEntry, breakEnd: e.target.value })}
                    data-testid="input-break-end"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes optionnelles..."
                  value={timeEntry.notes}
                  onChange={(e) => setTimeEntry({ ...timeEntry, notes: e.target.value })}
                  data-testid="textarea-time-entry-notes"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => createEntryMutation.mutate()}
                  disabled={createEntryMutation.isPending || !timeEntry.employeeId || !timeEntry.clockIn || !timeEntry.clockOut}
                  className="flex-1"
                  data-testid="button-save-time-entry"
                >
                  {createEntryMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timeEntries.slice(0, 10).map((entry: any) => (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{entry.employee?.firstName} {entry.employee?.lastName}</h4>
                  <Badge className={entry.status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {entry.status === "approved" ? "Approuvé" : 
                     entry.status === "rejected" ? "Rejeté" : "En attente"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(entry.entryDate).toLocaleDateString('fr-FR')}
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Arrivée:</span>
                    <span>{entry.clockIn ? new Date(entry.clockIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Départ:</span>
                    <span>{entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{entry.totalHours || '-'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {timeEntries.length === 0 && (
        <Card className="p-8 text-center">
          <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Aucune entrée de temps</h3>
          <p className="text-sm text-muted-foreground">
            Commencez à enregistrer le temps de travail.
          </p>
        </Card>
      )}
    </div>
  );
}

export default function EmployeeManagement() {
  const { user } = useAuth();

  if (!user || (user as any).role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Accès restreint</h2>
          <p className="text-muted-foreground">
            Seuls les administrateurs peuvent accéder à cette section.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-600 to-green-600">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion Complète des Employés
              </h1>
              <p className="text-muted-foreground">
                Performance, formations, pointage et développement professionnel
              </p>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance" data-testid="tab-performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="training" data-testid="tab-training">
              <BookOpen className="h-4 w-4 mr-2" />
              Formations
            </TabsTrigger>
            <TabsTrigger value="time" data-testid="tab-time">
              <Clock className="h-4 w-4 mr-2" />
              Pointage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-6">
            <PerformanceReviews />
          </TabsContent>

          <TabsContent value="training" className="mt-6">
            <TrainingManagement />
          </TabsContent>

          <TabsContent value="time" className="mt-6">
            <TimeTracking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
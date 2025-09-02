import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar,
  Clock,
  User,
  Star,
  MessageSquare,
  Phone,
  Video,
  Building,
  ChevronRight,
  CheckCircle,
  XCircle,
  Users,
  ClipboardCheck
} from "lucide-react";

interface Interview {
  id: number;
  candidateId: string;
  applicationId: number;
  interviewerId: string;
  interviewType: string;
  scheduledDateTime: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  status: string;
  notes?: string;
  createdAt: string;
  application?: {
    id: number;
    candidateName: string;
    jobTitle: string;
  };
}

interface InterviewEvaluation {
  id: number;
  interviewId: number;
  criteriaName: string;
  score: number;
  maxScore: number;
  comments?: string;
}

interface InterviewFeedback {
  id: number;
  interviewId: number;
  overallScore: number;
  recommendation: string;
  strengths?: string;
  weaknesses?: string;
  detailedFeedback?: string;
  culturalFit?: number;
  technicalCompetency?: number;
  communicationSkills?: number;
  problemSolving?: number;
}

function InterviewCard({ interview, onOpenEvaluation }: { interview: Interview; onOpenEvaluation: (interview: Interview) => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "no_show": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "phone": return <Phone className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "onsite": return <Building className="h-4 w-4" />;
      case "technical": return <ClipboardCheck className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              {interview.application?.candidateName || `Candidat ${interview.candidateId}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {interview.application?.jobTitle || "Poste non spécifié"}
            </p>
          </div>
          <Badge className={getStatusColor(interview.status)}>
            {interview.status === "scheduled" ? "Planifié" :
             interview.status === "completed" ? "Terminé" :
             interview.status === "cancelled" ? "Annulé" : "Absent"}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            {getTypeIcon(interview.interviewType)}
            <span className="capitalize">{interview.interviewType}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{new Date(interview.scheduledDateTime).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>{new Date(interview.scheduledDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>({interview.duration} min)</span>
          </div>
          {interview.location && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4" />
              <span>{interview.location}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onOpenEvaluation(interview)}
            disabled={interview.status !== "completed"}
            className="flex-1"
            data-testid={`button-evaluate-${interview.id}`}
          >
            <Star className="h-4 w-4 mr-2" />
            {interview.status === "completed" ? "Évaluer" : "En attente"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InterviewEvaluationForm({ interview, onClose }: { interview: Interview; onClose: () => void }) {
  const [evaluations, setEvaluations] = useState([
    { criteriaName: "Compétences techniques", score: 5, comments: "" },
    { criteriaName: "Communication", score: 5, comments: "" },
    { criteriaName: "Résolution de problèmes", score: 5, comments: "" },
    { criteriaName: "Adaptation culturelle", score: 5, comments: "" },
    { criteriaName: "Motivation", score: 5, comments: "" }
  ]);
  
  const [feedback, setFeedback] = useState({
    recommendation: "hire",
    strengths: "",
    weaknesses: "",
    detailedFeedback: "",
    culturalFit: 5,
    technicalCompetency: 5,
    communicationSkills: 5,
    problemSolving: 5
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveEvaluationMutation = useMutation({
    mutationFn: async () => {
      // Calculate overall score based on evaluations
      const overallScore = Math.round(
        evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length * 10
      );

      // Save evaluations
      for (const evaluation of evaluations) {
        await apiRequest("POST", "/api/interviews/evaluations", {
          interviewId: interview.id,
          criteriaName: evaluation.criteriaName,
          score: evaluation.score,
          maxScore: 10,
          comments: evaluation.comments
        });
      }

      // Save overall feedback
      await apiRequest("POST", "/api/interviews/feedback", {
        interviewId: interview.id,
        overallScore,
        ...feedback
      });
    },
    onSuccess: () => {
      toast({
        title: "Évaluation sauvegardée",
        description: "L'évaluation de l'interview a été enregistrée avec succès."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder l'évaluation.",
        variant: "destructive"
      });
    }
  });

  const updateEvaluation = (index: number, field: string, value: any) => {
    const newEvaluations = [...evaluations];
    newEvaluations[index] = { ...newEvaluations[index], [field]: value };
    setEvaluations(newEvaluations);
  };

  const overallScore = Math.round(
    evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length * 10
  );

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Informations de l'interview</h3>
        <p><strong>Candidat:</strong> {interview.application?.candidateName || interview.candidateId}</p>
        <p><strong>Poste:</strong> {interview.application?.jobTitle}</p>
        <p><strong>Type:</strong> {interview.interviewType}</p>
        <p><strong>Date:</strong> {new Date(interview.scheduledDateTime).toLocaleDateString('fr-FR')}</p>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Évaluation par critères</h3>
        <div className="space-y-4">
          {evaluations.map((evaluation, index) => (
            <Card key={evaluation.criteriaName}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">{evaluation.criteriaName}</Label>
                    <div className="text-sm text-muted-foreground">
                      {evaluation.score}/10
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={evaluation.score}
                      onChange={(e) => updateEvaluation(index, "score", parseInt(e.target.value))}
                      className="w-full"
                      data-testid={`slider-${evaluation.criteriaName.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Insuffisant</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                  
                  <Textarea
                    placeholder={`Commentaires sur ${evaluation.criteriaName.toLowerCase()}...`}
                    value={evaluation.comments}
                    onChange={(e) => updateEvaluation(index, "comments", e.target.value)}
                    data-testid={`textarea-${evaluation.criteriaName.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Score global</h3>
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{overallScore}/100</div>
            <Progress value={overallScore} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              Calculé automatiquement à partir des critères d'évaluation
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Recommandation finale</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="recommendation">Recommandation</Label>
            <Select
              value={feedback.recommendation}
              onValueChange={(value) => setFeedback({ ...feedback, recommendation: value })}
            >
              <SelectTrigger data-testid="select-recommendation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hire">Recommander l'embauche</SelectItem>
                <SelectItem value="second_interview">Deuxième entretien</SelectItem>
                <SelectItem value="reject">Ne pas retenir</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="strengths">Points forts</Label>
            <Textarea
              id="strengths"
              placeholder="Décrivez les principales forces du candidat..."
              value={feedback.strengths}
              onChange={(e) => setFeedback({ ...feedback, strengths: e.target.value })}
              data-testid="textarea-strengths"
            />
          </div>

          <div>
            <Label htmlFor="weaknesses">Points d'amélioration</Label>
            <Textarea
              id="weaknesses"
              placeholder="Identifiez les domaines d'amélioration..."
              value={feedback.weaknesses}
              onChange={(e) => setFeedback({ ...feedback, weaknesses: e.target.value })}
              data-testid="textarea-weaknesses"
            />
          </div>

          <div>
            <Label htmlFor="detailed-feedback">Commentaire détaillé</Label>
            <Textarea
              id="detailed-feedback"
              placeholder="Feedback détaillé sur l'entretien..."
              value={feedback.detailedFeedback}
              onChange={(e) => setFeedback({ ...feedback, detailedFeedback: e.target.value })}
              rows={4}
              data-testid="textarea-detailed-feedback"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
          data-testid="button-cancel-evaluation"
        >
          Annuler
        </Button>
        <Button
          onClick={() => saveEvaluationMutation.mutate()}
          disabled={saveEvaluationMutation.isPending}
          className="flex-1"
          data-testid="button-save-evaluation"
        >
          {saveEvaluationMutation.isPending ? "Sauvegarde..." : "Sauvegarder l'évaluation"}
        </Button>
      </div>
    </div>
  );
}

export default function InterviewManagement() {
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const { user } = useAuth();

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ["/api/interviews"],
    enabled: !!user
  });

  const filteredInterviews = interviews.filter((interview: Interview) => {
    if (statusFilter !== "all" && interview.status !== statusFilter) return false;
    if (typeFilter !== "all" && interview.interviewType !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: interviews.length,
    scheduled: interviews.filter((i: Interview) => i.status === "scheduled").length,
    completed: interviews.filter((i: Interview) => i.status === "completed").length,
    pending_evaluation: interviews.filter((i: Interview) => i.status === "completed").length // À améliorer avec vraie logique
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                Gestion des Entretiens
              </h1>
              <p className="text-muted-foreground">
                Planifiez et évaluez les entretiens candidats
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Planifiés</p>
                    <p className="text-2xl font-bold">{stats.scheduled}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Terminés</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">À évaluer</p>
                    <p className="text-2xl font-bold">{stats.pending_evaluation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="scheduled">Planifiés</SelectItem>
                <SelectItem value="completed">Terminés</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48" data-testid="select-type-filter">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="phone">Téléphone</SelectItem>
                <SelectItem value="video">Visio</SelectItem>
                <SelectItem value="onsite">Sur site</SelectItem>
                <SelectItem value="technical">Technique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Interviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInterviews.map((interview: Interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onOpenEvaluation={setSelectedInterview}
            />
          ))}
        </div>

        {filteredInterviews.length === 0 && (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Users className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold mb-2">Aucun entretien trouvé</h3>
                <p className="text-sm text-muted-foreground">
                  Aucun entretien ne correspond aux filtres sélectionnés.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Evaluation Dialog */}
        <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Évaluation de l'entretien</DialogTitle>
            </DialogHeader>
            {selectedInterview && (
              <InterviewEvaluationForm
                interview={selectedInterview}
                onClose={() => setSelectedInterview(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
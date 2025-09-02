import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plane,
  FileText,
  Calendar,
  User,
  Target,
  MessageCircle,
  Trophy,
  Star,
  ArrowRight
} from "lucide-react";

interface OnboardingStep {
  id: number;
  stepNumber: number;
  title: string;
  description: string;
  category: string;
  isRequired: boolean;
  estimatedDuration: number;
  assignedRole: string;
}

interface StepCompletion {
  id: number;
  candidateOnboardingId: number;
  stepId: number;
  status: string;
  completionDate?: string;
  notes?: string;
  completedBy?: string;
  step?: OnboardingStep;
}

interface CandidateOnboarding {
  id: number;
  userId: string;
  processId: number;
  status: string;
  progress: number;
  startDate: string;
  expectedCompletionDate: string;
  assignedMentor: string;
  notes: string;
  actualCompletionDate?: string;
}

export default function CandidateOnboarding() {
  const { user } = useAuth();
  const [selectedCompletion, setSelectedCompletion] = useState<StepCompletion | null>(null);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch candidate's onboarding records
  const { data: onboardings = [], isLoading: onboardingsLoading } = useQuery({
    queryKey: ["/api/onboarding/candidates/user", user?.id],
    enabled: !!user?.id,
  });

  const currentOnboarding = onboardings.find((o: CandidateOnboarding) => o.status !== 'completed');

  // Fetch onboarding steps for current onboarding
  const { data: stepCompletions = [], isLoading: stepsLoading } = useQuery({
    queryKey: ["/api/onboarding/candidates", currentOnboarding?.id, "steps"],
    enabled: !!currentOnboarding?.id,
  });

  // Update step completion mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ completionId, data }: { completionId: number; data: any }) =>
      apiRequest("PUT", `/api/onboarding/steps/${completionId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/candidates"] });
      setCompletionDialogOpen(false);
      setSelectedCompletion(null);
      toast({
        title: "Étape mise à jour",
        description: "Le statut de l'étape a été mis à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de l'étape.",
        variant: "destructive",
      });
    },
  });

  const handleMarkComplete = (completion: StepCompletion) => {
    setSelectedCompletion(completion);
    setCompletionDialogOpen(true);
  };

  const handleSubmitCompletion = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCompletion) return;

    const formData = new FormData(event.currentTarget);
    const notes = formData.get("notes") as string;

    updateStepMutation.mutate({
      completionId: selectedCompletion.id,
      data: {
        status: "completed",
        notes: notes,
        candidateOnboardingId: selectedCompletion.candidateOnboardingId
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'formation': return <Target className="h-4 w-4" />;
      case 'administrative': return <User className="h-4 w-4" />;
      case 'technique': return <Plane className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (onboardingsLoading || stepsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!currentOnboarding) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Plane className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Aucun Onboarding en Cours</h1>
            <p className="text-muted-foreground">
              Vous n'avez actuellement aucun processus d'onboarding en cours. 
              Contactez votre responsable RH pour plus d'informations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const completedSteps = stepCompletions.filter((sc: StepCompletion) => sc.status === 'completed').length;
  const totalSteps = stepCompletions.length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Plane className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mon Onboarding</h1>
              <p className="text-muted-foreground">Suivez votre progression d'intégration</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/achievements">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Mes Badges</h3>
                    <p className="text-sm text-muted-foreground">Découvrez vos achievements</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/onboarding-calendar">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Calendrier</h3>
                    <p className="text-sm text-muted-foreground">Planifiez vos événements</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/onboarding-feedback">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Feedback</h3>
                    <p className="text-sm text-muted-foreground">Évaluez votre expérience</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Vue d'ensemble de votre progression
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{currentOnboarding.progress}%</div>
                <div className="text-sm text-muted-foreground">Progression</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{completedSteps}/{totalSteps}</div>
                <div className="text-sm text-muted-foreground">Étapes terminées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalSteps - completedSteps}</div>
                <div className="text-sm text-muted-foreground">Étapes restantes</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  {getStatusIcon(currentOnboarding.status)}
                  <Badge className={getStatusColor(currentOnboarding.status)}>
                    {currentOnboarding.status === 'pending' ? 'En attente' :
                     currentOnboarding.status === 'in_progress' ? 'En cours' : 'Terminé'}
                  </Badge>
                </div>
              </div>
            </div>

            <Progress value={currentOnboarding.progress} className="h-3" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Début : {new Date(currentOnboarding.startDate).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Fin prévue : {new Date(currentOnboarding.expectedCompletionDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            {currentOnboarding.notes && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Notes</span>
                </div>
                <p className="text-sm">{currentOnboarding.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Onboarding Steps */}
        <div className="grid gap-4">
          <h2 className="text-2xl font-bold">Étapes d'onboarding</h2>
          
          {stepCompletions.map((completion: StepCompletion) => (
            <Card key={completion.id} className={`transition-all ${
              completion.status === 'completed' ? 'border-green-200 bg-green-50/50' :
              completion.status === 'in_progress' ? 'border-blue-200 bg-blue-50/50' :
              'border-gray-200'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(completion.step?.category || '')}
                      <span className="text-sm font-medium text-muted-foreground">
                        Étape {completion.step?.stepNumber}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{completion.step?.title}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(completion.status)}
                    <Badge className={getStatusColor(completion.status)}>
                      {completion.status === 'pending' ? 'En attente' :
                       completion.status === 'in_progress' ? 'En cours' : 'Terminé'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {completion.step?.description && (
                  <p className="text-muted-foreground">{completion.step.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{completion.step?.estimatedDuration}h estimées</span>
                    </div>
                    <Badge variant="outline">{completion.step?.category}</Badge>
                    {completion.step?.isRequired && (
                      <Badge variant="destructive">Obligatoire</Badge>
                    )}
                  </div>
                  
                  {completion.status !== 'completed' && (
                    <Button 
                      onClick={() => handleMarkComplete(completion)}
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marquer comme terminé
                    </Button>
                  )}
                </div>

                {completion.status === 'completed' && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Étape terminée</span>
                      {completion.completionDate && (
                        <span className="text-sm text-green-600">
                          le {new Date(completion.completionDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    {completion.notes && (
                      <p className="text-sm text-green-700 mt-2">{completion.notes}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completion Dialog */}
        <Dialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marquer l'étape comme terminée</DialogTitle>
            </DialogHeader>
            
            {selectedCompletion && (
              <form onSubmit={handleSubmitCompletion} className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">{selectedCompletion.step?.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCompletion.step?.description}</p>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    placeholder="Ajoutez des notes sur la réalisation de cette étape..."
                    className="mt-2"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCompletionDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={updateStepMutation.isPending}>
                    {updateStepMutation.isPending ? "Marquage..." : "Marquer comme terminé"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
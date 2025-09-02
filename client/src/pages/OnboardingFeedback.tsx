import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  ArrowLeft,
  Plane,
  CheckCircle,
  Heart
} from "lucide-react";

interface OnboardingFeedback {
  id: number;
  candidateOnboardingId: number;
  userId: string;
  stepId?: number;
  overallRating: number;
  stepRating?: number;
  clarity: number;
  support: number;
  usefulness: number;
  comments?: string;
  suggestions?: string;
  wouldRecommend?: boolean;
  createdAt: string;
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

export default function OnboardingFeedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    overallRating: 0,
    clarity: 0,
    support: 0,
    usefulness: 0,
    comments: "",
    suggestions: "",
    wouldRecommend: true
  });

  // Fetch candidate's onboarding records
  const { data: onboardings = [], isLoading: onboardingsLoading } = useQuery({
    queryKey: ["/api/onboarding/candidates/user", user?.id],
    enabled: !!user?.id,
  });

  const currentOnboarding = onboardings.find((o: CandidateOnboarding) => o.status !== 'completed');

  // Fetch existing feedback
  const { data: existingFeedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["/api/onboarding/feedback"],
    enabled: !!currentOnboarding?.id,
  });

  const userFeedback = existingFeedback.find((f: OnboardingFeedback) => 
    f.candidateOnboardingId === currentOnboarding?.id && f.userId === user?.id
  );

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) =>
      apiRequest("POST", "/api/onboarding/feedback", feedbackData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/feedback"] });
      toast({
        title: "Feedback Envoyé",
        description: "Merci pour votre retour ! Votre feedback nous aide à améliorer l'expérience d'onboarding.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi du feedback.",
        variant: "destructive",
      });
    },
  });

  const handleStarClick = (rating: number, field: string) => {
    setFormData(prev => ({ ...prev, [field]: rating }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!currentOnboarding) {
      toast({
        title: "Erreur",
        description: "Aucun processus d'onboarding trouvé.",
        variant: "destructive",
      });
      return;
    }

    if (formData.overallRating === 0 || formData.clarity === 0 || 
        formData.support === 0 || formData.usefulness === 0) {
      toast({
        title: "Évaluation incomplète",
        description: "Veuillez évaluer tous les critères avec des étoiles.",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate({
      candidateOnboardingId: currentOnboarding.id,
      ...formData
    });
  };

  const renderStars = (rating: number, field: string, label: string) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star, field)}
            className={`p-1 transition-colors ${
              star <= rating 
                ? "text-yellow-400 hover:text-yellow-500" 
                : "text-gray-300 hover:text-gray-400"
            }`}
            data-testid={`star-${field}-${star}`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating}/5 {rating === 5 ? "Excellent" : rating >= 4 ? "Très bien" : rating >= 3 ? "Bien" : rating >= 2 ? "Correct" : rating > 0 ? "À améliorer" : ""}
        </span>
      </div>
    </div>
  );

  if (onboardingsLoading || feedbackLoading) {
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
            <p className="text-muted-foreground mb-4">
              Vous n'avez actuellement aucun processus d'onboarding en cours pour évaluer.
            </p>
            <Link to="/candidate-onboarding">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'Onboarding
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (userFeedback) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <span>Feedback Déjà Envoyé</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Merci d'avoir partagé votre expérience d'onboarding !
              </p>
            </div>
            <Link to="/candidate-onboarding">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Votre Évaluation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{userFeedback.overallRating}/5</div>
                  <div className="text-sm text-muted-foreground">Note Globale</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userFeedback.clarity}/5</div>
                  <div className="text-sm text-muted-foreground">Clarté</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userFeedback.support}/5</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userFeedback.usefulness}/5</div>
                  <div className="text-sm text-muted-foreground">Utilité</div>
                </div>
              </div>

              {userFeedback.comments && (
                <div>
                  <Label className="text-sm font-medium">Commentaires</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {userFeedback.comments}
                  </div>
                </div>
              )}

              {userFeedback.suggestions && (
                <div>
                  <Label className="text-sm font-medium">Suggestions</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {userFeedback.suggestions}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge variant={userFeedback.wouldRecommend ? "default" : "secondary"}>
                  {userFeedback.wouldRecommend ? "Recommande l'expérience" : "Ne recommande pas"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <span>Évaluez votre Onboarding</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Votre feedback nous aide à améliorer l'expérience d'intégration
            </p>
          </div>
          <Link to="/candidate-onboarding">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Évaluation de votre Expérience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStars(formData.overallRating, "overallRating", "Note globale de l'expérience")}
              
              <div className="grid md:grid-cols-3 gap-6">
                {renderStars(formData.clarity, "clarity", "Clarté des instructions")}
                {renderStars(formData.support, "support", "Qualité du support")}
                {renderStars(formData.usefulness, "usefulness", "Utilité du processus")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commentaires et Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="comments">Commentaires sur votre expérience</Label>
                <Textarea
                  id="comments"
                  data-testid="input-comments"
                  placeholder="Décrivez votre expérience d'onboarding..."
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="suggestions">Suggestions d'amélioration</Label>
                <Textarea
                  id="suggestions"
                  data-testid="input-suggestions"
                  placeholder="Que pourrait-on améliorer ?"
                  value={formData.suggestions}
                  onChange={(e) => setFormData(prev => ({ ...prev, suggestions: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-3">
                <Label htmlFor="wouldRecommend">Recommanderiez-vous cette expérience ?</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="wouldRecommend"
                      data-testid="radio-recommend-yes"
                      checked={formData.wouldRecommend === true}
                      onChange={() => setFormData(prev => ({ ...prev, wouldRecommend: true }))}
                      className="text-primary"
                    />
                    <span>Oui</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="wouldRecommend"
                      data-testid="radio-recommend-no"
                      checked={formData.wouldRecommend === false}
                      onChange={() => setFormData(prev => ({ ...prev, wouldRecommend: false }))}
                      className="text-primary"
                    />
                    <span>Non</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Link to="/candidate-onboarding">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button 
              type="submit" 
              data-testid="button-submit-feedback"
              disabled={submitFeedbackMutation.isPending}
              className="flex items-center gap-2"
            >
              {submitFeedbackMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <ThumbsUp className="h-4 w-4" />
              )}
              Envoyer le Feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
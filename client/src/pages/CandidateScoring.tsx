import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { 
  Award, 
  Star, 
  Send,
  Briefcase,
  LogOut,
  User,
  Target,
  Trophy
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CandidateScoring() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<{ [key: number]: number }>({});
  const [notes, setNotes] = useState<{ [key: number]: string }>({});

  const { data: assignedCandidates = [], isLoading } = useQuery({
    queryKey: ["/api/recruiter/assigned-candidates"],
  });

  const scoreMutation = useMutation({
    mutationFn: async ({ applicationId, score, note }: { applicationId: number, score: number, note?: string }) => {
      await apiRequest("PUT", `/api/recruiter/score/${applicationId}`, {
        score,
        notes: note
      });
    },
    onSuccess: () => {
      toast({
        title: "Note enregistrée",
        description: "La note a été enregistrée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/assigned-candidates"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement de la note.",
        variant: "destructive",
      });
    }
  });

  const handleScoreChange = (applicationId: number, value: number[]) => {
    setScores(prev => ({ ...prev, [applicationId]: value[0] }));
  };

  const handleNotesChange = (applicationId: number, value: string) => {
    setNotes(prev => ({ ...prev, [applicationId]: value }));
  };

  const handleSubmitScore = (applicationId: number) => {
    const score = scores[applicationId];
    const note = notes[applicationId];

    if (score === undefined) {
      toast({
        title: "Note requise",
        description: "Veuillez attribuer une note avant de valider.",
        variant: "destructive",
      });
      return;
    }

    scoreMutation.mutate({ applicationId, score, note });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Très Bon";
    if (score >= 70) return "Bon";
    if (score >= 60) return "Moyen";
    if (score >= 40) return "Passable";
    return "Insuffisant";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Interface Recruteur</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.firstName} {user?.lastName}
              </span>
              <Badge variant="secondary">
                {user?.role === "admin" ? "Super Admin" : 
                 user?.role === "hr" ? "RH" : "Recruteur"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex space-x-6 mb-8 border-b border-border">
          {(user?.role === "hr" || user?.role === "admin") && (
            <>
              <Link href="/admin">
                <Button variant="ghost" className="text-muted-foreground">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Tableau de bord
                </Button>
              </Link>
              <Link href="/admin/assignment">
                <Button variant="ghost" className="text-muted-foreground">
                  <Target className="h-4 w-4 mr-2" />
                  Affectation
                </Button>
              </Link>
            </>
          )}
          <Button variant="ghost" className="border-b-2 border-primary text-primary">
            <Award className="h-4 w-4 mr-2" />
            Notation des Candidats
          </Button>
          {(user?.role === "hr" || user?.role === "admin") && (
            <Link href="/admin/final-results">
              <Button variant="ghost" className="text-muted-foreground">
                <Trophy className="h-4 w-4 mr-2" />
                Résultats Finaux
              </Button>
            </Link>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-6">Notation des Candidats Assignés</h1>

        {isLoading ? (
          <div className="text-center py-8">Chargement des candidats...</div>
        ) : assignedCandidates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun candidat ne vous a été assigné pour le moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {assignedCandidates.map((application: any) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>
                          {application.candidate.firstName} {application.candidate.lastName}
                        </span>
                        {application.manualScore && (
                          <Badge variant="secondary">
                            Déjà noté: {application.manualScore}/100
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-muted-foreground">
                        Candidature pour: <strong>{application.job.title}</strong>
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      Score Auto: {application.autoScore}/100
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Candidate Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <strong>Email:</strong> {application.candidate.email}
                    </div>
                    <div>
                      <strong>Téléphone:</strong> {application.candidate.phone || 'Non renseigné'}
                    </div>
                    <div>
                      <strong>Disponibilité:</strong> {
                        application.availabilityDate 
                          ? new Date(application.availabilityDate).toLocaleDateString('fr-FR')
                          : 'Immédiatement'
                      }
                    </div>
                    <div>
                      <strong>Salaire souhaité:</strong> {application.salaryExpectation || 'Non précisé'}
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {application.coverLetter && (
                    <div>
                      <h4 className="font-semibold mb-2">Lettre de motivation:</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">
                        {application.coverLetter}
                      </p>
                    </div>
                  )}

                  {/* Score automatique details */}
                  <div>
                    <h4 className="font-semibold mb-3">Détail du score automatique:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold">Expérience</div>
                        <div className="text-blue-600">
                          {application.factors?.experienceMatch || 0}/25
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold">Compétences</div>
                        <div className="text-blue-600">
                          {application.factors?.skillsMatch || 0}/30
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold">Disponibilité</div>
                        <div className="text-blue-600">
                          {application.factors?.availabilityScore || 0}/15
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold">Salaire</div>
                        <div className="text-blue-600">
                          {application.factors?.salaryFit || 0}/15
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold">Qualité</div>
                        <div className="text-blue-600">
                          {application.factors?.applicationQuality || 0}/15
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manual Scoring */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-4">Votre évaluation:</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium">
                            Note globale: {scores[application.id] || application.manualScore || 0}/100
                          </label>
                          <span className={`text-sm font-semibold ${getScoreColor(scores[application.id] || application.manualScore || 0)}`}>
                            {getScoreLabel(scores[application.id] || application.manualScore || 0)}
                          </span>
                        </div>
                        <Slider
                          value={[scores[application.id] || application.manualScore || 0]}
                          onValueChange={(value) => handleScoreChange(application.id, value)}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Commentaires (optionnel):
                        </label>
                        <Textarea
                          placeholder="Vos observations sur ce candidat..."
                          value={notes[application.id] || application.scoreNotes || ''}
                          onChange={(e) => handleNotesChange(application.id, e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleSubmitScore(application.id)}
                        disabled={scoreMutation.isPending}
                        className="w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {scoreMutation.isPending ? "Enregistrement..." : "Enregistrer l'Évaluation"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
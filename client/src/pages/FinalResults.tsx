import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, 
  Medal,
  Award,
  Crown,
  Star,
  Briefcase,
  LogOut,
  Target,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface CandidateScore {
  applicationId: number;
  candidate: any;
  job: any;
  autoScore: number;
  manualScore: number;
  totalScore: number;
  factors: any;
}

export default function FinalResults() {
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState<string>("");

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/admin/jobs"],
  });

  const { data: finalTop3 = [], isLoading } = useQuery({
    queryKey: ["/api/admin/final-top3", selectedJob],
    enabled: !!selectedJob,
  });

  const getPodiumIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-8 w-8 text-yellow-500" />;
      case 2: return <Medal className="h-8 w-8 text-gray-400" />;
      case 3: return <Award className="h-8 w-8 text-amber-600" />;
      default: return <Star className="h-6 w-6 text-blue-500" />;
    }
  };

  const getPodiumColor = (rank: number) => {
    switch (rank) {
      case 1: return "from-yellow-100 to-yellow-50 border-yellow-200";
      case 2: return "from-gray-100 to-gray-50 border-gray-200";
      case 3: return "from-amber-100 to-amber-50 border-amber-200";
      default: return "from-blue-100 to-blue-50 border-blue-200";
    }
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
              <span className="text-xl font-bold text-foreground">Résultats Finaux</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.firstName} {user?.lastName}
              </span>
              <Badge variant="secondary">
                {(user as any)?.role === "admin" ? "Super Admin" : 
                 (user as any)?.role === "hr" ? "RH" : "Recruteur"}
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
          <Link href="/admin/scoring">
            <Button variant="ghost" className="text-muted-foreground">
              <Award className="h-4 w-4 mr-2" />
              Notation
            </Button>
          </Link>
          <Button variant="ghost" className="border-b-2 border-primary text-primary">
            <Trophy className="h-4 w-4 mr-2" />
            Résultats Finaux
          </Button>
        </div>

        <div className="text-center mb-8">
          <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-3xl font-bold mb-2">TOP 3 FINAL</h1>
          <p className="text-muted-foreground">
            Les 3 meilleurs candidats sélectionnés après évaluation complète
          </p>
        </div>

        {/* Job Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sélectionner l'offre d'emploi</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisissez une offre d'emploi pour voir les résultats" />
              </SelectTrigger>
              <SelectContent>
                {(jobs as any[]).map((job: any) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.title} - {job.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Results */}
        {selectedJob && (
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
                <p>Calcul des résultats finaux...</p>
              </div>
            ) : (finalTop3 as any[]).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun résultat disponible</h3>
                  <p className="text-muted-foreground">
                    Aucun candidat n'a encore été noté par les recruteurs pour cette offre.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {(finalTop3 as CandidateScore[]).map((candidate: CandidateScore, index: number) => (
                  <Card key={candidate.applicationId} className={`bg-gradient-to-r ${getPodiumColor(index + 1)} border-2`}>
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        {getPodiumIcon(index + 1)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <CardTitle className="text-2xl">
                              #{index + 1} - {candidate.candidate.firstName} {candidate.candidate.lastName}
                            </CardTitle>
                            <Badge variant="default" className="text-lg px-3 py-1">
                              {candidate.totalScore}/100
                            </Badge>
                          </div>
                          <p className="text-lg text-muted-foreground">
                            {candidate.job.title} - {candidate.job.company}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/70 rounded-lg">
                        <div>
                          <strong>Email:</strong> {candidate.candidate.email}
                        </div>
                        <div>
                          <strong>Téléphone:</strong> {candidate.candidate.phone || 'Non renseigné'}
                        </div>
                        <div>
                          <strong>Salaire souhaité:</strong> {candidate.job.salaryExpectation || 'Non précisé'}
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Scores Détaillés
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                              <span className="text-sm">Score Automatique:</span>
                              <Badge variant="outline">{candidate.autoScore}/100</Badge>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                              <span className="text-sm">Note Recruteur:</span>
                              <Badge variant="outline">{candidate.manualScore}/100</Badge>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-primary text-primary-foreground rounded font-semibold">
                              <span>Score Final:</span>
                              <span>{candidate.totalScore}/100</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Critères Automatiques</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-center p-2 bg-white/50 rounded">
                              <div className="font-semibold">Expérience</div>
                              <div className="text-blue-600">
                                {candidate.factors.experienceMatch}/25
                              </div>
                            </div>
                            <div className="text-center p-2 bg-white/50 rounded">
                              <div className="font-semibold">Compétences</div>
                              <div className="text-blue-600">
                                {candidate.factors.skillsMatch}/30
                              </div>
                            </div>
                            <div className="text-center p-2 bg-white/50 rounded">
                              <div className="font-semibold">Disponibilité</div>
                              <div className="text-blue-600">
                                {candidate.factors.availabilityScore}/15
                              </div>
                            </div>
                            <div className="text-center p-2 bg-white/50 rounded">
                              <div className="font-semibold">Salaire</div>
                              <div className="text-blue-600">
                                {candidate.factors.salaryFit}/15
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recruiter Notes */}
                      {candidate.candidate.scoreNotes && (
                        <div>
                          <h4 className="font-semibold mb-2">Notes du Recruteur:</h4>
                          <p className="text-sm p-3 bg-white/50 rounded italic">
                            "{candidate.candidate.scoreNotes}"
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Summary */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-center flex items-center justify-center">
                      <Star className="h-6 w-6 mr-2 text-blue-600" />
                      Processus de Sélection Terminé
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Les 3 meilleurs candidats ont été identifiés grâce à notre processus de sélection en 2 étapes :
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-white/70 rounded">
                        <strong>1. Tri Automatique</strong><br />
                        Analyse de l'expérience, compétences, disponibilité et adéquation salariale
                      </div>
                      <div className="p-3 bg-white/70 rounded">
                        <strong>2. Évaluation Humaine</strong><br />
                        Notation détaillée par les recruteurs experts
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
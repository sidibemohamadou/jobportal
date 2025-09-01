import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Award, 
  TrendingUp, 
  UserCheck,
  Briefcase,
  LogOut,
  Star,
  Target
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CandidateScore {
  applicationId: number;
  candidate: any;
  job: any;
  autoScore: number;
  totalScore: number;
  factors: {
    experienceMatch: number;
    skillsMatch: number;
    availabilityScore: number;
    salaryFit: number;
    applicationQuality: number;
  };
}

export default function CandidateAssignment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>("");

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/admin/jobs"],
  });

  const { data: recruiters = [] } = useQuery({
    queryKey: ["/api/admin/recruiters"],
  });

  const { data: topCandidates = [], isLoading } = useQuery({
    queryKey: ["/api/admin/top-candidates", selectedJob],
    enabled: !!selectedJob,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ candidateIds, recruiterId }: { candidateIds: number[], recruiterId: string }) => {
      await apiRequest("POST", "/api/admin/assign-candidates", {
        applicationIds: candidateIds,
        recruiterId
      });
    },
    onSuccess: () => {
      toast({
        title: "Affectation réussie",
        description: "Les candidats ont été assignés avec succès.",
      });
      setSelectedCandidates([]);
      setSelectedRecruiter("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/top-candidates"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'affectation des candidats.",
        variant: "destructive",
      });
    }
  });

  const handleCandidateSelect = (candidateId: number, checked: boolean) => {
    if (checked) {
      setSelectedCandidates(prev => [...prev, candidateId]);
    } else {
      setSelectedCandidates(prev => prev.filter(id => id !== candidateId));
    }
  };

  const handleAssignCandidates = () => {
    if (selectedCandidates.length === 0 || !selectedRecruiter) {
      toast({
        title: "Sélection incomplète",
        description: "Veuillez sélectionner des candidats et un recruteur.",
        variant: "destructive",
      });
      return;
    }

    assignMutation.mutate({
      candidateIds: selectedCandidates,
      recruiterId: selectedRecruiter
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 font-semibold";
    if (score >= 60) return "text-blue-600 font-semibold";
    if (score >= 40) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-blue-100 text-blue-800";
    if (score >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
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
              <span className="text-xl font-bold text-foreground">Admin RH</span>
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
          <Link href="/admin">
            <Button variant="ghost" className="text-muted-foreground">
              <Briefcase className="h-4 w-4 mr-2" />
              Tableau de bord
            </Button>
          </Link>
          <Button variant="ghost" className="border-b-2 border-primary text-primary">
            <Target className="h-4 w-4 mr-2" />
            Affectation Candidats
          </Button>
          <Link href="/admin/scoring">
            <Button variant="ghost" className="text-muted-foreground">
              <Award className="h-4 w-4 mr-2" />
              Notation
            </Button>
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">Affectation des Candidats - Top 10 Automatique</h1>

        {/* Job Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Sélectionner l'offre d'emploi</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisissez une offre d'emploi" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job: any) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.title} - {job.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Top 10 Candidates */}
        {selectedJob && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                2. Top 10 des Meilleurs Candidats (Tri Automatique)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Calcul des scores en cours...</div>
              ) : topCandidates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune candidature pour cette offre
                </div>
              ) : (
                <div className="space-y-4">
                  {topCandidates.map((candidate: CandidateScore, index: number) => (
                    <div key={candidate.applicationId} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        <Checkbox
                          checked={selectedCandidates.includes(candidate.applicationId)}
                          onCheckedChange={(checked) => 
                            handleCandidateSelect(candidate.applicationId, checked as boolean)
                          }
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <h4 className="text-lg font-semibold">
                              {candidate.candidate.firstName} {candidate.candidate.lastName}
                            </h4>
                            <Badge className={getScoreBadge(candidate.totalScore)}>
                              {candidate.totalScore}/100
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div className="text-sm">
                              <strong>Email:</strong> {candidate.candidate.email}
                            </div>
                            <div className="text-sm">
                              <strong>Téléphone:</strong> {candidate.candidate.phone || 'Non renseigné'}
                            </div>
                          </div>

                          {/* Score Details */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="font-semibold">Expérience</div>
                              <div className={getScoreColor(candidate.factors.experienceMatch)}>
                                {candidate.factors.experienceMatch}/25
                              </div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="font-semibold">Compétences</div>
                              <div className={getScoreColor(candidate.factors.skillsMatch)}>
                                {candidate.factors.skillsMatch}/30
                              </div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="font-semibold">Disponibilité</div>
                              <div className={getScoreColor(candidate.factors.availabilityScore)}>
                                {candidate.factors.availabilityScore}/15
                              </div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="font-semibold">Salaire</div>
                              <div className={getScoreColor(candidate.factors.salaryFit)}>
                                {candidate.factors.salaryFit}/15
                              </div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="font-semibold">Qualité</div>
                              <div className={getScoreColor(candidate.factors.applicationQuality)}>
                                {candidate.factors.applicationQuality}/15
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assignment Section */}
        {selectedCandidates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>3. Affecter aux Recruteurs pour Notation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedCandidates.length} candidat(s) sélectionné(s)
                  </p>
                  
                  <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisissez un recruteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {recruiters.map((recruiter: any) => (
                        <SelectItem key={recruiter.id} value={recruiter.id}>
                          {recruiter.firstName} {recruiter.lastName} - {recruiter.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleAssignCandidates}
                  disabled={assignMutation.isPending}
                  className="w-full"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  {assignMutation.isPending ? "Attribution en cours..." : "Affecter les Candidats"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
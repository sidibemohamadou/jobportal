import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  EyeOff, 
  Trash2,
  Briefcase,
  LogOut,
  Building2,
  MapPin,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function JobManagement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["/api/admin/jobs"],
  });

  const toggleJobMutation = useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: number, isActive: boolean }) => {
      // API call pour activer/désactiver une offre
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
    }
  });

  const filteredJobs = jobs.filter((job: any) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getContractTypeColor = (contractType: string) => {
    switch (contractType) {
      case 'CDI':
        return 'bg-green-100 text-green-800';
      case 'CDD':
        return 'bg-blue-100 text-blue-800';
      case 'Freelance':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleToggleJob = (jobId: number, currentStatus: boolean) => {
    toggleJobMutation.mutate({ jobId, isActive: !currentStatus });
  };

  const handleDeleteJob = (jobId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      deleteJobMutation.mutate(jobId);
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
            <Briefcase className="h-4 w-4 mr-2" />
            Offres d'emploi
          </Button>
          <Link href="/admin/applications">
            <Button variant="ghost" className="text-muted-foreground">
              <Briefcase className="h-4 w-4 mr-2" />
              Candidatures
            </Button>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin/users">
              <Button variant="ghost" className="text-muted-foreground">
                <Briefcase className="h-4 w-4 mr-2" />
                Utilisateurs
              </Button>
            </Link>
          )}
        </div>

        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des Offres d'Emploi</h1>
          <Button className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Offre
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre ou entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        {job.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Eye className="h-3 w-3 mr-1" />
                            Publiée
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Masquée
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {job.company}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: fr }) : ''}
                        </span>
                      </div>

                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {job.description}
                      </p>

                      <div className="flex items-center space-x-2">
                        <Badge className={getContractTypeColor(job.contractType)}>
                          {job.contractType}
                        </Badge>
                        {job.experienceLevel && (
                          <Badge variant="outline">
                            {job.experienceLevel}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground ml-4">
                          {job.applicationsCount || 0} candidature(s)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleJob(job.id, job.isActive)}
                      >
                        {job.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredJobs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune offre d'emploi trouvée
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Eye, 
  Download,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Briefcase,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function ApplicationManagement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/admin/applications"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number, status: string }) => {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
    }
  });

  const filteredApplications = applications.filter((app: any) => {
    const matchesSearch = 
      app.candidate?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidate?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      reviewed: "bg-blue-100 text-blue-800", 
      interview: "bg-purple-100 text-purple-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: "En attente",
      reviewed: "Examinée",
      interview: "Entretien",
      accepted: "Acceptée", 
      rejected: "Refusée"
    };
    return texts[status as keyof typeof texts] || status;
  };

  const handleStatusChange = (applicationId: number, newStatus: string) => {
    updateStatusMutation.mutate({ applicationId, status: newStatus });
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
          <Link href="/admin/jobs">
            <Button variant="ghost" className="text-muted-foreground">
              <Briefcase className="h-4 w-4 mr-2" />
              Offres d'emploi
            </Button>
          </Link>
          <Button variant="ghost" className="border-b-2 border-primary text-primary">
            <FileText className="h-4 w-4 mr-2" />
            Candidatures
          </Button>
          {user?.role === "admin" && (
            <Link href="/admin/users">
              <Button variant="ghost" className="text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                Utilisateurs
              </Button>
            </Link>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-6">Gestion des Candidatures</h1>

        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom de candidat ou poste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="reviewed">Examinées</SelectItem>
              <SelectItem value="interview">Entretiens</SelectItem>
              <SelectItem value="accepted">Acceptées</SelectItem>
              <SelectItem value="rejected">Refusées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application: any) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {application.candidate?.firstName} {application.candidate?.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Candidature pour: <span className="font-medium">{application.job?.title}</span>
                          </p>
                        </div>
                        <Badge className={getStatusBadge(application.status)}>
                          {getStatusText(application.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{application.candidate?.email || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{application.phone || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {application.createdAt ? 
                              formatDistanceToNow(new Date(application.createdAt), { addSuffix: true, locale: fr }) :
                              'Date inconnue'
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Disponible: {application.availabilityDate ? 
                              new Date(application.availabilityDate).toLocaleDateString('fr-FR') :
                              'Immédiatement'
                            }
                          </span>
                        </div>
                      </div>

                      {application.coverLetter && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Lettre de motivation:</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {application.coverLetter}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4">
                        {application.cvPath && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            CV
                          </Button>
                        )}
                        {application.motivationLetterPath && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Lettre
                          </Button>
                        )}
                        {application.salaryExpectation && (
                          <span className="text-sm text-muted-foreground">
                            Salaire: {application.salaryExpectation}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-6">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir le profil
                      </Button>
                      
                      <Select 
                        value={application.status} 
                        onValueChange={(value) => handleStatusChange(application.id, value)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="reviewed">Examinée</SelectItem>
                          <SelectItem value="interview">Entretien</SelectItem>
                          <SelectItem value="accepted">Acceptée</SelectItem>
                          <SelectItem value="rejected">Refusée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredApplications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune candidature trouvée
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
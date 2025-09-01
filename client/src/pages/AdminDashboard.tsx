import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Settings,
  LogOut 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();

  // Mock data for now - à remplacer par de vraies données API
  const stats = {
    totalJobs: 25,
    activeJobs: 18,
    totalApplications: 142,
    pendingApplications: 23,
    totalCandidates: 87,
    newCandidatesThisWeek: 12
  };

  const recentApplications = [
    { id: 1, candidate: "Marie Dubois", job: "Développeur React", status: "pending", date: "2024-01-15" },
    { id: 2, candidate: "Pierre Martin", job: "Designer UX", status: "reviewed", date: "2024-01-14" },
    { id: 3, candidate: "Sophie Leroy", job: "Chef de Projet", status: "interview", date: "2024-01-13" },
  ];

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
          <Button variant="ghost" className="border-b-2 border-primary text-primary">
            <TrendingUp className="h-4 w-4 mr-2" />
            Tableau de bord
          </Button>
          <Link href="/admin/jobs">
            <Button variant="ghost" className="text-muted-foreground">
              <Briefcase className="h-4 w-4 mr-2" />
              Offres d'emploi
            </Button>
          </Link>
          <Link href="/admin/applications">
            <Button variant="ghost" className="text-muted-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Candidatures
            </Button>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin/users">
              <Button variant="ghost" className="text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                Utilisateurs
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offres Actives</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">
                sur {stats.totalJobs} au total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Candidatures</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApplications}</div>
              <p className="text-xs text-muted-foreground">
                en attente de traitement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux Candidats</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newCandidatesThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                cette semaine
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Candidatures Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{app.candidate}</h4>
                    <p className="text-sm text-muted-foreground">{app.job}</p>
                    <p className="text-xs text-muted-foreground">{app.date}</p>
                  </div>
                  <Badge className={getStatusBadge(app.status)}>
                    {getStatusText(app.status)}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/admin/applications">
                <Button variant="outline">
                  Voir toutes les candidatures
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
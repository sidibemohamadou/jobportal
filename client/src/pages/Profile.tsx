import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Briefcase, 
  Bell, 
  User, 
  ChevronDown, 
  LayoutDashboard,
  FileText,
  Search,
  Folder,
  Save,
  Upload
} from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function Profile() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    experience: "",
    skills: "",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous devez être connecté. Redirection vers la connexion...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: "",
        bio: "",
        experience: "",
        skills: "",
      });
    }
  }, [isAuthenticated, isLoading, toast, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été sauvegardées avec succès.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">JobPortal</span>
                <span className="text-sm text-muted-foreground">Espace candidat</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  {user.firstName?.[0] || user.email?.[0] || 'U'}
                </div>
                <span className="text-sm font-medium" data-testid="text-user-name">
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => window.location.href = "/api/logout"}
                  data-testid="button-logout"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-card shadow-sm border-r border-border min-h-screen">
          <div className="p-6">
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="flex items-center space-x-3 p-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors" data-testid="link-dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Tableau de bord</span>
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/applications">
                  <a className="flex items-center space-x-3 p-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors" data-testid="link-applications">
                    <FileText className="h-5 w-5" />
                    <span>Mes candidatures</span>
                  </a>
                </Link>
              </li>
              <li>
                <a href="#profile" className="flex items-center space-x-3 p-3 text-primary bg-primary/10 rounded-md">
                  <User className="h-5 w-5" />
                  <span className="font-medium">Mon profil</span>
                </a>
              </li>
              <li>
                <Link href="/jobs">
                  <a className="flex items-center space-x-3 p-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors" data-testid="link-search">
                    <Search className="h-5 w-5" />
                    <span>Rechercher</span>
                  </a>
                </Link>
              </li>
              <li>
                <a href="#documents" className="flex items-center space-x-3 p-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors" data-testid="link-documents">
                  <Folder className="h-5 w-5" />
                  <span>Mes documents</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="flex-1 p-8 bg-background">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-profile-title">
              Mon profil
            </h1>
            <p className="text-muted-foreground">
              Gérez vos informations personnelles et professionnelles
            </p>
          </div>
          
          <div className="max-w-2xl">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        data-testid="input-profile-first-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        data-testid="input-profile-last-name"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      data-testid="input-profile-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+33 1 23 45 67 89"
                      data-testid="input-profile-phone"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations professionnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bio">Présentation</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Décrivez brièvement votre parcours et vos objectifs professionnels..."
                      rows={4}
                      data-testid="textarea-profile-bio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Expérience professionnelle</Label>
                    <Textarea
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="Décrivez vos expériences professionnelles..."
                      rows={6}
                      data-testid="textarea-profile-experience"
                    />
                  </div>
                  <div>
                    <Label htmlFor="skills">Compétences</Label>
                    <Textarea
                      id="skills"
                      value={formData.skills}
                      onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                      placeholder="Listez vos compétences principales (séparées par des virgules)..."
                      rows={3}
                      data-testid="textarea-profile-skills"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  type="submit"
                  className="flex items-center space-x-2"
                  data-testid="button-save-profile"
                >
                  <Save className="h-4 w-4" />
                  <span>Sauvegarder</span>
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

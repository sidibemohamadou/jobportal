import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, UserCheck, Briefcase, Building, Mail } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  variant: "default" | "secondary" | "destructive" | "outline";
}

const roles: Role[] = [
  {
    id: "candidate",
    name: "Candidat",
    description: "Recherche d'emploi et candidatures",
    icon: <Mail className="w-5 h-5" />,
    variant: "outline"
  },
  {
    id: "employee", 
    name: "Employé",
    description: "Employé avec profil complété",
    icon: <Building className="w-5 h-5" />,
    variant: "secondary"
  },
  {
    id: "recruiter",
    name: "Recruteur",
    description: "Gestion des candidatures et recrutement",
    icon: <UserCheck className="w-5 h-5" />,
    variant: "secondary"
  },
  {
    id: "manager",
    name: "Manager", 
    description: "Gestion d'équipe et validation",
    icon: <Users className="w-5 h-5" />,
    variant: "default"
  },
  {
    id: "hr",
    name: "RH",
    description: "Ressources humaines et paie",
    icon: <Briefcase className="w-5 h-5" />,
    variant: "default"
  },
  {
    id: "admin",
    name: "Super Admin",
    description: "Accès complet et gestion système",
    icon: <Shield className="w-5 h-5" />,
    variant: "destructive"
  }
];

export default function DevLogin() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDevLogin = async (role: string) => {
    if (process.env.NODE_ENV !== "development") {
      toast({
        title: "Erreur",
        description: "Cette fonctionnalité n'est disponible qu'en développement",
        variant: "destructive"
      });
      return;
    }

    setLoading(role);
    
    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Connexion réussie",
          description: data.message || `Connecté en tant que ${role}`,
        });
        
        // Redirection
        setTimeout(() => {
          window.location.href = data.redirectPath || "/";
        }, 1000);
      } else {
        throw new Error(data.message || "Erreur de connexion");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la connexion de test",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Accès refusé</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Cette page n'est disponible qu'en mode développement.</p>
            <Button onClick={() => window.location.href = "/"} className="mt-4">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connexion de Développement</CardTitle>
            <p className="text-muted-foreground">
              Choisissez un rôle pour tester l'application
            </p>
            <Badge variant="outline" className="w-fit mx-auto">
              Mode Développement
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <Card key={role.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-full bg-muted">
                        {role.icon}
                      </div>
                      <div>
                        <Badge variant={role.variant} className="mb-2">
                          {role.name}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDevLogin(role.id)}
                        disabled={loading !== null}
                        className="w-full"
                        variant={role.id === "admin" ? "destructive" : "default"}
                      >
                        {loading === role.id ? "Connexion..." : `Se connecter`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Ou utilisez les connexions normales :
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = "/login"}
                >
                  Connexion Candidat
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = "/admin/login"}
                >
                  Connexion Admin
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
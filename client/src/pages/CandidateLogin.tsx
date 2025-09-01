import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ArrowLeft } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { t } from "@/lib/i18n";

export default function CandidateLogin() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleBack = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
Retour
          </Button>
          <LanguageSelector />
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-12 w-12 text-primary" />
            <span className="text-2xl font-bold text-foreground">JobPortal</span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle 
              className="text-2xl text-foreground"
              data-testid="text-login-title"
            >
Connexion Candidat
            </CardTitle>
            <p className="text-muted-foreground mt-2" data-testid="text-login-description">
Connectez-vous ou créez un compte pour postuler aux offres d'emploi
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center text-sm text-muted-foreground">
Vous serez redirigé vers notre système de connexion sécurisé
            </div>
            
            <Button 
              onClick={handleLogin}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg font-semibold"
              data-testid="button-candidate-login"
            >
Se connecter / Créer un compte
            </Button>
            
            <div className="text-center text-xs text-muted-foreground mt-4">
En vous connectant, vous acceptez notre politique de confidentialité
            </div>
          </CardContent>
        </Card>
        
        {/* Benefits */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-4">
Pourquoi créer un compte ?
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>✓ Postulez en quelques clics</div>
            <div>✓ Suivez vos candidatures en temps réel</div>
            <div>✓ Sauvegardez votre CV et lettre de motivation</div>
            <div>✓ Recevez des notifications sur vos candidatures</div>
          </div>
        </div>
      </div>
    </div>
  );
}
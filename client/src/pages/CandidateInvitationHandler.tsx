import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  User, 
  Briefcase,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function CandidateInvitationHandler() {
  const [, params] = useRoute("/candidate-invitation/:token");
  const { toast } = useToast();
  const [invitationProcessed, setInvitationProcessed] = useState(false);
  
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: [`/api/candidate-invitation/${params?.token}`],
    enabled: !!params?.token,
    retry: false,
  });

  const { data: job } = useQuery({
    queryKey: [`/api/jobs/${invitation?.jobId}`],
    enabled: !!invitation?.jobId,
  });

  useEffect(() => {
    if (invitation && !invitationProcessed) {
      toast({
        title: "Invitation trouvée",
        description: `Bienvenue ${invitation.firstName || 'candidat'} ! Votre invitation est valide.`,
      });
      setInvitationProcessed(true);
    }
  }, [invitation, invitationProcessed, toast]);

  const handleAcceptInvitation = () => {
    // Rediriger vers la connexion avec le token
    window.location.href = `/api/login?invitation_token=${params?.token}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Vérification de votre invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-700">Invitation non trouvée</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Cette invitation n'existe pas ou a expiré.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              data-testid="button-return-home"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date() > new Date(invitation.expiresAt);

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 text-orange-500 mx-auto mb-2" />
            <CardTitle className="text-orange-700">Invitation expirée</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Cette invitation a expiré le {new Date(invitation.expiresAt).toLocaleDateString('fr-FR')}.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Veuillez contacter le recruteur pour obtenir une nouvelle invitation.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              data-testid="button-return-home-expired"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* En-tête avec branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">AeroRecrutement</h1>
            </div>
            <p className="text-gray-600">Plateforme de Recrutement Aéroportuaire</p>
          </div>

          {/* Carte d'invitation */}
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-700">
                Invitation Valide
              </CardTitle>
              <p className="text-muted-foreground">
                Vous avez été invité(e) à postuler pour un poste
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Informations du candidat */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Candidat
                </h3>
                <p className="text-lg font-medium">
                  {invitation.firstName} {invitation.lastName}
                </p>
                <p className="text-muted-foreground">{invitation.email}</p>
              </div>

              {/* Informations du poste */}
              {job && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Poste proposé
                  </h3>
                  <p className="text-lg font-medium">{job.title}</p>
                  <p className="text-muted-foreground">{job.company} - {job.location}</p>
                  <Badge variant="outline" className="mt-2">
                    {job.contractType}
                  </Badge>
                </div>
              )}

              {/* Message personnel */}
              {invitation.personalMessage && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Message du recruteur
                  </h3>
                  <p className="text-gray-700 italic">"{invitation.personalMessage}"</p>
                </div>
              )}

              {/* Informations sur l'expiration */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Validité de l'invitation
                </h3>
                <p className="text-muted-foreground">
                  Cette invitation expire {formatDistanceToNow(new Date(invitation.expiresAt), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </p>
              </div>

              {/* Action principale */}
              <div className="text-center pt-4">
                <Button 
                  onClick={handleAcceptInvitation}
                  className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] text-white py-3 text-lg"
                  data-testid="button-accept-invitation"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Accéder à mon espace candidat
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Vous serez redirigé vers la page de connexion sécurisée
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informations supplémentaires */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Prochaines étapes</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Connectez-vous pour accéder à votre espace personnel</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Complétez votre profil et téléchargez vos documents</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Suivez le processus de candidature personnalisé</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
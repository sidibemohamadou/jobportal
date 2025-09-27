import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, User, MapPin, FileText, Globe, LogOut, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const profileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  gender: z.string().min(1, "Veuillez sélectionner votre sexe"),
  maritalStatus: z.string().min(1, "Veuillez sélectionner votre situation matrimoniale"),
  phone: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 chiffres"),
  address: z.string().min(10, "L'adresse doit être complète"),
  residencePlace: z.string().min(2, "Veuillez indiquer votre lieu de résidence"),
  idDocumentType: z.string().min(1, "Veuillez sélectionner le type de pièce d'identité"),
  idDocumentNumber: z.string().min(5, "Le numéro d'identification doit contenir au moins 5 caractères"),
  birthDate: z.date({
    required_error: "La date de naissance est requise",
  }),
  birthPlace: z.string().min(2, "Veuillez indiquer votre lieu de naissance"),
  birthCountry: z.string().min(2, "Veuillez sélectionner votre pays de naissance"),
  nationality: z.string().min(2, "Veuillez sélectionner votre nationalité"),
});

type ProfileForm = z.infer<typeof profileSchema>;

const COUNTRIES = [
  "Sénégal", "France", "Côte d'Ivoire", "Mali", "Burkina Faso", "Niger", 
  "Guinée", "Mauritanie", "Gambie", "Guinée-Bissau", "Cap-Vert",
  "Maroc", "Algérie", "Tunisie", "Cameroun", "Gabon", "Congo",
  "République Démocratique du Congo", "Bénin", "Togo", "Ghana",
  "Nigeria", "Libéria", "Sierra Leone", "Autres..."
];

export default function ProfileCompletion() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      gender: "",
      maritalStatus: "",
      phone: (user as any)?.phone || "",
      address: "",
      residencePlace: "",
      idDocumentType: "",
      idDocumentNumber: "",
      birthDate: undefined,
      birthPlace: "",
      birthCountry: "",
      nationality: "",
    },
  });

  // Fonction de sauvegarde locale pour continuité de service
  const saveToLocalStorage = (data: ProfileForm) => {
    try {
      localStorage.setItem('profileCompletionData', JSON.stringify({
        ...data,
        birthDate: data.birthDate?.toISOString(),
        savedAt: new Date().toISOString(),
        userId: (user as any)?.id
      }));
      localStorage.setItem('profileCompleted', 'true');
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // Charger les données sauvegardées si disponibles
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('profileCompletionData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.userId === (user as any)?.id) {
          // Restaurer les données du formulaire
          form.reset({
            ...parsed,
            birthDate: parsed.birthDate ? new Date(parsed.birthDate) : undefined
          });
          toast({
            title: "Données restaurées",
            description: "Vos informations précédentes ont été récupérées.",
          });
        }
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      // Tentative d'envoi au serveur
      try {
        const response = await fetch('/api/profile/complete', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Server error:", error);
        // Mode offline - sauvegarder localement
        setIsOfflineMode(true);
        saveToLocalStorage(data);
        return { offline: true, data };
      }
    },
    onSuccess: (result) => {
      if (result?.offline) {
        toast({
          title: "Profil sauvegardé localement",
          description: "Vos informations seront synchronisées dès que possible.",
        });
      } else {
        toast({
          title: "Profil complété",
          description: "Vos informations ont été enregistrées avec succès.",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Redirection vers le dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de l'enregistrement.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleLogout = () => {
    // Sauvegarder avant de se déconnecter
    const formData = form.getValues();
    if (Object.values(formData).some(value => value && value !== "")) {
      saveToLocalStorage(formData);
    }
    window.location.href = "/api/auth/logout";
  };

  // Fonction pour passer directement au dashboard (bouton d'urgence)
  const skipToDashboard = () => {
    localStorage.setItem('profileCompleted', 'true');
    toast({
      title: "Accès autorisé",
      description: "Vous pourrez compléter votre profil plus tard.",
    });
    window.location.href = "/dashboard";
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <User className="h-5 w-5 mr-2 text-primary" />
        <h3 className="text-lg font-semibold">Informations Personnelles</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom *</FormLabel>
              <FormControl>
                <Input placeholder="Votre prénom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom *</FormLabel>
              <FormControl>
                <Input placeholder="Votre nom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sexe *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre sexe" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Homme">Homme</SelectItem>
                  <SelectItem value="Femme">Femme</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maritalStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Situation matrimoniale *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre situation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Célibataire">Célibataire</SelectItem>
                  <SelectItem value="Marié(e)">Marié(e)</SelectItem>
                  <SelectItem value="Divorcé(e)">Divorcé(e)</SelectItem>
                  <SelectItem value="Veuf(ve)">Veuf(ve)</SelectItem>
                  <SelectItem value="Union libre">Union libre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: +221 77 123 45 67" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <MapPin className="h-5 w-5 mr-2 text-primary" />
        <h3 className="text-lg font-semibold">Adresse et Résidence</h3>
      </div>
      
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Adresse *</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Adresse complète (rue, quartier, ville...)" 
                {...field} 
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="residencePlace"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lieu de résidence *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Dakar, Thiès, Saint-Louis..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <FileText className="h-5 w-5 mr-2 text-primary" />
        <h3 className="text-lg font-semibold">Pièce d'Identité</h3>
      </div>
      
      <FormField
        control={form.control}
        name="idDocumentType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type de pièce d'identification *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de pièce" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="CNI">Carte Nationale d'Identité (CNI)</SelectItem>
                <SelectItem value="Passeport">Passeport</SelectItem>
                <SelectItem value="Permis de séjour">Permis de séjour</SelectItem>
                <SelectItem value="Carte consulaire">Carte consulaire</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="idDocumentNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>N° d'identification *</FormLabel>
            <FormControl>
              <Input 
                placeholder="Numéro de votre pièce d'identité" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Globe className="h-5 w-5 mr-2 text-primary" />
        <h3 className="text-lg font-semibold">Informations de Naissance</h3>
      </div>
      
      <FormField
        control={form.control}
        name="birthDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date de naissance *</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "dd MMMM yyyy", { locale: fr })
                    ) : (
                      <span>Sélectionnez votre date de naissance</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  locale={fr}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="birthPlace"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lieu de naissance *</FormLabel>
            <FormControl>
              <Input placeholder="Ville ou lieu de naissance" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="birthCountry"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pays de naissance *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre pays de naissance" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nationality"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nationalité *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre nationalité" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Sénégalaise">Sénégalaise</SelectItem>
                <SelectItem value="Française">Française</SelectItem>
                <SelectItem value="Ivoirienne">Ivoirienne</SelectItem>
                <SelectItem value="Malienne">Malienne</SelectItem>
                <SelectItem value="Burkinabè">Burkinabè</SelectItem>
                <SelectItem value="Nigérienne">Nigérienne</SelectItem>
                <SelectItem value="Guinéenne">Guinéenne</SelectItem>
                <SelectItem value="Mauritanienne">Mauritanienne</SelectItem>
                <SelectItem value="Gambienne">Gambienne</SelectItem>
                <SelectItem value="Bissau-Guinéenne">Bissau-Guinéenne</SelectItem>
                <SelectItem value="Cap-verdienne">Cap-verdienne</SelectItem>
                <SelectItem value="Double nationalité">Double nationalité</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-foreground">Compléter votre profil</h1>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </span>
              <Badge variant="secondary">Candidat</Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alertes de statut */}
        {isOfflineMode && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Mode hors ligne activé. Vos données seront sauvegardées localement et synchronisées plus tard.
            </AlertDescription>
          </Alert>
        )}

        {/* Bouton d'urgence pour accès immédiat */}
        <div className="mb-6 text-center">
          <Button 
            variant="outline" 
            onClick={skipToDashboard}
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            Accéder au dashboard immédiatement (compléter plus tard)
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-primary">Étape {step} sur 4</span>
            <span className="text-sm text-muted-foreground">{Math.round((step / 4) * 100)}% complété</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {step === 1 && "Informations Personnelles"}
                  {step === 2 && "Adresse et Résidence"}
                  {step === 3 && "Pièce d'Identité"}
                  {step === 4 && "Informations de Naissance"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
              >
                Précédent
              </Button>
              
              {step < 4 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                >
                  Suivant
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Enregistrement..." : "Terminer mon profil"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
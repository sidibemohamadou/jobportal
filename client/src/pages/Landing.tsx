import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LanguageSelector } from "@/components/LanguageSelector";
import { JobCard } from "@/components/JobCard";
import { 
  Plane, 
  Search, 
  MapPin, 
  Menu,
  Linkedin,
  Twitter,
  Facebook,
  Globe,
  Users,
  TrendingUp,
  Shield
} from "lucide-react";
import { t } from "@/lib/i18n";
import type { Job } from "@shared/schema";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [contractFilters, setContractFilters] = useState<string[]>([]);
  const [experienceFilters, setExperienceFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");

  // Récupération des offres d'emploi avec typage explicite
  const { data: jobs, isLoading, error } = useQuery<Job[]>({
    queryKey: ["/api/jobs", searchQuery, locationQuery, contractFilters.join(','), experienceFilters.join(',')],
    queryFn: async (): Promise<Job[]> => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (locationQuery) params.append('location', locationQuery);
      if (contractFilters.length > 0) params.append('contractType', contractFilters.join(','));
      if (experienceFilters.length > 0) params.append('experienceLevel', experienceFilters.join(','));
      
      const response = await fetch(`/api/jobs?${params.toString()}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 0
  });

  const handleApply = (job: Job) => {
    window.location.href = "/login";
  };

  const handleContractFilter = (contractType: string, checked: boolean) => {
    if (checked) {
      setContractFilters(prev => [...prev, contractType]);
    } else {
      setContractFilters(prev => prev.filter(c => c !== contractType));
    }
  };

  const handleExperienceFilter = (experience: string, checked: boolean) => {
    if (checked) {
      setExperienceFilters(prev => [...prev, experience]);
    } else {
      setExperienceFilters(prev => prev.filter(e => e !== experience));
    }
  };

  // Calculs des statistiques avec vérification de sécurité
  const jobsList = jobs || [];
  
  const contractTypeCounts = {
    'CDI': jobsList.filter(job => job.contractType === 'CDI').length,
    'CDD': jobsList.filter(job => job.contractType === 'CDD').length,
    'Stage': jobsList.filter(job => job.contractType === 'Stage').length,
    'Freelance': jobsList.filter(job => job.contractType === 'Freelance').length,
  };

  const experienceCounts = {
    'Débutant': jobsList.filter(job => job.experienceLevel === 'Débutant').length,
    'Intermédiaire': jobsList.filter(job => job.experienceLevel === 'Intermédiaire').length,
    'Senior': jobsList.filter(job => job.experienceLevel === 'Senior').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Plane className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-foreground">AeroRecrutement</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Button variant="outline" asChild>
                <a href="/login" data-testid="button-login">
                  Connexion
                </a>
              </Button>
              <Button asChild>
                <a href="/login" data-testid="button-register">
                  Inscription
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Trouvez votre emploi idéal dans l'aéronautique
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Plateforme de recrutement spécialisée dans les métiers de l'aviation et de l'aéroportuaire en Guinée-Bissau
          </p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-6 rounded-lg shadow-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Titre du poste, compétences..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-job"
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Ville, région..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-location"
                />
              </div>
              
              <Button className="w-full" data-testid="button-search">
                <Search className="mr-2 h-4 w-4" />
                Rechercher
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">{jobsList.length}</h3>
              <p className="text-muted-foreground">Offres d'emploi</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">150+</h3>
              <p className="text-muted-foreground">Entreprises partenaires</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">98%</h3>
              <p className="text-muted-foreground">Satisfaction clients</p>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-foreground">Filtres</h3>
                  
                  {/* Contract Type Filter */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-3">Type de contrat</h4>
                    <div className="space-y-2">
                      {Object.entries(contractTypeCounts).map(([type, count]) => (
                        <label key={type} className="flex items-center cursor-pointer">
                          <Checkbox 
                            checked={contractFilters.includes(type)}
                            onCheckedChange={(checked) => handleContractFilter(type, checked as boolean)}
                            data-testid={`checkbox-contract-${type.toLowerCase()}`}
                          />
                          <span className="ml-2 text-sm text-foreground">
                            {type} ({count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Experience Level */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">Niveau d'expérience</h4>
                    <div className="space-y-2">
                      {Object.entries(experienceCounts).map(([level, count]) => (
                        <label key={level} className="flex items-center cursor-pointer">
                          <Checkbox 
                            checked={experienceFilters.includes(level)}
                            onCheckedChange={(checked) => handleExperienceFilter(level, checked as boolean)}
                            data-testid={`checkbox-experience-${level.toLowerCase()}`}
                          />
                          <span className="ml-2 text-sm text-foreground">
                            {level} ({count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
            
            {/* Job Listings */}
            <main className="lg:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-jobs-count">
                  {jobsList.length} offres trouvées
                </h2>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Plus récent</SelectItem>
                    <SelectItem value="salary_asc">Salaire croissant</SelectItem>
                    <SelectItem value="salary_desc">Salaire décroissant</SelectItem>
                    <SelectItem value="relevance">Pertinence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Loading State */}
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                        <div className="h-3 bg-muted rounded w-full mb-2"></div>
                        <div className="h-3 bg-muted rounded w-full"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-red-500 mb-2">
                      Erreur de chargement: {(error as Error).message}
                    </p>
                    <Button onClick={() => window.location.reload()}>
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* No Jobs State */}
              {!isLoading && !error && jobsList.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground" data-testid="text-no-jobs">
                      Aucune offre d'emploi trouvée. Essayez de modifier vos critères de recherche.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Jobs List */}
              {!isLoading && !error && jobsList.length > 0 && (
                <div className="space-y-4">
                  {jobsList.map((job: Job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onApply={handleApply}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Plane className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">AeroRecrutement</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Plateforme de recrutement dédiée au secteur aéroportuaire et de l'aviation en Guinée-Bissau.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Candidats</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Rechercher un emploi</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Créer un CV</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Conseils carrière</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Entreprises</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Publier une offre</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Rechercher des talents</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Solutions RH</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Confidentialité</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 AeroRecrutement. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
import { useState, useEffect } from "react";
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

  // Construction de l'URL avec paramètres de recherche
  const buildJobsUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (locationQuery) params.append('location', locationQuery);
    if (contractFilters.length > 0) params.append('contractType', contractFilters.join(','));
    if (experienceFilters.length > 0) params.append('experienceLevel', experienceFilters.join(','));
    return `/api/jobs?${params.toString()}`;
  };

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: [buildJobsUrl()],
    staleTime: 0,
    gcTime: 0
  });

  const handleSearch = () => {
    // Search is reactive through the query key
  };

  const handleApply = (job: Job) => {
    // Redirection vers la page de connexion candidat
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

  const contractTypeCounts = {
    'CDI': jobs.filter((job: Job) => job.contractType === 'CDI').length,
    'CDD': jobs.filter((job: Job) => job.contractType === 'CDD').length,
    'Freelance': jobs.filter((job: Job) => job.contractType === 'Freelance').length,
  };

  const experienceCounts = {
    'Débutant': jobs.filter((job: Job) => job.experienceLevel === 'Débutant').length,
    'Intermédiaire': jobs.filter((job: Job) => job.experienceLevel === 'Intermédiaire').length,
    'Senior': jobs.filter((job: Job) => job.experienceLevel === 'Senior').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Plane className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">AeroRecrutement</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <a 
                  href="#jobs" 
                  className="text-foreground hover:text-primary transition-colors font-medium"
                  data-testid="link-jobs"
                >
                  {t('jobs')}
                </a>
                <a 
                  href="#about" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-about"
                >
                  {t('about')}
                </a>
                <a 
                  href="#contact" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-contact"
                >
                  {t('contact')}
                </a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              
              <div className="hidden sm:flex items-center space-x-2">
              </div>
              
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-background via-accent/10 to-secondary/10 py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-8 h-8 border-2 border-primary rotate-45"></div>
          <div className="absolute top-20 right-20 w-6 h-6 border-2 border-secondary rotate-12"></div>
          <div className="absolute bottom-20 left-20 w-10 h-10 border-2 border-accent rotate-45"></div>
          <div className="absolute bottom-10 right-10 w-4 h-4 border-2 border-primary rotate-12"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="flex items-center justify-center mb-6 space-x-4">
            <Globe className="h-8 w-8 text-secondary" />
            <Plane className="h-12 w-12 text-primary plane-path" />
            <Users className="h-8 w-8 text-accent" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6" data-testid="text-hero-title">
            <span className="text-primary">Carrières Aéroportuaires</span><br />
            <span className="text-secondary">en Guinée-Bissau</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto" data-testid="text-hero-subtitle">
            Découvrez les opportunités d'emploi dans le secteur aéroportuaire et de l'aviation. 
            Rejoignez les équipes qui connectent la Guinée-Bissau au monde.
          </p>
          
          <div className="flex items-center justify-center space-x-8 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Emplois Sécurisés</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-secondary" />
              <span>Croissance Garantie</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-accent" />
              <span>Connexion Internationale</span>
            </div>
          </div>
          
          {/* Job Search Form */}
          <Card className="max-w-4xl mx-auto shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-jobs"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('location_placeholder')}
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-location"
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center space-x-2"
                  data-testid="button-search"
                >
                  <Search className="h-5 w-5" />
                  <span>{t('search_button')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Filters Sidebar */}
            <aside className="w-full lg:w-64 space-y-6">
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-foreground">{t('filters')}</h3>
                  
                  {/* Contract Type Filter */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">{t('contract_type')}</h4>
                    <div className="space-y-2">
                      {Object.entries(contractTypeCounts).map(([type, count]) => (
                        <label key={type} className="flex items-center">
                          <Checkbox 
                            checked={contractFilters.includes(type)}
                            onCheckedChange={(checked) => handleContractFilter(type, checked as boolean)}
                            data-testid={`checkbox-contract-${type.toLowerCase()}`}
                          />
                          <span className="ml-2 text-sm">
                            {type} ({count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Experience Level */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">{t('experience')}</h4>
                    <div className="space-y-2">
                      {Object.entries(experienceCounts).map(([level, count]) => (
                        <label key={level} className="flex items-center">
                          <Checkbox 
                            checked={experienceFilters.includes(level)}
                            onCheckedChange={(checked) => handleExperienceFilter(level, checked as boolean)}
                            data-testid={`checkbox-experience-${level.toLowerCase()}`}
                          />
                          <span className="ml-2 text-sm">
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
            <main className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-jobs-count">
                  {jobs.length} {t('jobs_found')}
                </h2>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('sort_newest')}</SelectItem>
                    <SelectItem value="salary_asc">{t('sort_salary_asc')}</SelectItem>
                    <SelectItem value="salary_desc">{t('sort_salary_desc')}</SelectItem>
                    <SelectItem value="relevance">{t('sort_relevance')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isLoading ? (
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
              ) : !jobs || jobs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground" data-testid="text-no-jobs">
                      Aucune offre d'emploi trouvée. Essayez de modifier vos critères de recherche.
                    </p>
                    {error && (
                      <p className="text-red-500 mt-2">
                        Erreur: {(error as Error).message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job: Job) => (
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
              © 2024 JobPortal. Tous droits réservés.
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

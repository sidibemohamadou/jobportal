import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LanguageSelector } from "@/components/LanguageSelector";
import { JobCard } from "@/components/JobCard";
import { ApplicationModal } from "@/components/ApplicationModal";
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Menu,
  Linkedin,
  Twitter,
  Facebook
} from "lucide-react";
import { t } from "@/lib/i18n";
import type { Job } from "@shared/schema";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [contractFilters, setContractFilters] = useState<string[]>([]);
  const [experienceFilters, setExperienceFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["/api/jobs", searchQuery, locationQuery, contractFilters.join(','), experienceFilters.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (locationQuery) params.append('location', locationQuery);
      if (contractFilters.length > 0) params.append('contractType', contractFilters.join(','));
      if (experienceFilters.length > 0) params.append('experienceLevel', experienceFilters.join(','));
      
      const response = await fetch(`/api/jobs?${params.toString()}`);
      return response.json();
    },
  });

  const handleSearch = () => {
    // Search is reactive through the query key
  };

  const handleApply = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
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
    'CDI': jobs.filter(job => job.contractType === 'CDI').length,
    'CDD': jobs.filter(job => job.contractType === 'CDD').length,
    'Freelance': jobs.filter(job => job.contractType === 'Freelance').length,
  };

  const experienceCounts = {
    'Débutant': jobs.filter(job => job.experienceLevel === 'Débutant').length,
    'Intermédiaire': jobs.filter(job => job.experienceLevel === 'Intermédiaire').length,
    'Senior': jobs.filter(job => job.experienceLevel === 'Senior').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">JobPortal</span>
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
                <Button 
                  variant="ghost" 
                  className="text-primary hover:text-primary/80"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-login"
                >
                  {t('login')}
                </Button>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-register"
                >
                  {t('register')}
                </Button>
              </div>
              
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6" data-testid="text-hero-title">
            {t('hero_title')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            {t('hero_subtitle')}
          </p>
          
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
              ) : jobs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground" data-testid="text-no-jobs">
                      Aucune offre d'emploi trouvée. Essayez de modifier vos critères de recherche.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
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
                <Briefcase className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">JobPortal</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Plateforme de recrutement moderne pour connecter les talents aux opportunités.
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

      {/* Application Modal */}
      <ApplicationModal
        job={selectedJob}
        isOpen={showApplicationModal}
        onClose={() => {
          setShowApplicationModal(false);
          setSelectedJob(null);
        }}
      />
    </div>
  );
}

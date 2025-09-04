import { useState, useEffect } from "react";
import { SimpleJobCard } from "@/components/SimpleJobCard";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  contractType: string;
  experienceLevel?: string;
  skills?: string[];
  salary?: string;
  createdAt: string;
}

export default function SimpleLanding() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔄 Chargement des offres d'emploi...");
      
      const response = await fetch('/api/jobs', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log("📡 Statut de réponse:", response.status);
      console.log("📡 Headers de réponse:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("✅ Données reçues:", data);
      console.log("📊 Nombre d'offres:", data.length);
      
      setJobs(data);
    } catch (err) {
      console.error("❌ Erreur lors du chargement:", err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter(job =>
    searchQuery === '' || 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AeroRecrutement</h1>
            </div>
            <div className="flex space-x-4">
              <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Connexion
              </a>
              <a href="/login" className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors">
                Inscription
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Trouvez votre emploi idéal
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Plateforme de recrutement spécialisée dans l'aéronautique
          </p>
          
          {/* Barre de recherche */}
          <div className="max-w-2xl mx-auto">
            <div className="flex">
              <input
                type="text"
                placeholder="Rechercher un emploi, une entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-6 py-4 text-gray-900 rounded-l-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                data-testid="search-input"
              />
              <button className="bg-yellow-500 text-gray-900 px-8 py-4 rounded-r-lg text-lg font-semibold hover:bg-yellow-400 transition-colors" data-testid="search-button">
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2" data-testid="jobs-count">{jobs.length}</div>
              <div className="text-gray-600 dark:text-gray-300">Offres d'emploi</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600 dark:text-gray-300">Entreprises partenaires</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-600 dark:text-gray-300">Satisfaction clients</div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8" data-testid="jobs-section-title">
          Offres d'emploi disponibles ({filteredJobs.length})
        </h2>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12" data-testid="loading-state">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des offres...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12" data-testid="error-state">
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
              <p>{error}</p>
              <button 
                onClick={loadJobs}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                data-testid="retry-button"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* No Jobs */}
        {!loading && !error && filteredJobs.length === 0 && jobs.length === 0 && (
          <div className="text-center py-12" data-testid="no-jobs-state">
            <p className="text-gray-600 dark:text-gray-300 text-lg">Aucune offre d'emploi disponible.</p>
          </div>
        )}

        {/* No Search Results */}
        {!loading && !error && filteredJobs.length === 0 && jobs.length > 0 && (
          <div className="text-center py-12" data-testid="no-search-results">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Aucune offre trouvée pour "{searchQuery}".
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir toutes les offres
            </button>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && filteredJobs.length > 0 && (
          <div className="space-y-6" data-testid="jobs-list">
            {filteredJobs.map((job) => (
              <SimpleJobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">AeroRecrutement</h3>
              <p className="text-gray-400">
                Plateforme de recrutement spécialisée dans l'aéronautique en Guinée-Bissau.
              </p>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Candidats</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Rechercher un emploi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Créer un CV</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Conseils carrière</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Entreprises</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Publier une offre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Rechercher des talents</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Solutions RH</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            © 2024 AeroRecrutement. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
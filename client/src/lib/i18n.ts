export const translations = {
  fr: {
    // Navigation
    jobs: "Offres d'emploi",
    about: "À propos",
    contact: "Contact",
    login: "Connexion candidat",
    register: "S'inscrire",
    
    // Hero section
    hero_title: "Trouvez votre prochain emploi",
    hero_subtitle: "Découvrez des milliers d'opportunités professionnelles adaptées à votre profil et candidatez en quelques clics.",
    search_placeholder: "Titre du poste, mot-clé...",
    location_placeholder: "Ville, région...",
    search_button: "Rechercher",
    
    // Job listings
    jobs_found: "offres trouvées",
    sort_newest: "Plus récentes",
    sort_salary_asc: "Salaire croissant",
    sort_salary_desc: "Salaire décroissant",
    sort_relevance: "Pertinence",
    apply_button: "Postuler",
    
    // Filters
    filters: "Filtres",
    contract_type: "Type de contrat",
    salary: "Salaire",
    experience: "Expérience",
    all_salaries: "Tous les salaires",
    
    // Dashboard
    dashboard: "Tableau de bord",
    welcome: "Bienvenue dans votre espace candidat",
    applications_sent: "Candidatures envoyées",
    pending: "En attente",
    interviews: "Entretiens",
    profile_completed: "Profil complété",
    recent_applications: "Candidatures récentes",
    
    // Application statuses
    status_pending: "En attente",
    status_reviewed: "Examinée",
    status_interview: "Entretien planifié",
    status_accepted: "Acceptée",
    status_rejected: "Refusée",
  },
  en: {
    // Navigation
    jobs: "Job Listings",
    about: "About",
    contact: "Contact",
    login: "Candidate Login",
    register: "Sign Up",
    
    // Hero section
    hero_title: "Find Your Next Job",
    hero_subtitle: "Discover thousands of professional opportunities tailored to your profile and apply with just a few clicks.",
    search_placeholder: "Job title, keyword...",
    location_placeholder: "City, region...",
    search_button: "Search",
    
    // Job listings
    jobs_found: "jobs found",
    sort_newest: "Most Recent",
    sort_salary_asc: "Salary Ascending",
    sort_salary_desc: "Salary Descending",
    sort_relevance: "Relevance",
    apply_button: "Apply",
    
    // Filters
    filters: "Filters",
    contract_type: "Contract Type",
    salary: "Salary",
    experience: "Experience",
    all_salaries: "All Salaries",
    
    // Dashboard
    dashboard: "Dashboard",
    welcome: "Welcome to your candidate area",
    applications_sent: "Applications Sent",
    pending: "Pending",
    interviews: "Interviews",
    profile_completed: "Profile Completed",
    recent_applications: "Recent Applications",
    
    // Application statuses
    status_pending: "Pending",
    status_reviewed: "Reviewed",
    status_interview: "Interview Scheduled",
    status_accepted: "Accepted",
    status_rejected: "Rejected",
  },
  pt: {
    // Navigation
    jobs: "Vagas de Emprego",
    about: "Sobre",
    contact: "Contato",
    login: "Login Candidato",
    register: "Cadastrar-se",
    
    // Hero section
    hero_title: "Encontre Seu Próximo Emprego",
    hero_subtitle: "Descubra milhares de oportunidades profissionais adaptadas ao seu perfil e candidate-se em poucos cliques.",
    search_placeholder: "Título do cargo, palavra-chave...",
    location_placeholder: "Cidade, região...",
    search_button: "Pesquisar",
    
    // Job listings
    jobs_found: "vagas encontradas",
    sort_newest: "Mais Recentes",
    sort_salary_asc: "Salário Crescente",
    sort_salary_desc: "Salário Decrescente",
    sort_relevance: "Relevância",
    apply_button: "Candidatar-se",
    
    // Filters
    filters: "Filtros",
    contract_type: "Tipo de Contrato",
    salary: "Salário",
    experience: "Experiência",
    all_salaries: "Todos os Salários",
    
    // Dashboard
    dashboard: "Painel",
    welcome: "Bem-vindo à sua área de candidato",
    applications_sent: "Candidaturas Enviadas",
    pending: "Pendente",
    interviews: "Entrevistas",
    profile_completed: "Perfil Completado",
    recent_applications: "Candidaturas Recentes",
    
    // Application statuses
    status_pending: "Pendente",
    status_reviewed: "Analisada",
    status_interview: "Entrevista Agendada",
    status_accepted: "Aceita",
    status_rejected: "Rejeitada",
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.fr;

let currentLanguage: Language = 'fr';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
  }
}

export function getLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'fr';
  }
  try {
    const stored = localStorage.getItem('language') as Language;
    return stored && stored in translations ? stored : 'fr';
  } catch {
    return 'fr';
  }
}

export function t(key: TranslationKey): string {
  try {
    return translations[currentLanguage]?.[key] || translations.fr[key] || key;
  } catch {
    return key;
  }
}

// Initialize language from localStorage safely
if (typeof window !== 'undefined') {
  try {
    currentLanguage = getLanguage();
  } catch {
    currentLanguage = 'fr';
  }
}

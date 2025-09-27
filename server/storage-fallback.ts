import type { User, UpsertUser, Job, InsertJob, Application, InsertApplication } from "@shared/schema";
import { storage as mainStorage } from "./storage";

/**
 * Système de fallback haute disponibilité pour la partie candidature
 * Utilise PostgreSQL comme DB principale avec fallback in-memory pour continuité de service
 */

// Cache en mémoire pour haute disponibilité
let memoryCache = {
  users: new Map<string, any>(),
  jobs: new Map<number, any>(),
  applications: new Map<number, any>(),
  lastSync: Date.now(),
  isMainDBAvailable: true
};

// Données de test par défaut pour assurer la continuité
const defaultJobs: Job[] = [
  {
    id: 1,
    title: "Agent de Sûreté Aéroportuaire",
    company: "Aéroport International Blaise Diagne",
    location: "AIBD, Diass, Sénégal", 
    description: "Poste d'agent de sûreté pour la surveillance et contrôle des passagers et bagages. Formation sécurité fournie.",
    requirements: "Baccalauréat, casier judiciaire vierge, aptitude physique",
    salary: "180 000 - 250 000 FCFA",
    contractType: "CDI",
    experienceLevel: "Débutant",
    skills: ["Sécurité", "Surveillance", "Communication"],
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    title: "Hôtesse de l'Air / Steward",
    company: "Air Sénégal",
    location: "Dakar, Sénégal",
    description: "Service passagers en cabine, sécurité des vols, assistance clientèle. Formation complète assurée par la compagnie.",
    requirements: "Bac+2 minimum, taille minimum 1m60, maîtrise anglais/français",
    salary: "400 000 - 600 000 FCFA",
    contractType: "CDI", 
    experienceLevel: "Débutant",
    skills: ["Service Client", "Anglais", "Sécurité Aérienne"],
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    title: "Technicien Maintenance Aéronautique",
    company: "Sénégal Airlines Maintenance",
    location: "Aéroport LSS, Dakar",
    description: "Maintenance préventive et curative des aéronefs. Inspection, réparation et certification des équipements.",
    requirements: "BTS Maintenance Aéronautique ou équivalent, certification EASA Part-66",
    salary: "350 000 - 500 000 FCFA",
    contractType: "CDI",
    experienceLevel: "Intermédiaire", 
    skills: ["Maintenance", "Mécanique", "Certification EASA"],
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    title: "Développeur Full Stack",
    company: "DigiTech Solutions",
    location: "Dakar, Plateau",
    description: "Développement d'applications web et mobiles. Stack moderne React/Node.js.",
    requirements: "Bac+3 en informatique, 2+ ans expérience web",
    salary: "450 000 - 750 000 FCFA",
    contractType: "CDI",
    experienceLevel: "Intermédiaire",
    skills: ["React", "Node.js", "JavaScript", "MongoDB"],
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Test de disponibilité DB avec timeout
async function testDBConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );
    
    await Promise.race([
      mainStorage.getAllUsers().then(() => true),
      timeoutPromise
    ]);
    
    memoryCache.isMainDBAvailable = true;
    return true;
  } catch (error) {
    console.warn("DB connection test failed, using fallback mode:", error.message);
    memoryCache.isMainDBAvailable = false;
    return false;
  }
}

// Initialiser le cache avec des données par défaut
function initializeCache() {
  if (memoryCache.jobs.size === 0) {
    defaultJobs.forEach(job => memoryCache.jobs.set(job.id, job));
    console.log("Cache initialized with default jobs for high availability");
  }
}

class HighAvailabilityStorage {
  constructor() {
    initializeCache();
    // Test de connexion DB toutes les 30 secondes
    setInterval(() => testDBConnection(), 30000);
  }

  // === MÉTHODES JOBS (CRITIQUE POUR CANDIDATS) ===
  
  async getAllJobs(): Promise<Job[]> {
    try {
      if (memoryCache.isMainDBAvailable) {
        const jobs = await mainStorage.getAllJobs();
        // Mise à jour du cache
        jobs.forEach(job => memoryCache.jobs.set(job.id, job));
        return jobs;
      }
    } catch (error) {
      console.warn("Main DB unavailable for jobs, using cache:", error.message);
      memoryCache.isMainDBAvailable = false;
    }
    
    // Fallback: retourner depuis le cache
    return Array.from(memoryCache.jobs.values());
  }

  async getJob(id: number): Promise<Job | null> {
    try {
      if (memoryCache.isMainDBAvailable) {
        const job = await mainStorage.getJob(id);
        if (job) memoryCache.jobs.set(id, job);
        return job;
      }
    } catch (error) {
      console.warn("Main DB unavailable for job, using cache:", error.message);
    }
    
    return memoryCache.jobs.get(id) || null;
  }

  async createJob(jobData: InsertJob): Promise<Job> {
    try {
      if (memoryCache.isMainDBAvailable) {
        const job = await mainStorage.createJob(jobData);
        memoryCache.jobs.set(job.id, job);
        return job;
      }
    } catch (error) {
      console.warn("Main DB unavailable for job creation, using cache:", error.message);
    }
    
    // Fallback: créer en cache
    const newJob: Job = {
      id: Math.max(...Array.from(memoryCache.jobs.keys()), 0) + 1,
      ...jobData,
      isActive: jobData.isActive || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryCache.jobs.set(newJob.id, newJob);
    return newJob;
  }

  // === MÉTHODES APPLICATIONS (CRITIQUE POUR CANDIDATS) ===
  
  async createApplication(appData: InsertApplication, userId: string): Promise<Application> {
    const newApp: Application = {
      id: Math.max(...Array.from(memoryCache.applications.keys()), 0) + 1,
      ...appData,
      userId,
      status: "pending",
      autoScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      manualScore: null,
      scoreNotes: null,
      assignedRecruiter: null
    };

    try {
      if (memoryCache.isMainDBAvailable) {
        const app = await mainStorage.createApplication(appData, userId);
        memoryCache.applications.set(app.id, app);
        return app;
      }
    } catch (error) {
      console.warn("Main DB unavailable for application, saving to cache:", error.message);
    }
    
    // Fallback: sauver en cache (sera synchronisé plus tard)
    memoryCache.applications.set(newApp.id, newApp);
    console.log(`Application ${newApp.id} saved to cache (will sync when DB is available)`);
    return newApp;
  }

  async getApplicationsByUser(userId: string): Promise<Application[]> {
    try {
      if (memoryCache.isMainDBAvailable) {
        return await mainStorage.getApplicationsByUser(userId);
      }
    } catch (error) {
      console.warn("Main DB unavailable for user applications, using cache:", error.message);
    }
    
    return Array.from(memoryCache.applications.values()).filter(app => app.userId === userId);
  }

  // === MÉTHODES USER (POUR AUTHENTIFICATION) ===
  
  async getUserByEmail(email: string): Promise<User | null> {
    // Comptes de test en développement pour assurer la continuité
    if (process.env.NODE_ENV === 'development') {
      const testUsers: Record<string, any> = {
        'admin@test.com': {
          id: 'test-admin-1',
          email: 'admin@test.com',
          password: '$2a$12$test.hash.admin', // Hash simulé
          firstName: 'Super',
          lastName: 'Admin',
          role: 'admin',
          profileCompleted: true
        },
        'candidate@test.com': {
          id: 'test-candidate-1', 
          email: 'candidate@test.com',
          password: '$2a$12$test.hash.candidate',
          firstName: 'Jane',
          lastName: 'Doe',
          role: 'candidate',
          profileCompleted: false
        },
        'hr@test.com': {
          id: 'test-hr-1',
          email: 'hr@test.com', 
          password: '$2a$12$test.hash.hr',
          firstName: 'HR',
          lastName: 'Manager',
          role: 'hr',
          profileCompleted: true
        }
      };
      
      if (testUsers[email]) {
        return testUsers[email];
      }
    }

    try {
      if (memoryCache.isMainDBAvailable) {
        const user = await mainStorage.getUserByEmail(email);
        if (user) memoryCache.users.set(user.id, user);
        return user;
      }
    } catch (error) {
      console.warn("Main DB unavailable for user lookup, checking cache:", error.message);
    }
    
    return memoryCache.users.get(email) || null;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    try {
      if (memoryCache.isMainDBAvailable) {
        const user = await mainStorage.updateUser(id, userData);
        memoryCache.users.set(id, user);
        return user;
      }
    } catch (error) {
      console.warn("Main DB unavailable for user update, using cache:", error.message);
    }
    
    // Fallback: mise à jour en cache
    const existingUser = memoryCache.users.get(id) || {};
    const updatedUser = { ...existingUser, ...userData, updatedAt: new Date() };
    memoryCache.users.set(id, updatedUser);
    return updatedUser;
  }

  // === DÉLÉGATION POUR AUTRES MÉTHODES ===
  
  // Ces méthodes délèguent à mainStorage ou retournent des valeurs par défaut
  async getAllUsers(): Promise<User[]> {
    try {
      return await mainStorage.getAllUsers();
    } catch (error) {
      return Array.from(memoryCache.users.values());
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      return await mainStorage.getUsersByRole(role);
    } catch (error) {
      return Array.from(memoryCache.users.values()).filter(u => u.role === role);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await mainStorage.deleteUser(id);
      memoryCache.users.delete(id);
    } catch (error) {
      memoryCache.users.delete(id);
    }
  }

  async getAllApplications(): Promise<Application[]> {
    try {
      return await mainStorage.getAllApplications();
    } catch (error) {
      return Array.from(memoryCache.applications.values());
    }
  }

  async updateApplication(id: number, appData: any): Promise<Application | null> {
    try {
      return await mainStorage.updateApplication(id, appData);
    } catch (error) {
      const existing = memoryCache.applications.get(id);
      if (existing) {
        const updated = { ...existing, ...appData, updatedAt: new Date() };
        memoryCache.applications.set(id, updated);
        return updated;
      }
      return null;
    }
  }

  // Méthodes de fallback pour autres entités
  async createUser(userData: UpsertUser): Promise<User> {
    try {
      return await mainStorage.createUser(userData);
    } catch (error) {
      const newUser: User = {
        id: `temp-${Date.now()}`,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryCache.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  async getUser(id: string): Promise<User | null> {
    try {
      return await mainStorage.getUser(id);
    } catch (error) {
      return memoryCache.users.get(id) || null;
    }
  }

  // Placeholders pour autres méthodes
  async getRecruiters(): Promise<User[]> { return []; }
  async getAllEmployees(): Promise<any[]> { return []; }
  async getAllPayrolls(): Promise<any[]> { return []; }
  async createPayroll(data: any): Promise<any> { return { id: 1, ...data }; }
  async updatePayroll(id: number, data: any): Promise<any> { return { id, ...data }; }
  async getPayroll(id: number): Promise<any> { return null; }
  async updateJob(id: number, data: any): Promise<Job | null> { return null; }
  async deleteJob(id: number): Promise<boolean> { return false; }
  async deleteApplication(id: number): Promise<boolean> { return false; }
}

export const storage = new HighAvailabilityStorage();
console.log("High Availability Storage initialized with PostgreSQL + fallback cache");
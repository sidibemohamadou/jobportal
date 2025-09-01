import {
  users,
  jobs,
  applications,
  type User,
  type UpsertUser,
  type Job,
  type InsertJob,
  type Application,
  type InsertApplication,
  type UpdateApplication,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  // Job operations
  getAllJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  searchJobs(query: string, filters: any): Promise<Job[]>;
  
  // Application operations
  createApplication(application: InsertApplication, userId: string): Promise<Application>;
  getApplicationsByUser(userId: string): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  updateApplication(id: number, application: UpdateApplication): Promise<Application>;
  getApplicationsForJob(jobId: number): Promise<Application[]>;
  getApplicationsByRecruiter(recruiterId: string): Promise<Application[]>;
  
  // Recruitment operations
  getRecruiters(): Promise<User[]>;
  
  // Analytics operations
  getKPIs(): Promise<any>;
  getApplicationAnalytics(): Promise<any>;
  getJobAnalytics(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobs: Map<number, Job>;
  private applications: Map<number, Application>;
  private nextJobId: number = 1;
  private nextApplicationId: number = 1;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.initializeMockJobs();
  }

  private initializeMockJobs() {
    const mockJobs: Job[] = [
      {
        id: 1,
        title: "Développeur Full Stack React/Node.js",
        company: "TechCorp SARL",
        location: "Paris, France",
        description: "Rejoignez notre équipe pour développer des applications web modernes avec React et Node.js. Vous travaillerez sur des projets innovants dans un environnement agile...",
        requirements: "3-5 ans d'expérience en développement web, maîtrise de React.js, Node.js, TypeScript et PostgreSQL",
        salary: "45k - 60k €",
        contractType: "CDI",
        experienceLevel: "Intermédiaire",
        skills: ["React.js", "Node.js", "TypeScript", "PostgreSQL"],
        isActive: 1,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 2,
        title: "UX/UI Designer Senior",
        company: "Design Studio Pro",
        location: "Lyon, France",
        description: "Nous recherchons un(e) UX/UI Designer passionné(e) pour concevoir des expériences utilisateur exceptionnelles. Vous interviendrez sur des projets variés...",
        requirements: "5+ ans d'expérience en design UX/UI, maîtrise de Figma, Adobe XD",
        salary: "50k - 65k €",
        contractType: "CDI",
        experienceLevel: "Senior",
        skills: ["Figma", "Adobe XD", "Prototyping", "User Research"],
        isActive: 1,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 3,
        title: "Chef de Projet Digital",
        company: "Agence Digitale 360",
        location: "Toulouse, France",
        description: "Pilotez des projets web et mobile de A à Z. Vous coordonnerez les équipes techniques et créatives pour livrer des solutions digitales innovantes...",
        requirements: "2-4 ans d'expérience en gestion de projet digital",
        salary: "40k - 55k €",
        contractType: "CDD",
        experienceLevel: "Intermédiaire",
        skills: ["Agile/Scrum", "Jira", "Digital Strategy"],
        isActive: 1,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      }
    ];

    mockJobs.forEach(job => {
      this.jobs.set(job.id, job);
      this.nextJobId = Math.max(this.nextJobId, job.id + 1);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      id: userData.id || randomUUID(),
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      phone: userData.phone || null,
      role: userData.role || "candidate",
      gender: userData.gender || null,
      maritalStatus: userData.maritalStatus || null,
      address: userData.address || null,
      residencePlace: userData.residencePlace || null,
      idDocumentType: userData.idDocumentType || null,
      idDocumentNumber: userData.idDocumentNumber || null,
      birthDate: userData.birthDate || null,
      birthPlace: userData.birthPlace || null,
      birthCountry: userData.birthCountry || null,
      nationality: userData.nationality || null,
      profileCompleted: userData.profileCompleted || false,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Job operations
  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.isActive === 1);
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(jobData: InsertJob): Promise<Job> {
    const job: Job = {
      id: this.nextJobId++,
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      description: jobData.description,
      contractType: jobData.contractType,
      requirements: jobData.requirements || null,
      salary: jobData.salary || null,
      experienceLevel: jobData.experienceLevel || null,
      skills: jobData.skills || null,
      isActive: jobData.isActive || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  async searchJobs(query: string, filters: any): Promise<Job[]> {
    const allJobs = await this.getAllJobs();
    
    return allJobs.filter(job => {
      // Text search
      const matchesQuery = !query || 
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.company.toLowerCase().includes(query.toLowerCase()) ||
        job.location.toLowerCase().includes(query.toLowerCase()) ||
        job.description.toLowerCase().includes(query.toLowerCase());

      // Contract type filter
      const matchesContract = !filters.contractType || 
        filters.contractType.length === 0 || 
        filters.contractType.includes(job.contractType);

      // Experience level filter
      const matchesExperience = !filters.experienceLevel || 
        filters.experienceLevel.length === 0 || 
        filters.experienceLevel.includes(job.experienceLevel);

      // Location filter
      const matchesLocation = !filters.location || 
        job.location.toLowerCase().includes(filters.location.toLowerCase());

      return matchesQuery && matchesContract && matchesExperience && matchesLocation;
    });
  }

  // Application operations
  async createApplication(applicationData: InsertApplication, userId: string): Promise<Application> {
    const application: Application = {
      id: this.nextApplicationId++,
      userId,
      jobId: applicationData.jobId,
      phone: applicationData.phone || null,
      status: "pending",
      coverLetter: applicationData.coverLetter || null,
      cvPath: applicationData.cvPath || null,
      motivationLetterPath: applicationData.motivationLetterPath || null,
      availability: applicationData.availability || null,
      salaryExpectation: applicationData.salaryExpectation || null,
      assignedRecruiter: null,
      autoScore: 0,
      manualScore: null,
      scoreNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.applications.set(application.id, application);
    return application;
  }

  async getApplicationsByUser(userId: string): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.userId === userId);
  }

  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async updateApplication(id: number, updateData: UpdateApplication): Promise<Application> {
    const existing = this.applications.get(id);
    if (!existing) {
      throw new Error("Application not found");
    }
    
    const updated: Application = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.applications.set(id, updated);
    return updated;
  }

  async getApplicationsByRecruiter(recruiterId: string): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.assignedRecruiter === recruiterId);
  }

  async getRecruiters(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role === "recruiter" || user.role === "hr" || user.role === "admin"
    );
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error("User not found");
    }
    
    const updated: User = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  // Analytics operations
  async getKPIs(): Promise<any> {
    const allApplications = Array.from(this.applications.values());
    const allJobs = Array.from(this.jobs.values());
    const allUsers = Array.from(this.users.values());
    
    const candidates = allUsers.filter(u => u.role === 'candidate');
    const recruiters = allUsers.filter(u => u.role === 'recruiter' || u.role === 'hr');
    
    const statusCounts = {
      pending: allApplications.filter(a => a.status === 'pending').length,
      reviewed: allApplications.filter(a => a.status === 'reviewed').length,
      interview: allApplications.filter(a => a.status === 'interview').length,
      accepted: allApplications.filter(a => a.status === 'accepted').length,
      rejected: allApplications.filter(a => a.status === 'rejected').length,
      assigned: allApplications.filter(a => a.status === 'assigned').length,
      scored: allApplications.filter(a => a.status === 'scored').length,
    };

    const conversionRate = allApplications.length > 0 
      ? ((statusCounts.accepted / allApplications.length) * 100).toFixed(1)
      : '0.0';

    const avgProcessingTime = this.calculateAvgProcessingTime(allApplications);
    
    return {
      totalApplications: allApplications.length,
      totalJobs: allJobs.filter(j => j.isActive === 1).length,
      totalCandidates: candidates.length,
      totalRecruiters: recruiters.length,
      statusCounts,
      conversionRate: parseFloat(conversionRate),
      avgProcessingTime,
      topPerformingJobs: this.getTopJobs(allApplications, allJobs)
    };
  }

  async getApplicationAnalytics(): Promise<any> {
    const allApplications = Array.from(this.applications.values());
    
    // Applications par mois (6 derniers mois)
    const monthlyData = this.getMonthlyApplications(allApplications);
    
    // Applications par statut pour graphique
    const statusData = [
      { name: 'En attente', value: allApplications.filter(a => a.status === 'pending').length },
      { name: 'Examinées', value: allApplications.filter(a => a.status === 'reviewed').length },
      { name: 'Entretiens', value: allApplications.filter(a => a.status === 'interview').length },
      { name: 'Acceptées', value: allApplications.filter(a => a.status === 'accepted').length },
      { name: 'Refusées', value: allApplications.filter(a => a.status === 'rejected').length },
      { name: 'Assignées', value: allApplications.filter(a => a.status === 'assigned').length },
      { name: 'Notées', value: allApplications.filter(a => a.status === 'scored').length },
    ].filter(item => item.value > 0);
    
    return {
      monthlyApplications: monthlyData,
      statusDistribution: statusData,
      scoreDistribution: this.getScoreDistribution(allApplications)
    };
  }

  async getJobAnalytics(): Promise<any> {
    const allJobs = Array.from(this.jobs.values());
    const allApplications = Array.from(this.applications.values());
    
    const jobPopularity = allJobs.map(job => ({
      name: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
      applications: allApplications.filter(a => a.jobId === job.id).length,
      company: job.company
    })).sort((a, b) => b.applications - a.applications).slice(0, 10);
    
    const contractTypeData = [
      { name: 'CDI', value: allJobs.filter(j => j.contractType === 'CDI').length },
      { name: 'CDD', value: allJobs.filter(j => j.contractType === 'CDD').length },
      { name: 'Freelance', value: allJobs.filter(j => j.contractType === 'Freelance').length },
      { name: 'Stage', value: allJobs.filter(j => j.contractType === 'Stage').length },
    ].filter(item => item.value > 0);
    
    const experienceLevelData = [
      { name: 'Débutant', value: allJobs.filter(j => j.experienceLevel === 'Débutant').length },
      { name: 'Intermédiaire', value: allJobs.filter(j => j.experienceLevel === 'Intermédiaire').length },
      { name: 'Senior', value: allJobs.filter(j => j.experienceLevel === 'Senior').length },
    ].filter(item => item.value > 0);
    
    return {
      jobPopularity,
      contractTypes: contractTypeData,
      experienceLevels: experienceLevelData
    };
  }

  private calculateAvgProcessingTime(applications: Application[]): number {
    const processedApps = applications.filter(a => 
      a.status === 'accepted' || a.status === 'rejected'
    );
    
    if (processedApps.length === 0) return 0;
    
    const totalTime = processedApps.reduce((sum, app) => {
      const updatedAt = app.updatedAt || new Date();
      const createdAt = app.createdAt || new Date();
      const daysDiff = Math.ceil(
        (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + daysDiff;
    }, 0);
    
    return Math.round(totalTime / processedApps.length);
  }

  private getTopJobs(applications: Application[], jobs: Job[]): any[] {
    const jobAppCounts = new Map<number, number>();
    
    applications.forEach(app => {
      const current = jobAppCounts.get(app.jobId) || 0;
      jobAppCounts.set(app.jobId, current + 1);
    });
    
    return Array.from(jobAppCounts.entries())
      .map(([jobId, count]) => {
        const job = jobs.find(j => j.id === jobId);
        return job ? {
          title: job.title,
          company: job.company,
          applications: count
        } : null;
      })
      .filter(item => item !== null)
      .sort((a, b) => b!.applications - a!.applications)
      .slice(0, 5);
  }

  private getMonthlyApplications(applications: Application[]): any[] {
    const monthlyData: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialiser les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      monthlyData[key] = 0;
    }
    
    // Compter les applications par mois
    applications.forEach(app => {
      const createdAt = app.createdAt || new Date();
      const date = new Date(createdAt);
      const key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      if (monthlyData.hasOwnProperty(key)) {
        monthlyData[key]++;
      }
    });
    
    return Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
  }

  private getScoreDistribution(applications: Application[]): any[] {
    const scoredApps = applications.filter(a => (a.autoScore || 0) > 0);
    
    if (scoredApps.length === 0) return [];
    
    const ranges = [
      { name: '0-20', min: 0, max: 20, count: 0 },
      { name: '21-40', min: 21, max: 40, count: 0 },
      { name: '41-60', min: 41, max: 60, count: 0 },
      { name: '61-80', min: 61, max: 80, count: 0 },
      { name: '81-100', min: 81, max: 100, count: 0 },
    ];
    
    scoredApps.forEach(app => {
      const score = app.autoScore || 0;
      const range = ranges.find(r => score >= r.min && score <= r.max);
      if (range) range.count++;
    });
    
    return ranges.filter(r => r.count > 0);
  }

  async getApplicationsForJob(jobId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.jobId === jobId);
  }
}

export const storage = new MemStorage();

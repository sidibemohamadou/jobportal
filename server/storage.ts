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
  
  // Job operations
  getAllJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  searchJobs(query: string, filters: any): Promise<Job[]>;
  
  // Application operations
  createApplication(application: InsertApplication): Promise<Application>;
  getApplicationsByUser(userId: string): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  updateApplication(id: number, application: UpdateApplication): Promise<Application>;
  getApplicationsForJob(jobId: number): Promise<Application[]>;
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
  async createApplication(applicationData: InsertApplication): Promise<Application> {
    const application: Application = {
      ...applicationData,
      id: this.nextApplicationId++,
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

  async getApplicationsForJob(jobId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.jobId === jobId);
  }
}

export const storage = new MemStorage();

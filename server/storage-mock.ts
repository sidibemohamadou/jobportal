// Mock storage implementation for development when DB is not available
import type { User, UpsertUser, Job, InsertJob, Application, InsertApplication } from "@shared/schema";

// In-memory storage for development
let mockUsers: User[] = [
  {
    id: "admin-1",
    email: "admin@test.com",
    password: "$2a$12$hashedpassword", // Mock hashed password
    firstName: "Super",
    lastName: "Admin", 
    role: "admin",
    profileCompleted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    phone: null,
    profileImageUrl: null,
    gender: null,
    maritalStatus: null,
    address: null,
    residencePlace: null,
    idDocumentType: null,
    idDocumentNumber: null,
    birthDate: null,
    birthPlace: null,
    birthCountry: null,
    nationality: null,
    employeeId: null
  },
  {
    id: "candidate-1", 
    email: "candidate@test.com",
    password: "$2a$12$hashedpassword",
    firstName: "John",
    lastName: "Doe",
    role: "candidate",
    profileCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    phone: null,
    profileImageUrl: null,
    gender: null,
    maritalStatus: null,
    address: null,
    residencePlace: null,
    idDocumentType: null,
    idDocumentNumber: null,
    birthDate: null,
    birthPlace: null,
    birthCountry: null,
    nationality: null,
    employeeId: null
  }
];

let mockJobs: Job[] = [
  {
    id: 1,
    title: "Développeur Full Stack",
    company: "TechCorp", 
    location: "Dakar, Sénégal",
    description: "Poste de développeur full stack avec React et Node.js",
    requirements: "3+ années d'expérience",
    salary: "800k - 1.2M FCFA",
    contractType: "CDI",
    experienceLevel: "Intermédiaire",
    skills: ["React", "Node.js", "TypeScript"],
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let mockApplications: Application[] = [];

export class MockStorage {
  // User methods
  async createUser(userData: UpsertUser): Promise<User> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockUsers.push(newUser);
    return newUser;
  }

  async getUser(id: string): Promise<User | null> {
    return mockUsers.find(u => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return mockUsers.find(u => u.email === email) || null;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error("User not found");
    
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...userData,
      updatedAt: new Date()
    };
    return mockUsers[userIndex];
  }

  async getAllUsers(): Promise<User[]> {
    return mockUsers;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return mockUsers.filter(u => u.role === role);
  }

  async deleteUser(id: string): Promise<void> {
    mockUsers = mockUsers.filter(u => u.id !== id);
  }

  // Job methods
  async getAllJobs(): Promise<Job[]> {
    return mockJobs;
  }

  async getJob(id: number): Promise<Job | null> {
    return mockJobs.find(j => j.id === id) || null;
  }

  async createJob(jobData: InsertJob): Promise<Job> {
    const newJob: Job = {
      id: mockJobs.length + 1,
      ...jobData,
      isActive: jobData.isActive || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockJobs.push(newJob);
    return newJob;
  }

  async updateJob(id: number, jobData: Partial<InsertJob>): Promise<Job | null> {
    const jobIndex = mockJobs.findIndex(j => j.id === id);
    if (jobIndex === -1) return null;
    
    mockJobs[jobIndex] = {
      ...mockJobs[jobIndex],
      ...jobData,
      updatedAt: new Date()
    };
    return mockJobs[jobIndex];
  }

  async deleteJob(id: number): Promise<boolean> {
    const initialLength = mockJobs.length;
    mockJobs = mockJobs.filter(j => j.id !== id);
    return mockJobs.length < initialLength;
  }

  // Application methods
  async getAllApplications(): Promise<Application[]> {
    return mockApplications;
  }

  async getApplicationsByUser(userId: string): Promise<Application[]> {
    return mockApplications.filter(a => a.userId === userId);
  }

  async createApplication(appData: InsertApplication, userId: string): Promise<Application> {
    const newApp: Application = {
      id: mockApplications.length + 1,
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
    mockApplications.push(newApp);
    return newApp;
  }

  async updateApplication(id: number, appData: Partial<InsertApplication>): Promise<Application | null> {
    const appIndex = mockApplications.findIndex(a => a.id === id);
    if (appIndex === -1) return null;
    
    mockApplications[appIndex] = {
      ...mockApplications[appIndex],
      ...appData,
      updatedAt: new Date()
    };
    return mockApplications[appIndex];
  }

  async deleteApplication(id: number): Promise<boolean> {
    const initialLength = mockApplications.length;
    mockApplications = mockApplications.filter(a => a.id !== id);
    return mockApplications.length < initialLength;
  }

  // Placeholder methods for other entities
  async getRecruiters(): Promise<User[]> {
    return mockUsers.filter(u => u.role === "recruiter");
  }

  async getAllEmployees(): Promise<any[]> {
    return [];
  }

  async getAllPayrolls(): Promise<any[]> {
    return [];
  }

  async createPayroll(data: any): Promise<any> {
    return { id: 1, ...data };
  }

  async updatePayroll(id: number, data: any): Promise<any> {
    return { id, ...data };
  }

  async getPayroll(id: number): Promise<any> {
    return { id, amount: 1000000 };
  }
}

console.log("Using Mock Storage for development (DB connection failed)");
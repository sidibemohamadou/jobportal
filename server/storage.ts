import {
  users,
  jobs,
  applications,
  employees,
  contracts,
  contractAmendments,
  payroll,
  leaveRequests,
  leaveBalances,
  hrRequests,
  type User,
  type UpsertUser,
  type Job,
  type InsertJob,
  type Application,
  type InsertApplication,
  type UpdateApplication,
  type Employee,
  type InsertEmployee,
  type Contract,
  type InsertContract,
  type ContractAmendment,
  type InsertAmendment,
  type Payroll,
  type InsertPayroll,
  type LeaveRequest,
  type InsertLeaveRequest,
  type LeaveBalance,
  type HrRequest,
  type InsertHrRequest,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, like, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  
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
  
  // Enhanced search operations for applications with scoring
  searchApplicationsByScore(minAutoScore?: number, maxAutoScore?: number, minManualScore?: number, maxManualScore?: number): Promise<Application[]>;
  getApplicationsByDateRange(startDate: Date, endDate: Date): Promise<Application[]>;
  
  // Payroll operations
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  getPayroll(id: number): Promise<Payroll | undefined>;
  getPayrollsByEmployee(employeeId: number): Promise<Payroll[]>;
  getPayrollsByPeriod(period: string): Promise<Payroll[]>;
  updatePayroll(id: number, data: Partial<Payroll>): Promise<Payroll>;
  getAllPayrolls(): Promise<Payroll[]>;
  
  // Employee operations
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: string): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  updateEmployee(id: number, data: Partial<Employee>): Promise<Employee>;
  
  // Contract operations
  createContract(contract: InsertContract): Promise<Contract>;
  getContract(id: number): Promise<Contract | undefined>;
  getContractsByEmployee(employeeId: number): Promise<Contract[]>;
  updateContract(id: number, data: Partial<Contract>): Promise<Contract>;
  getActiveContracts(): Promise<Contract[]>;
  
  // Leave operations
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  getLeaveRequest(id: number): Promise<LeaveRequest | undefined>;
  getLeaveRequestsByEmployee(employeeId: number): Promise<LeaveRequest[]>;
  updateLeaveRequest(id: number, data: Partial<LeaveRequest>): Promise<LeaveRequest>;
  getLeaveBalance(employeeId: number, year: number): Promise<LeaveBalance[]>;
  
  // HR Request operations
  createHrRequest(request: InsertHrRequest): Promise<HrRequest>;
  getHrRequest(id: number): Promise<HrRequest | undefined>;
  getHrRequestsByEmployee(employeeId: number): Promise<HrRequest[]>;
  getAllHrRequests(): Promise<HrRequest[]>;
  updateHrRequest(id: number, data: Partial<HrRequest>): Promise<HrRequest>;
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

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async deleteUser(id: string): Promise<void> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error("User not found");
    }
    this.users.delete(id);
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

  // Employee operations
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const newEmployee: Employee = {
      id: this.nextEmployeeId++,
      ...employee,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.employees.set(newEmployee.id, newEmployee);
    return newEmployee;
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(e => e.userId === userId);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    const existing = this.employees.get(id);
    if (!existing) {
      throw new Error("Employee not found");
    }
    const updated: Employee = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.employees.set(id, updated);
    return updated;
  }

  // Contract operations
  async createContract(contract: InsertContract): Promise<Contract> {
    const newContract: Contract = {
      id: this.nextContractId++,
      ...contract,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contracts.set(newContract.id, newContract);
    return newContract;
  }

  async getContract(id: number): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async getContractsByEmployee(employeeId: number): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(c => c.employeeId === employeeId);
  }

  async updateContract(id: number, data: Partial<Contract>): Promise<Contract> {
    const existing = this.contracts.get(id);
    if (!existing) {
      throw new Error("Contract not found");
    }
    const updated: Contract = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.contracts.set(id, updated);
    return updated;
  }

  async getActiveContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(c => c.status === "active");
  }

  // Leave operations
  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const newRequest: LeaveRequest = {
      id: this.nextLeaveRequestId++,
      ...request,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leaveRequests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    return this.leaveRequests.get(id);
  }

  async getLeaveRequestsByEmployee(employeeId: number): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values()).filter(r => r.employeeId === employeeId);
  }

  async updateLeaveRequest(id: number, data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const existing = this.leaveRequests.get(id);
    if (!existing) {
      throw new Error("Leave request not found");
    }
    const updated: LeaveRequest = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.leaveRequests.set(id, updated);
    return updated;
  }

  async getLeaveBalance(employeeId: number, year: number): Promise<LeaveBalance[]> {
    return Array.from(this.leaveBalances.values())
      .filter(b => b.employeeId === employeeId && b.year === year);
  }

  async updateLeaveBalance(employeeId: number, year: number, leaveType: string, usedDays: number): Promise<void> {
    const key = `${employeeId}-${year}-${leaveType}`;
    const existing = this.leaveBalances.get(key);
    
    if (existing) {
      const updated: LeaveBalance = {
        ...existing,
        usedDays: existing.usedDays + usedDays,
        remainingDays: existing.totalDays - (existing.usedDays + usedDays),
        updatedAt: new Date(),
      };
      this.leaveBalances.set(key, updated);
    } else {
      // Créer un nouveau solde avec des valeurs par défaut
      const defaultDays = this.getDefaultLeaveDays(leaveType);
      const newBalance: LeaveBalance = {
        id: Math.floor(Math.random() * 1000000),
        employeeId,
        year,
        leaveType,
        totalDays: defaultDays,
        usedDays,
        remainingDays: defaultDays - usedDays,
        carriedOverDays: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.leaveBalances.set(key, newBalance);
    }
  }

  private getDefaultLeaveDays(leaveType: string): number {
    const defaults: { [key: string]: number } = {
      vacation: 25,
      sick: 90,
      personal: 5,
      maternity: 112,
      paternity: 25
    };
    return defaults[leaveType] || 0;
  }

  // HR Request operations
  async createHrRequest(request: InsertHrRequest): Promise<HrRequest> {
    const newRequest: HrRequest = {
      id: this.nextHrRequestId++,
      ...request,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.hrRequests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async getHrRequest(id: number): Promise<HrRequest | undefined> {
    return this.hrRequests.get(id);
  }

  async getHrRequestsByEmployee(employeeId: number): Promise<HrRequest[]> {
    return Array.from(this.hrRequests.values()).filter(r => r.employeeId === employeeId);
  }

  async getAllHrRequests(): Promise<HrRequest[]> {
    return Array.from(this.hrRequests.values());
  }

  async updateHrRequest(id: number, data: Partial<HrRequest>): Promise<HrRequest> {
    const existing = this.hrRequests.get(id);
    if (!existing) {
      throw new Error("HR request not found");
    }
    const updated: HrRequest = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.hrRequests.set(id, updated);
    return updated;
  }

  // Payroll operations (simplified implementation)
  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const newPayroll: Payroll = {
      id: this.nextPayrollId++,
      ...payroll,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.payrolls.set(newPayroll.id, newPayroll);
    return newPayroll;
  }

  async getPayroll(id: number): Promise<Payroll | undefined> {
    return this.payrolls.get(id);
  }

  async getPayrollByEmployee(employeeId: number, period?: string): Promise<Payroll[]> {
    const payrolls = Array.from(this.payrolls.values())
      .filter(p => p.employeeId === employeeId);
    
    if (period) {
      return payrolls.filter(p => p.period === period);
    }
    return payrolls;
  }

  async updatePayroll(id: number, data: Partial<Payroll>): Promise<Payroll> {
    const existing = this.payrolls.get(id);
    if (!existing) {
      throw new Error("Payroll not found");
    }
    const updated: Payroll = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.payrolls.set(id, updated);
    return updated;
  }

  async getApplicationsForJob(jobId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.jobId === jobId);
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updated) throw new Error("User not found");
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Job operations
  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.isActive, 1)).orderBy(desc(jobs.createdAt));
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async searchJobs(query: string, filters: any): Promise<Job[]> {
    let baseQuery = db.select().from(jobs).where(eq(jobs.isActive, 1));
    
    const conditions = [];
    
    if (query) {
      conditions.push(
        or(
          like(jobs.title, `%${query}%`),
          like(jobs.description, `%${query}%`),
          like(jobs.company, `%${query}%`)
        )
      );
    }
    
    if (filters.location) {
      conditions.push(like(jobs.location, `%${filters.location}%`));
    }
    
    if (filters.contractType && filters.contractType.length > 0) {
      const contractConditions = filters.contractType.map((type: string) => eq(jobs.contractType, type));
      conditions.push(or(...contractConditions));
    }
    
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }
    
    return await baseQuery.orderBy(desc(jobs.createdAt));
  }

  // Application operations with enhanced scoring
  async createApplication(application: InsertApplication, userId: string): Promise<Application> {
    // Calculate auto-score based on application data
    const autoScore = await this.calculateAutoScore(application);
    
    const [newApp] = await db
      .insert(applications)
      .values({ ...application, userId, autoScore })
      .returning();
    return newApp;
  }

  private async calculateAutoScore(application: InsertApplication): Promise<number> {
    let score = 50; // Base score
    
    // Présence du CV (+20 points)
    if (application.cvPath) score += 20;
    
    // Qualité de la lettre de motivation (+15 points)
    if (application.coverLetter && application.coverLetter.length > 100) score += 15;
    
    // Copie diplôme (+15 points)
    if (application.diplomaPath) score += 15;
    
    return Math.min(score, 100);
  }

  async getApplicationsByUser(userId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    return app || undefined;
  }

  async updateApplication(id: number, application: UpdateApplication): Promise<Application> {
    const [updated] = await db
      .update(applications)
      .set({ ...application, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    if (!updated) throw new Error("Application not found");
    return updated;
  }

  async getApplicationsForJob(jobId: number): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.jobId, jobId)).orderBy(desc(applications.createdAt));
  }

  async getApplicationsByRecruiter(recruiterId: string): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.assignedRecruiter, recruiterId)).orderBy(desc(applications.createdAt));
  }

  // Enhanced search operations for applications with scoring
  async searchApplicationsByScore(
    minAutoScore?: number,
    maxAutoScore?: number,
    minManualScore?: number,
    maxManualScore?: number
  ): Promise<Application[]> {
    const conditions = [];
    
    if (minAutoScore !== undefined) {
      conditions.push(gte(applications.autoScore, minAutoScore));
    }
    if (maxAutoScore !== undefined) {
      conditions.push(lte(applications.autoScore, maxAutoScore));
    }
    if (minManualScore !== undefined) {
      conditions.push(gte(applications.manualScore, minManualScore));
    }
    if (maxManualScore !== undefined) {
      conditions.push(lte(applications.manualScore, maxManualScore));
    }
    
    let query = db.select().from(applications);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(applications.autoScore), desc(applications.manualScore));
  }

  async getApplicationsByDateRange(startDate: Date, endDate: Date): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(and(
        gte(applications.createdAt, startDate),
        lte(applications.createdAt, endDate)
      ))
      .orderBy(desc(applications.createdAt));
  }

  async getRecruiters(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.role, "recruiter"),
          eq(users.role, "hr"),
          eq(users.role, "admin")
        )
      );
  }

  // Payroll operations
  async createPayroll(payrollData: InsertPayroll): Promise<Payroll> {
    const [newPayroll] = await db.insert(payroll).values(payrollData).returning();
    return newPayroll;
  }

  async getPayroll(id: number): Promise<Payroll | undefined> {
    const [payrollEntry] = await db.select().from(payroll).where(eq(payroll.id, id));
    return payrollEntry || undefined;
  }

  async getPayrollsByEmployee(employeeId: number): Promise<Payroll[]> {
    return await db.select().from(payroll).where(eq(payroll.employeeId, employeeId)).orderBy(desc(payroll.period));
  }

  async getPayrollsByPeriod(period: string): Promise<Payroll[]> {
    return await db.select().from(payroll).where(eq(payroll.period, period)).orderBy(desc(payroll.createdAt));
  }

  async updatePayroll(id: number, data: Partial<Payroll>): Promise<Payroll> {
    const [updated] = await db
      .update(payroll)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payroll.id, id))
      .returning();
    if (!updated) throw new Error("Payroll not found");
    return updated;
  }

  async getAllPayrolls(): Promise<Payroll[]> {
    return await db.select().from(payroll).orderBy(desc(payroll.period), desc(payroll.createdAt));
  }

  // Employee operations - implement basic ones needed
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
    return employee || undefined;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    const [updated] = await db
      .update(employees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    if (!updated) throw new Error("Employee not found");
    return updated;
  }

  // Contract operations - implement basic ones needed
  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db.insert(contracts).values(contract).returning();
    return newContract;
  }

  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async getContractsByEmployee(employeeId: number): Promise<Contract[]> {
    return await db.select().from(contracts).where(eq(contracts.employeeId, employeeId)).orderBy(desc(contracts.createdAt));
  }

  async updateContract(id: number, data: Partial<Contract>): Promise<Contract> {
    const [updated] = await db
      .update(contracts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    if (!updated) throw new Error("Contract not found");
    return updated;
  }

  async getActiveContracts(): Promise<Contract[]> {
    return await db.select().from(contracts).where(eq(contracts.status, "active")).orderBy(desc(contracts.createdAt));
  }

  // Leave operations - implement basic ones needed
  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const [newRequest] = await db.insert(leaveRequests).values(request).returning();
    return newRequest;
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return request || undefined;
  }

  async getLeaveRequestsByEmployee(employeeId: number): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, employeeId)).orderBy(desc(leaveRequests.createdAt));
  }

  async updateLeaveRequest(id: number, data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const [updated] = await db
      .update(leaveRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leaveRequests.id, id))
      .returning();
    if (!updated) throw new Error("Leave request not found");
    return updated;
  }

  async getLeaveBalance(employeeId: number, year: number): Promise<LeaveBalance[]> {
    return await db
      .select()
      .from(leaveBalances)
      .where(and(
        eq(leaveBalances.employeeId, employeeId),
        eq(leaveBalances.year, year)
      ));
  }

  // HR Request operations - implement basic ones needed
  async createHrRequest(request: InsertHrRequest): Promise<HrRequest> {
    const [newRequest] = await db.insert(hrRequests).values(request).returning();
    return newRequest;
  }

  async getHrRequest(id: number): Promise<HrRequest | undefined> {
    const [request] = await db.select().from(hrRequests).where(eq(hrRequests.id, id));
    return request || undefined;
  }

  async getHrRequestsByEmployee(employeeId: number): Promise<HrRequest[]> {
    return await db.select().from(hrRequests).where(eq(hrRequests.employeeId, employeeId)).orderBy(desc(hrRequests.createdAt));
  }

  async getAllHrRequests(): Promise<HrRequest[]> {
    return await db.select().from(hrRequests).orderBy(desc(hrRequests.createdAt));
  }

  async updateHrRequest(id: number, data: Partial<HrRequest>): Promise<HrRequest> {
    const [updated] = await db
      .update(hrRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(hrRequests.id, id))
      .returning();
    if (!updated) throw new Error("HR request not found");
    return updated;
  }

  // Analytics operations
  async getKPIs(): Promise<any> {
    const allApplications = await db.select().from(applications);
    const allJobs = await db.select().from(jobs).where(eq(jobs.isActive, 1));
    const allUsers = await db.select().from(users);
    
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
      ? (statusCounts.accepted / allApplications.length) * 100
      : 0;

    return {
      totalApplications: allApplications.length,
      totalJobs: allJobs.length,
      totalCandidates: candidates.length,
      totalRecruiters: recruiters.length,
      statusCounts,
      conversionRate,
      avgProcessingTime: 5,
      topPerformingJobs: this.getTopJobsFromApplications(allApplications, allJobs)
    };
  }

  private getTopJobsFromApplications(applications: Application[], jobs: Job[]) {
    const jobApplicationCounts = new Map<number, number>();
    
    applications.forEach(app => {
      const count = jobApplicationCounts.get(app.jobId) || 0;
      jobApplicationCounts.set(app.jobId, count + 1);
    });
    
    return Array.from(jobApplicationCounts.entries())
      .map(([jobId, count]) => {
        const job = jobs.find(j => j.id === jobId);
        return job ? { 
          title: job.title, 
          company: job.company, 
          applications: count 
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b?.applications || 0) - (a?.applications || 0))
      .slice(0, 3);
  }

  async getApplicationAnalytics(): Promise<any> {
    const allApplications = await db.select().from(applications);
    
    const monthlyData = [
      { month: 'Jan', applications: allApplications.filter(a => a.createdAt && a.createdAt.getMonth() === 0).length },
      { month: 'Fév', applications: allApplications.filter(a => a.createdAt && a.createdAt.getMonth() === 1).length },
      { month: 'Mar', applications: allApplications.filter(a => a.createdAt && a.createdAt.getMonth() === 2).length },
    ];
    
    const statusData = [
      { name: 'En attente', value: allApplications.filter(a => a.status === 'pending').length },
      { name: 'Examinées', value: allApplications.filter(a => a.status === 'reviewed').length },
      { name: 'Entretiens', value: allApplications.filter(a => a.status === 'interview').length },
      { name: 'Acceptées', value: allApplications.filter(a => a.status === 'accepted').length },
      { name: 'Refusées', value: allApplications.filter(a => a.status === 'rejected').length },
    ].filter(item => item.value > 0);
    
    return {
      monthlyApplications: monthlyData,
      statusDistribution: statusData,
      scoreDistribution: this.getScoreDistribution(allApplications)
    };
  }

  private getScoreDistribution(applications: Application[]) {
    const distribution = {
      '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
    };
    
    applications.forEach(app => {
      const score = app.autoScore || 0;
      if (score <= 20) distribution['0-20']++;
      else if (score <= 40) distribution['21-40']++;
      else if (score <= 60) distribution['41-60']++;
      else if (score <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });
    
    return Object.entries(distribution).map(([range, count]) => ({
      range, count
    }));
  }

  async getJobAnalytics(): Promise<any> {
    const allJobs = await db.select().from(jobs);
    const allApplications = await db.select().from(applications);
    
    const jobPopularity = allJobs.map(job => ({
      name: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
      applications: allApplications.filter(a => a.jobId === job.id).length,
    })).sort((a, b) => b.applications - a.applications).slice(0, 5);
    
    return {
      jobPopularity,
    };
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertApplicationSchema,
  insertInterviewSchema,
  insertInterviewEvaluationSchema,
  insertInterviewFeedbackSchema,
  insertPerformanceReviewSchema,
  insertTrainingProgramSchema,
  insertEmployeeTrainingSchema,
  insertDisciplinaryActionSchema,
  insertEmployeeDocumentSchema,
  insertTimeEntrySchema,
  insertCandidateInvitationSchema
} from "@shared/schema";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

export async function registerRoutes(app: Express): Promise<Server> {
  // Import des nouvelles routes d'authentification
  const { registerAuthRoutes } = await import("./authRoutes");
  
  // Auth middleware (Replit Auth - optionnel maintenant)
  await setupAuth(app);
  
  // Enregistrer les nouvelles routes d'authentification email/password
  registerAuthRoutes(app);

  // Create unified auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    // Check session-based auth first (email/password)
    const sessionUser = (req.session as any)?.user;
    if (sessionUser) {
      req.user = sessionUser;
      return next();
    }
    
    // Check Replit auth if session auth not available
    if (req.isAuthenticated() && req.user?.claims) {
      req.user = {
        id: req.user.id,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name,
        lastName: req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
        role: "admin" // Default for Replit auth users
      };
      return next();
    }
    
    return res.status(401).json({ message: "Non connecté" });
  };

  // Public job routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const { search, contractType, experienceLevel, location } = req.query;
      
      if (search || contractType || experienceLevel || location) {
        const filters = {
          contractType: contractType ? (contractType as string).split(',') : [],
          experienceLevel: experienceLevel ? (experienceLevel as string).split(',') : [],
          location: location as string,
        };
        const jobs = await storage.searchJobs(search as string || '', filters);
        res.json(jobs);
      } else {
        const jobs = await storage.getAllJobs();
        res.json(jobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // Protected application routes
  app.get("/api/applications", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const applications = await storage.getApplicationsByUser(userId);
      
      // Enrich with job details
      const enrichedApplications = await Promise.all(
        applications.map(async (app) => {
          const job = await storage.getJob(app.jobId);
          return { ...app, job };
        })
      );
      
      res.json(enrichedApplications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertApplicationSchema.parse({
        ...req.body,
        userId,
      });
      
      const application = await storage.createApplication(validatedData, userId);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create application"
      });
    }
  });

  // Object storage routes for file uploads
  app.get("/objects/:objectPath(*)", requireAuth, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/documents", requireAuth, async (req: any, res) => {
    if (!req.body.documentURL) {
      return res.status(400).json({ error: "documentURL is required" });
    }

    const userId = req.user?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.documentURL,
        {
          owner: userId,
          visibility: "private", // Documents are private to the user
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes - require admin/hr/recruiter role
  const requireAdminRole = async (req: any, res: any, next: any) => {
    try {
      // User is already authenticated and attached via requireAuth
      const user = req.user;
      if (!user?.role || !["admin", "hr", "recruiter"].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking permissions" });
    }
  };

  // Admin job management
  app.get("/api/admin/jobs", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching admin jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Admin application management
  app.get("/api/admin/applications", requireAuth, requireAdminRole, async (req, res) => {
    try {
      // Mock data pour le moment
      const applications: any[] = [];
      res.json(applications);
    } catch (error) {
      console.error("Error fetching admin applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Get recruiters
  app.get("/api/admin/recruiters", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const recruiters = await storage.getRecruiters();
      res.json(recruiters);
    } catch (error) {
      console.error("Error fetching recruiters:", error);
      res.status(500).json({ message: "Failed to fetch recruiters" });
    }
  });

  // Get top candidates for a job
  app.get("/api/admin/top-candidates/:jobId", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const { recruitmentService } = await import("./recruitmentService");
      const jobId = parseInt(req.params.jobId);
      const topCandidates = await recruitmentService.getTopCandidates(jobId);
      res.json(topCandidates);
    } catch (error) {
      console.error("Error fetching top candidates:", error);
      res.status(500).json({ message: "Failed to fetch top candidates" });
    }
  });

  // Assign candidates to recruiter
  app.post("/api/admin/assign-candidates", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const { recruitmentService } = await import("./recruitmentService");
      const { applicationIds, recruiterId } = req.body;
      
      if (!applicationIds || !recruiterId) {
        return res.status(400).json({ error: "applicationIds and recruiterId are required" });
      }
      
      await recruitmentService.assignCandidatesToRecruiter(applicationIds, recruiterId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error assigning candidates:", error);
      res.status(500).json({ message: "Failed to assign candidates" });
    }
  });

  // Get assigned candidates for recruiter
  app.get("/api/recruiter/assigned-candidates", requireAuth, async (req: any, res) => {
    try {
      const { recruitmentService } = await import("./recruitmentService");
      const userId = req.user.id;
      const assignedCandidates = await recruitmentService.getAssignedApplications(userId);
      res.json(assignedCandidates);
    } catch (error) {
      console.error("Error fetching assigned candidates:", error);
      res.status(500).json({ message: "Failed to fetch assigned candidates" });
    }
  });

  // Update manual score
  app.put("/api/recruiter/score/:applicationId", requireAuth, async (req: any, res) => {
    try {
      const { recruitmentService } = await import("./recruitmentService");
      const applicationId = parseInt(req.params.applicationId);
      const { score, notes } = req.body;
      
      if (score === undefined) {
        return res.status(400).json({ error: "Score is required" });
      }
      
      await recruitmentService.updateManualScore(applicationId, score, notes);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating manual score:", error);
      res.status(500).json({ message: "Failed to update score" });
    }
  });

  // Get final top 3 results
  app.get("/api/admin/final-top3/:jobId", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const { recruitmentService } = await import("./recruitmentService");
      const jobId = parseInt(req.params.jobId);
      const finalTop3 = await recruitmentService.getFinalTop3(jobId);
      res.json(finalTop3);
    } catch (error) {
      console.error("Error fetching final top 3:", error);
      res.status(500).json({ message: "Failed to fetch final results" });
    }
  });

  // Complete user profile
  app.put("/api/profile/complete", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileData = {
        ...req.body,
        profileCompleted: true
      };
      
      const updatedUser = await storage.updateUser(userId, profileData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error completing profile:", error);
      res.status(500).json({ message: "Failed to complete profile" });
    }
  });

  // Enhanced application search routes
  app.get("/api/applications/search-by-score", requireAuth, async (req: any, res) => {
    try {
      const { minAutoScore, maxAutoScore, minManualScore, maxManualScore } = req.query;
      const applications = await storage.searchApplicationsByScore(
        minAutoScore ? parseInt(minAutoScore as string) : undefined,
        maxAutoScore ? parseInt(maxAutoScore as string) : undefined,
        minManualScore ? parseInt(minManualScore as string) : undefined,
        maxManualScore ? parseInt(maxManualScore as string) : undefined
      );
      res.json(applications);
    } catch (error) {
      console.error("Error searching applications by score:", error);
      res.status(500).json({ error: "Failed to search applications" });
    }
  });

  app.get("/api/applications/search-by-date", requireAuth, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start and end dates are required" });
      }
      const applications = await storage.getApplicationsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(applications);
    } catch (error) {
      console.error("Error searching applications by date:", error);
      res.status(500).json({ error: "Failed to search applications" });
    }
  });

  // Payroll management routes
  app.post("/api/payroll", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !['hr', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const payrollData = req.body;
      const newPayroll = await storage.createPayroll(payrollData);
      res.status(201).json(newPayroll);
    } catch (error) {
      console.error("Error creating payroll:", error);
      res.status(500).json({ error: "Failed to create payroll" });
    }
  });

  app.get("/api/payroll", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !['hr', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const payrolls = await storage.getAllPayrolls();
      res.json(payrolls);
    } catch (error) {
      console.error("Error fetching payrolls:", error);
      res.status(500).json({ error: "Failed to fetch payrolls" });
    }
  });

  app.put("/api/payroll/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !['hr', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const payroll = await storage.updatePayroll(parseInt(req.params.id), req.body);
      res.json(payroll);
    } catch (error) {
      console.error("Error updating payroll:", error);
      res.status(500).json({ error: "Failed to update payroll" });
    }
  });

  app.get("/api/payroll/employee/:employeeId", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !['hr', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const payrolls = await storage.getPayrollsByEmployee(parseInt(req.params.employeeId));
      res.json(payrolls);
    } catch (error) {
      console.error("Error fetching employee payrolls:", error);
      res.status(500).json({ error: "Failed to fetch employee payrolls" });
    }
  });

  // Admin KPIs and analytics
  app.get("/api/admin/kpis", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const kpis = await storage.getKPIs();
      res.json(kpis);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  app.get("/api/admin/analytics/applications", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const analytics = await storage.getApplicationAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching application analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/analytics/jobs", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const jobAnalytics = await storage.getJobAnalytics();
      res.json(jobAnalytics);
    } catch (error) {
      console.error("Error fetching job analytics:", error);
      res.status(500).json({ message: "Failed to fetch job analytics" });
    }
  });

  // User management routes (admin/HR only)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { role } = req.query;
      const users = role ? await storage.getUsersByRole(role as string) : await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id } = req.params;
      const updateData = req.body;
      
      // Ne pas permettre de modifier son propre rôle
      if (id === req.user.id && updateData.role && updateData.role !== currentUser.role) {
        return res.status(400).json({ message: "Cannot modify your own role" });
      }
      
      const updatedUser = await storage.updateUser(id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied - Admin only" });
      }
      
      const { id } = req.params;
      
      // Ne pas permettre de supprimer son propre compte
      if (id === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // =============================================================================
  // ONBOARDING MANAGEMENT ROUTES
  // =============================================================================

  // Onboarding Process Management (Admin/HR only)
  app.get("/api/onboarding/processes", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const processes = await storage.getAllOnboardingProcesses();
      res.json(processes);
    } catch (error) {
      console.error("Error fetching onboarding processes:", error);
      res.status(500).json({ message: "Failed to fetch onboarding processes" });
    }
  });

  app.post("/api/onboarding/processes", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const processData = { ...req.body, createdBy: req.user.id };
      const newProcess = await storage.createOnboardingProcess(processData);
      res.status(201).json(newProcess);
    } catch (error) {
      console.error("Error creating onboarding process:", error);
      res.status(500).json({ message: "Failed to create onboarding process" });
    }
  });

  app.put("/api/onboarding/processes/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id } = req.params;
      const updatedProcess = await storage.updateOnboardingProcess(parseInt(id), req.body);
      res.json(updatedProcess);
    } catch (error) {
      console.error("Error updating onboarding process:", error);
      res.status(500).json({ message: "Failed to update onboarding process" });
    }
  });

  // Onboarding Steps Management
  app.get("/api/onboarding/processes/:processId/steps", requireAuth, async (req, res) => {
    try {
      const { processId } = req.params;
      const steps = await storage.getOnboardingStepsByProcess(parseInt(processId));
      res.json(steps);
    } catch (error) {
      console.error("Error fetching onboarding steps:", error);
      res.status(500).json({ message: "Failed to fetch onboarding steps" });
    }
  });

  app.post("/api/onboarding/processes/:processId/steps", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { processId } = req.params;
      const stepData = { ...req.body, processId: parseInt(processId) };
      const newStep = await storage.createOnboardingStep(stepData);
      res.status(201).json(newStep);
    } catch (error) {
      console.error("Error creating onboarding step:", error);
      res.status(500).json({ message: "Failed to create onboarding step" });
    }
  });

  // Candidate Onboarding Management
  app.post("/api/onboarding/candidates", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Générer un employeeId si pas déjà défini
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      if (user && !user.employeeId) {
        const employeeId = await storage.generateEmployeeId(user.firstName || '', user.lastName || '');
        await storage.updateUser(userId, { employeeId });
      }
      
      const onboardingData = { ...req.body, createdBy: req.user.id };
      const newOnboarding = await storage.createCandidateOnboarding(onboardingData);
      res.status(201).json(newOnboarding);
    } catch (error) {
      console.error("Error creating candidate onboarding:", error);
      res.status(500).json({ message: "Failed to create candidate onboarding" });
    }
  });

  app.get("/api/onboarding/candidates/user/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = await storage.getUser(req.user.id);
      
      // L'utilisateur peut voir son propre onboarding ou admin/hr peuvent voir tous
      if (userId !== req.user.id && 
          (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr'))) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const onboardings = await storage.getCandidateOnboardingByUser(userId);
      res.json(onboardings);
    } catch (error) {
      console.error("Error fetching candidate onboarding:", error);
      res.status(500).json({ message: "Failed to fetch candidate onboarding" });
    }
  });

  app.get("/api/onboarding/candidates/:id/steps", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const onboarding = await storage.getCandidateOnboarding(parseInt(id));
      
      if (!onboarding) {
        return res.status(404).json({ message: "Onboarding not found" });
      }
      
      const currentUser = await storage.getUser(req.user.id);
      // Vérifier l'accès : propriétaire ou admin/hr
      if (onboarding.userId !== req.user.id && 
          (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr'))) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const completions = await storage.getStepCompletionsByOnboarding(parseInt(id));
      res.json(completions);
    } catch (error) {
      console.error("Error fetching onboarding steps:", error);
      res.status(500).json({ message: "Failed to fetch onboarding steps" });
    }
  });

  app.put("/api/onboarding/steps/:completionId", requireAuth, async (req, res) => {
    try {
      const { completionId } = req.params;
      const updateData = { ...req.body, completedBy: req.user.id };
      
      if (req.body.status === 'completed') {
        updateData.completionDate = new Date();
      }
      
      const updatedCompletion = await storage.updateStepCompletion(parseInt(completionId), updateData);
      res.json(updatedCompletion);
    } catch (error) {
      console.error("Error updating step completion:", error);
      res.status(500).json({ message: "Failed to update step completion" });
    }
  });

  // Generate Employee ID endpoint
  app.post("/api/onboarding/generate-employee-id", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { firstName, lastName } = req.body;
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }
      
      const employeeId = await storage.generateEmployeeId(firstName, lastName);
      res.json({ employeeId });
    } catch (error) {
      console.error("Error generating employee ID:", error);
      res.status(500).json({ message: "Failed to generate employee ID" });
    }
  });

  // Onboarding Analytics endpoint
  app.get("/api/onboarding/analytics", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const analytics = await storage.getOnboardingAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching onboarding analytics:", error);
      res.status(500).json({ message: "Failed to fetch onboarding analytics" });
    }
  });

  // Process Templates endpoint
  app.get("/api/onboarding/templates", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const templates = await storage.getOnboardingProcessTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching process templates:", error);
      res.status(500).json({ message: "Failed to fetch process templates" });
    }
  });

  // Create process from template
  app.post("/api/onboarding/templates/:templateId/create", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { templateId } = req.params;
      const { customName } = req.body;
      
      const templates = await storage.getOnboardingProcessTemplates();
      const template = templates.find(t => t.id === parseInt(templateId));
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Créer le processus basé sur le template
      const processData = {
        name: customName || template.name,
        description: template.description,
        department: template.department,
        estimatedDuration: template.estimatedDuration,
        createdBy: req.user.id
      };
      
      const newProcess = await storage.createOnboardingProcess(processData);
      
      // Créer les étapes basées sur le template
      if ((template as any).steps) {
        for (let i = 0; i < (template as any).steps.length; i++) {
          const step = (template as any).steps[i];
          await storage.createOnboardingStep({
            processId: newProcess.id,
            stepNumber: i + 1,
            title: step.title,
            description: `Étape ${step.category} - ${step.title}`,
            category: step.category,
            isRequired: true,
            estimatedDuration: step.duration,
            assignedRole: currentUser.role === 'admin' ? 'admin' : 'hr'
          });
        }
      }
      
      res.status(201).json(newProcess);
    } catch (error) {
      console.error("Error creating process from template:", error);
      res.status(500).json({ message: "Failed to create process from template" });
    }
  });

  // ===== FEEDBACK SYSTEM ROUTES =====
  
  // Submit feedback for onboarding experience
  app.post("/api/onboarding/feedback", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const feedbackData = {
        ...req.body,
        userId
      };
      const feedback = await storage.createOnboardingFeedback(feedbackData);
      res.json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  // Get feedback for a specific onboarding or all feedback (admin)
  app.get("/api/onboarding/feedback", requireAuth, async (req: any, res) => {
    try {
      const { candidateOnboardingId } = req.query;
      const feedback = await storage.getOnboardingFeedback(candidateOnboardingId ? parseInt(candidateOnboardingId) : undefined);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // ===== ACHIEVEMENT SYSTEM ROUTES =====
  
  // Get all available achievements
  app.get("/api/onboarding/achievements", requireAuth, async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Get user's earned achievements
  app.get("/api/onboarding/user-achievements", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  // Award achievement to user (admin only)
  app.post("/api/onboarding/award-achievement", requireAuth, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.id);
      if (adminUser?.role !== 'admin' && adminUser?.role !== 'hr') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId, achievementId, candidateOnboardingId } = req.body;
      const award = await storage.awardAchievement(userId, achievementId, candidateOnboardingId);
      res.json(award);
    } catch (error) {
      console.error("Error awarding achievement:", error);
      res.status(500).json({ message: "Failed to award achievement" });
    }
  });

  // ===== CALENDAR EVENTS ROUTES =====
  
  // Create onboarding event
  app.post("/api/onboarding/events", requireAuth, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.id);
      if (adminUser?.role !== 'admin' && adminUser?.role !== 'hr') {
        return res.status(403).json({ message: "Access denied" });
      }

      const eventData = {
        ...req.body,
        createdBy: req.user.id
      };
      const event = await storage.createOnboardingEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Get onboarding events
  app.get("/api/onboarding/events", requireAuth, async (req: any, res) => {
    try {
      const { candidateOnboardingId } = req.query;
      const events = await storage.getOnboardingEvents(candidateOnboardingId ? parseInt(candidateOnboardingId) : undefined);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Update onboarding event
  app.put("/api/onboarding/events/:id", requireAuth, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.id);
      if (adminUser?.role !== 'admin' && adminUser?.role !== 'hr') {
        return res.status(403).json({ message: "Access denied" });
      }

      const eventId = parseInt(req.params.id);
      const updatedEvent = await storage.updateOnboardingEvent(eventId, req.body);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  // Interview Management Routes
  app.get("/api/interviews", requireAuth, async (req, res) => {
    try {
      const interviews = await storage.getInterviews();
      res.json(interviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });

  app.post("/api/interviews", requireAuth, async (req: any, res) => {
    try {
      const interviewData = insertInterviewSchema.parse({
        ...req.body,
        createdBy: req.user?.claims?.sub
      });
      const interview = await storage.createInterview(interviewData);
      res.status(201).json(interview);
    } catch (error) {
      console.error("Error creating interview:", error);
      res.status(500).json({ message: "Failed to create interview" });
    }
  });

  // Interview Evaluations
  app.post("/api/interviews/evaluations", requireAuth, async (req, res) => {
    try {
      const evaluationData = insertInterviewEvaluationSchema.parse(req.body);
      const evaluation = await storage.createInterviewEvaluation(evaluationData);
      res.status(201).json(evaluation);
    } catch (error) {
      console.error("Error creating interview evaluation:", error);
      res.status(500).json({ message: "Failed to create interview evaluation" });
    }
  });

  // Interview Feedback
  app.post("/api/interviews/feedback", requireAuth, async (req, res) => {
    try {
      const feedbackData = insertInterviewFeedbackSchema.parse(req.body);
      const feedback = await storage.createInterviewFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error creating interview feedback:", error);
      res.status(500).json({ message: "Failed to create interview feedback" });
    }
  });

  // Performance Reviews
  app.get("/api/performance-reviews", requireAuth, async (req, res) => {
    try {
      const reviews = await storage.getPerformanceReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching performance reviews:", error);
      res.status(500).json({ message: "Failed to fetch performance reviews" });
    }
  });

  app.post("/api/performance-reviews", requireAuth, async (req: any, res) => {
    try {
      const reviewData = insertPerformanceReviewSchema.parse({
        ...req.body,
        reviewerId: req.user?.claims?.sub
      });
      const review = await storage.createPerformanceReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating performance review:", error);
      res.status(500).json({ message: "Failed to create performance review" });
    }
  });

  // Training Programs
  app.get("/api/training-programs", requireAuth, async (req, res) => {
    try {
      const programs = await storage.getTrainingPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching training programs:", error);
      res.status(500).json({ message: "Failed to fetch training programs" });
    }
  });

  app.post("/api/training-programs", requireAuth, async (req: any, res) => {
    try {
      const programData = insertTrainingProgramSchema.parse({
        ...req.body,
        createdBy: req.user?.claims?.sub
      });
      const program = await storage.createTrainingProgram(programData);
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating training program:", error);
      res.status(500).json({ message: "Failed to create training program" });
    }
  });

  // Employee Training Records
  app.get("/api/employee-training", requireAuth, async (req, res) => {
    try {
      const trainings = await storage.getEmployeeTraining();
      res.json(trainings);
    } catch (error) {
      console.error("Error fetching employee training:", error);
      res.status(500).json({ message: "Failed to fetch employee training" });
    }
  });

  app.post("/api/employee-training", requireAuth, async (req: any, res) => {
    try {
      const trainingData = insertEmployeeTrainingSchema.parse({
        ...req.body,
        assignedBy: req.user?.claims?.sub
      });
      const training = await storage.createEmployeeTraining(trainingData);
      res.status(201).json(training);
    } catch (error) {
      console.error("Error creating employee training:", error);
      res.status(500).json({ message: "Failed to create employee training" });
    }
  });

  // Time Entries for employees
  app.get("/api/time-entries", requireAuth, async (req, res) => {
    try {
      const entries = await storage.getTimeEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", requireAuth, async (req: any, res) => {
    try {
      const timeEntryData = insertTimeEntrySchema.parse({
        ...req.body,
        approvedBy: req.user?.claims?.sub
      });
      const timeEntry = await storage.createTimeEntry(timeEntryData);
      res.status(201).json(timeEntry);
    } catch (error) {
      console.error("Error creating time entry:", error);
      res.status(500).json({ message: "Failed to create time entry" });
    }
  });

  // Candidate Invitations Routes
  app.get("/api/candidate-invitations", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const invitations = await storage.getCandidateInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching candidate invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post("/api/candidate-invitations", requireAuth, requireAdminRole, async (req: any, res) => {
    try {
      const { randomUUID } = await import("crypto");
      
      const invitationData = insertCandidateInvitationSchema.parse({
        ...req.body,
        sentBy: req.user?.claims?.sub,
        invitationToken: randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      });
      
      const invitation = await storage.createCandidateInvitation(invitationData);
      
      // TODO: Envoyer l'email d'invitation ici
      // await sendInvitationEmail(invitation);
      
      res.status(201).json(invitation);
    } catch (error) {
      console.error("Error creating candidate invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Route publique pour accepter l'invitation candidat (via token)
  app.get("/api/candidate-invitation/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getCandidateInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      if (new Date() > new Date(invitation.expiresAt)) {
        return res.status(410).json({ message: "Invitation expired" });
      }
      
      // Marquer l'invitation comme ouverte
      await storage.updateCandidateInvitation(invitation.id, {
        status: "opened"
      });
      
      res.json(invitation);
    } catch (error) {
      console.error("Error validating invitation:", error);
      res.status(500).json({ message: "Failed to validate invitation" });
    }
  });

  // Initialize default achievements on startup
  try {
    await storage.initializeDefaultAchievements();
  } catch (error) {
    console.log("Achievements initialization:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}

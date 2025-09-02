import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertApplicationSchema } from "@shared/schema";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // Si l'utilisateur n'a pas de rôle, on lui assigne "admin" temporairement pour les tests
      if (!user || !user.role) {
        user = await storage.upsertUser({
          id: userId,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: req.user.claims.profile_image_url,
          role: "admin" // Rôle temporaire pour les tests
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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
  app.get("/api/applications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post("/api/applications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/documents", isAuthenticated, async (req: any, res) => {
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.role || !["admin", "hr", "recruiter"].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      req.user.role = user.role; // Attach role to request
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking permissions" });
    }
  };

  // Admin job management
  app.get("/api/admin/jobs", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching admin jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Admin application management
  app.get("/api/admin/applications", isAuthenticated, requireAdminRole, async (req, res) => {
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
  app.get("/api/admin/recruiters", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const recruiters = await storage.getRecruiters();
      res.json(recruiters);
    } catch (error) {
      console.error("Error fetching recruiters:", error);
      res.status(500).json({ message: "Failed to fetch recruiters" });
    }
  });

  // Get top candidates for a job
  app.get("/api/admin/top-candidates/:jobId", isAuthenticated, requireAdminRole, async (req, res) => {
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
  app.post("/api/admin/assign-candidates", isAuthenticated, requireAdminRole, async (req, res) => {
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
  app.get("/api/recruiter/assigned-candidates", isAuthenticated, async (req: any, res) => {
    try {
      const { recruitmentService } = await import("./recruitmentService");
      const userId = req.user.claims.sub;
      const assignedCandidates = await recruitmentService.getAssignedApplications(userId);
      res.json(assignedCandidates);
    } catch (error) {
      console.error("Error fetching assigned candidates:", error);
      res.status(500).json({ message: "Failed to fetch assigned candidates" });
    }
  });

  // Update manual score
  app.put("/api/recruiter/score/:applicationId", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/admin/final-top3/:jobId", isAuthenticated, requireAdminRole, async (req, res) => {
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
  app.put("/api/profile/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get("/api/applications/search-by-score", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/applications/search-by-date", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/payroll", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/payroll", isAuthenticated, async (req: any, res) => {
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

  app.put("/api/payroll/:id", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/payroll/employee/:employeeId", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/admin/kpis", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const kpis = await storage.getKPIs();
      res.json(kpis);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  app.get("/api/admin/analytics/applications", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const analytics = await storage.getApplicationAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching application analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/analytics/jobs", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const jobAnalytics = await storage.getJobAnalytics();
      res.json(jobAnalytics);
    } catch (error) {
      console.error("Error fetching job analytics:", error);
      res.status(500).json({ message: "Failed to fetch job analytics" });
    }
  });

  // User management routes (admin/HR only)
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
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

  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id } = req.params;
      const updateData = req.body;
      
      // Ne pas permettre de modifier son propre rôle
      if (id === req.user.claims.sub && updateData.role && updateData.role !== currentUser.role) {
        return res.status(400).json({ message: "Cannot modify your own role" });
      }
      
      const updatedUser = await storage.updateUser(id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied - Admin only" });
      }
      
      const { id } = req.params;
      
      // Ne pas permettre de supprimer son propre compte
      if (id === req.user.claims.sub) {
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
  app.get("/api/onboarding/processes", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
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

  app.post("/api/onboarding/processes", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const processData = { ...req.body, createdBy: req.user.claims.sub };
      const newProcess = await storage.createOnboardingProcess(processData);
      res.status(201).json(newProcess);
    } catch (error) {
      console.error("Error creating onboarding process:", error);
      res.status(500).json({ message: "Failed to create onboarding process" });
    }
  });

  app.put("/api/onboarding/processes/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
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
  app.get("/api/onboarding/processes/:processId/steps", isAuthenticated, async (req, res) => {
    try {
      const { processId } = req.params;
      const steps = await storage.getOnboardingStepsByProcess(parseInt(processId));
      res.json(steps);
    } catch (error) {
      console.error("Error fetching onboarding steps:", error);
      res.status(500).json({ message: "Failed to fetch onboarding steps" });
    }
  });

  app.post("/api/onboarding/processes/:processId/steps", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
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
  app.post("/api/onboarding/candidates", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
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
      
      const onboardingData = { ...req.body, createdBy: req.user.claims.sub };
      const newOnboarding = await storage.createCandidateOnboarding(onboardingData);
      res.status(201).json(newOnboarding);
    } catch (error) {
      console.error("Error creating candidate onboarding:", error);
      res.status(500).json({ message: "Failed to create candidate onboarding" });
    }
  });

  app.get("/api/onboarding/candidates/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = await storage.getUser(req.user.claims.sub);
      
      // L'utilisateur peut voir son propre onboarding ou admin/hr peuvent voir tous
      if (userId !== req.user.claims.sub && 
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

  app.get("/api/onboarding/candidates/:id/steps", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const onboarding = await storage.getCandidateOnboarding(parseInt(id));
      
      if (!onboarding) {
        return res.status(404).json({ message: "Onboarding not found" });
      }
      
      const currentUser = await storage.getUser(req.user.claims.sub);
      // Vérifier l'accès : propriétaire ou admin/hr
      if (onboarding.userId !== req.user.claims.sub && 
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

  app.put("/api/onboarding/steps/:completionId", isAuthenticated, async (req, res) => {
    try {
      const { completionId } = req.params;
      const updateData = { ...req.body, completedBy: req.user.claims.sub };
      
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
  app.post("/api/onboarding/generate-employee-id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
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

  const httpServer = createServer(app);
  return httpServer;
}

import { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes } from "./authRoutes";
import { insertJobSchema, insertApplicationSchema, updateApplicationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const { createServer } = await import("http");
  
  // Configuration des sessions (nécessaire pour l'authentification)
  const { getSession } = await import("./replitAuth");
  app.use(getSession());
  
  // Enregistrer les routes d'authentification email/password
  registerAuthRoutes(app);

  // Middleware d'authentification simplifié
  const requireAuth = (req: any, res: any, next: any) => {
    const sessionUser = (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: "Non connecté" });
    }
    req.user = sessionUser;
    next();
  };

  const requireAdminRole = async (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user?.role || !["admin", "hr", "recruiter"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };

  // Routes publiques - Jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
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

  // Routes authentifiées - Applications
  app.get("/api/applications", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const applications = await storage.getApplicationsByUser(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Validation des données avec le schéma Zod
      const validatedData = insertApplicationSchema.parse(req.body);
      
      // Convert availability string to Date if provided
      if (validatedData.availability && typeof validatedData.availability === 'string') {
        validatedData.availability = new Date(validatedData.availability);
      }
      
      // Création de la candidature via le storage
      const application = await storage.createApplication(validatedData, userId);
      res.status(201).json(application);
    } catch (error: any) {
      console.error("Error creating application:", error);
      
      if (error?.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Données invalides", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  // Routes admin
  app.get("/api/admin/jobs", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching admin jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post("/api/admin/jobs", requireAuth, requireAdminRole, async (req, res) => {
    try {
      // Validation des données avec le schéma Zod
      const validatedData = insertJobSchema.parse(req.body);
      
      // Création de l'emploi via le storage
      const newJob = await storage.createJob(validatedData);
      
      res.status(201).json(newJob);
    } catch (error: any) {
      console.error("Error creating job:", error);
      
      if (error?.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Données invalides", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.patch("/api/admin/jobs/:id", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "ID d'emploi invalide" });
      }

      // Validation partielle des données avec le schéma Zod
      const validatedData = insertJobSchema.partial().parse(req.body);
      
      // Mise à jour de l'emploi via le storage
      const updatedJob = await storage.updateJob(jobId, validatedData);
      
      if (!updatedJob) {
        return res.status(404).json({ message: "Emploi non trouvé" });
      }
      
      res.json(updatedJob);
    } catch (error: any) {
      console.error("Error updating job:", error);
      
      if (error?.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Données invalides", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/admin/jobs/:id", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "ID d'emploi invalide" });
      }

      const deleted = await storage.deleteJob(jobId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Emploi non trouvé" });
      }
      
      res.json({ message: "Emploi supprimé avec succès" });
    } catch (error: any) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  app.get("/api/admin/applications", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching admin applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.patch("/api/admin/applications/:id", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "ID de candidature invalide" });
      }

      // Validation partielle des données avec le schéma Zod
      const validatedData = updateApplicationSchema.parse(req.body);
      
      // Mise à jour de la candidature via le storage
      const updatedApplication = await storage.updateApplication(applicationId, validatedData);
      
      if (!updatedApplication) {
        return res.status(404).json({ message: "Candidature non trouvée" });
      }
      
      res.json(updatedApplication);
    } catch (error: any) {
      console.error("Error updating application:", error);
      
      if (error?.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Données invalides", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.delete("/api/admin/applications/:id", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "ID de candidature invalide" });
      }

      const deleted = await storage.deleteApplication(applicationId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Candidature non trouvée" });
      }
      
      res.json({ message: "Candidature supprimée avec succès" });
    } catch (error: any) {
      console.error("Error deleting application:", error);
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  app.get("/api/admin/recruiters", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const recruiters = await storage.getRecruiters();
      res.json(recruiters);
    } catch (error) {
      console.error("Error fetching recruiters:", error);
      res.status(500).json({ message: "Failed to fetch recruiters" });
    }
  });

  // Routes utilisateur
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Vérification des permissions
      if (userId !== (req.user as any)?.id && !["admin", "hr"].includes((req.user as any)?.role || "")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Routes de gestion de la paie
  app.get("/api/payroll", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!["admin", "hr"].includes(user.role)) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const payrolls = await storage.getAllPayrolls();
      res.json(payrolls);
    } catch (error) {
      console.error("Error fetching payrolls:", error);
      res.status(500).json({ message: "Failed to fetch payrolls" });
    }
  });

  app.post("/api/payroll", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!["admin", "hr"].includes(user.role)) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const payrollData = {
        ...req.body,
        createdBy: user.id
      };
      
      const newPayroll = await storage.createPayroll(payrollData);
      res.status(201).json(newPayroll);
    } catch (error) {
      console.error("Error creating payroll:", error);
      res.status(500).json({ message: "Failed to create payroll" });
    }
  });

  app.put("/api/payroll/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!["admin", "hr"].includes(user.role)) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const payrollId = parseInt(req.params.id);
      const updatedPayroll = await storage.updatePayroll(payrollId, req.body);
      res.json(updatedPayroll);
    } catch (error) {
      console.error("Error updating payroll:", error);
      res.status(500).json({ message: "Failed to update payroll" });
    }
  });

  app.get("/api/payroll/:id/payslip", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!["admin", "hr"].includes(user.role)) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const payrollId = parseInt(req.params.id);
      const payroll = await storage.getPayroll(payrollId);
      
      if (!payroll) {
        return res.status(404).json({ message: "Bulletin de paie non trouvé" });
      }

      res.json(payroll);
    } catch (error) {
      console.error("Error fetching payslip:", error);
      res.status(500).json({ message: "Failed to fetch payslip" });
    }
  });

  app.post("/api/payroll/:id/generate-pdf", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!["admin", "hr"].includes(user.role)) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const payrollId = parseInt(req.params.id);
      // TODO: Implémenter génération PDF du bulletin de paie
      res.json({ message: "PDF generation not implemented yet" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.post("/api/payroll/:id/send-email", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!["admin", "hr"].includes(user.role)) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const payrollId = parseInt(req.params.id);
      const { email, customMessage } = req.body;
      
      // TODO: Implémenter envoi email du bulletin de paie
      res.json({ message: "Email sending not implemented yet" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Routes des employés pour la paie
  app.get("/api/employees", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!["admin", "hr"].includes(user.role)) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
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

  // Cette ligne sera remplacée par le middleware Vite en développement

  // Créer et retourner le serveur HTTP
  const server = createServer(app);
  return server;
}
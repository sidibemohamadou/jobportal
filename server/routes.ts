import { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { registerAuthRoutes } from "./authRoutes";
import { insertJobSchema } from "@shared/schema";

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
      const applications: any[] = []; // Mock data for now
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
      // Mock response for now
      const application = { id: 1, ...req.body, candidateId: userId };
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating application:", error);
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

  app.get("/api/admin/applications", requireAuth, requireAdminRole, async (req, res) => {
    try {
      const applications: any[] = []; // Mock data for now
      res.json(applications);
    } catch (error) {
      console.error("Error fetching admin applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
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

  // Cette ligne sera remplacée par le middleware Vite en développement

  // Créer et retourner le serveur HTTP
  const server = createServer(app);
  return server;
}
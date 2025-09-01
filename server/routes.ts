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
      
      const application = await storage.createApplication(validatedData);
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

  const httpServer = createServer(app);
  return httpServer;
}

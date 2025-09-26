import type { Express } from "express";
import { AuthService, type LoginCredentials, type RegisterCredentials } from "./auth";
import { z } from "zod";

// Schemas de validation
const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères")
});

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis")
});

const createAdminSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  role: z.enum(["candidate", "employee", "recruiter", "manager", "hr", "admin"], {
    errorMap: () => ({ message: "Rôle invalide. Rôles autorisés: candidate, employee, recruiter, manager, hr, admin" })
  }),
  phone: z.string().optional()
});

// Schema pour la mise à jour des utilisateurs avec validation des rôles
const updateUserSchema = z.object({
  email: z.string().email("Email invalide").optional(),
  firstName: z.string().min(1, "Le prénom est requis").optional(),
  lastName: z.string().min(1, "Le nom est requis").optional(),
  role: z.enum(["candidate", "employee", "recruiter", "manager", "hr", "admin"]).optional(),
  phone: z.string().optional(),
  profileCompleted: z.boolean().optional()
});

export function registerAuthRoutes(app: Express) {
  // === AUTHENTIFICATION CANDIDATS ===
  
  // Connexion candidat
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      const user = await AuthService.authenticateUser(credentials);
      if (!user) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      // Créer une session
      if (!req.session) {
        console.error("Session not available. Session middleware may not be properly configured.");
        return res.status(500).json({ message: "Configuration de session manquante" });
      }
      (req.session as any).user = user;
      
      // Redirection selon le rôle
      const redirectPath = AuthService.getRedirectPath(user.role);
      
      res.json({ 
        user,
        redirectPath,
        message: "Connexion réussie" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données invalides", 
          errors: error.errors 
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Inscription candidat
  app.post("/api/auth/register", async (req, res) => {
    try {
      const credentials = registerSchema.parse(req.body);
      
      const user = await AuthService.registerCandidate(credentials);
      if (!user) {
        return res.status(400).json({ message: "Erreur lors de l'inscription" });
      }

      // Créer une session
      if (!req.session) {
        console.error("Session not available. Session middleware may not be properly configured.");
        return res.status(500).json({ message: "Configuration de session manquante" });
      }
      (req.session as any).user = user;
      
      res.status(201).json({ 
        user,
        redirectPath: "/dashboard",
        message: "Inscription réussie" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données invalides", 
          errors: error.errors 
        });
      }
      if (error instanceof Error && error.message.includes("existe déjà")) {
        return res.status(409).json({ message: error.message });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // === AUTHENTIFICATION ADMIN ===
  
  // Connexion admin (séparée)
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      const user = await AuthService.authenticateUser(credentials);
      if (!user) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      // Vérifier que c'est bien un utilisateur admin
      const adminRoles = ["admin", "hr", "recruiter", "manager"];
      if (!adminRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: "Accès non autorisé. Cette page est réservée aux administrateurs." 
        });
      }

      // Créer une session
      if (!req.session) {
        console.error("Session not available. Session middleware may not be properly configured.");
        return res.status(500).json({ message: "Configuration de session manquante" });
      }
      (req.session as any).user = user;
      
      // Redirection selon le rôle
      const redirectPath = AuthService.getRedirectPath(user.role);
      
      res.json({ 
        user,
        redirectPath,
        message: "Connexion administrateur réussie" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données invalides", 
          errors: error.errors 
        });
      }
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Création d'utilisateur admin (réservé au super admin avec contrôles RBAC)
  app.post("/api/admin/users", async (req, res) => {
    try {
      // Vérifier que l'utilisateur connecté est un super admin
      const currentUser = (req.session as any)?.user;
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ 
          message: "Seul le super administrateur peut créer des comptes utilisateurs" 
        });
      }

      const userData = createAdminSchema.parse(req.body);
      
      // Vérification RBAC: peut-on créer ce rôle ?
      if (!AuthService.canManageRole(currentUser.role, userData.role)) {
        return res.status(403).json({
          message: `Vous n'avez pas les permissions pour créer un utilisateur avec le rôle '${userData.role}'. Seul le super administrateur peut créer des rôles sensibles.`
        });
      }
      
      const newUser = await AuthService.createAdminUser(userData);
      
      res.status(201).json({ 
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          phone: newUser.phone,
          permissions: AuthService.getRolePermissions(newUser.role),
          moduleAccess: AuthService.getModuleAccess(newUser.role)
        },
        message: `Utilisateur ${userData.role} créé avec succès` 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données invalides", 
          errors: error.errors 
        });
      }
      if (error instanceof Error && error.message.includes("existe déjà")) {
        return res.status(409).json({ message: error.message });
      }
      console.error("Create admin user error:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Récupération des informations utilisateur avec permissions
  app.get("/api/admin/users", async (req, res) => {
    try {
      // Vérifier que l'utilisateur connecté a les permissions
      const currentUser = (req.session as any)?.user;
      if (!currentUser || !AuthService.hasPermission(currentUser.role, ["admin", "hr"])) {
        return res.status(403).json({ 
          message: "Accès refusé. Permissions insuffisantes." 
        });
      }

      const { role } = req.query;
      // Cette route devra être implémentée dans storage pour récupérer les utilisateurs
      // const users = role ? await storage.getUsersByRole(role as string) : await storage.getAllUsers();
      
      // Pour maintenant, retourner une réponse temporaire
      res.json({ 
        message: "Route en cours d'implémentation",
        permissions: AuthService.getRolePermissions(currentUser.role),
        canCreateSensitiveRoles: AuthService.hasPermission(currentUser.role, ["admin"])
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Route pour obtenir les permissions utilisateur actuelles
  app.get("/api/auth/permissions", (req, res) => {
    const user = (req.session as any)?.user;
    if (!user) {
      return res.status(401).json({ message: "Non connecté" });
    }

    const permissions = AuthService.getRolePermissions(user.role);
    const moduleAccess = AuthService.getModuleAccess(user.role);
    const roleHierarchy = AuthService.getRoleHierarchy();

    res.json({
      role: user.role,
      permissions,
      moduleAccess,
      hierarchy: roleHierarchy[user.role] || 0,
      canCreateSensitiveRoles: user.role === "admin"
    });
  });

  // === ROUTES COMMUNES ===
  
  // Vérifier l'utilisateur connecté
  app.get("/api/auth/user", (req, res) => {
    const user = (req.session as any)?.user;
    if (!user) {
      return res.status(401).json({ message: "Non connecté" });
    }
    res.json(user);
  });

  // Déconnexion
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      
      res.clearCookie("connect.sid");
      res.json({ message: "Déconnexion réussie" });
    });
  });

  // Middleware de vérification d'authentification
  app.use("/api/protected", (req, res, next) => {
    const user = (req.session as any)?.user;
    if (!user) {
      return res.status(401).json({ message: "Authentification requise" });
    }
    req.user = user;
    next();
  });

  // Middleware de vérification des permissions admin
  app.use("/api/admin", (req, res, next) => {
    // Ignorer les routes d'auth admin
    if (req.path.startsWith("/auth/")) {
      return next();
    }

    const user = (req.session as any)?.user;
    if (!user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    const adminRoles = ["admin", "hr", "recruiter", "manager"];
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({ 
        message: "Accès non autorisé. Droits administrateur requis." 
      });
    }

    req.user = user;
    next();
  });
}
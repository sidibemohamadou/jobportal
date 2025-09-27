import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User } from "@shared/schema";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class AuthService {
  // Hash un mot de passe
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Vérifie un mot de passe
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Authentification par email/password
  static async authenticateUser(credentials: LoginCredentials): Promise<AuthUser | null> {
    const { email, password } = credentials;
    
    // En développement, utiliser des comptes de test si la DB n'est pas disponible
    if (process.env.NODE_ENV === 'development') {
      const testAccounts = [
        { email: 'admin@test.com', password: 'admin123', role: 'admin', firstName: 'Super', lastName: 'Admin' },
        { email: 'hr@test.com', password: 'hr123', role: 'hr', firstName: 'HR', lastName: 'Manager' },
        { email: 'recruiter@test.com', password: 'recruiter123', role: 'recruiter', firstName: 'John', lastName: 'Recruiter' },
        { email: 'candidate@test.com', password: 'candidate123', role: 'candidate', firstName: 'Jane', lastName: 'Doe' },
      ];
      
      const testUser = testAccounts.find(acc => acc.email === email && acc.password === password);
      if (testUser) {
        return {
          id: `test-${testUser.role}-1`,
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          role: testUser.role
        };
      }
    }
    
    try {
      // Chercher l'utilisateur par email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return null;
      }

      // Vérifier le mot de passe
      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || "candidate"
      };
    } catch (error) {
      console.error("Authentication error:", error);
      return null;
    }
  }

  // Inscription d'un candidat
  static async registerCandidate(credentials: RegisterCredentials): Promise<AuthUser | null> {
    const { email, password, firstName, lastName } = credentials;
    
    // Vérifier si l'email existe déjà
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error("Un compte avec cet email existe déjà");
    }

    // Hasher le mot de passe
    const hashedPassword = await this.hashPassword(password);

    // Créer l'utilisateur
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "candidate",
      profileCompleted: false
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || "candidate"
    };
  }

  // Créer un utilisateur admin (pour le super admin)
  static async createAdminUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
  }): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error("Un compte avec cet email existe déjà");
    }

    // Hasher le mot de passe
    const hashedPassword = await this.hashPassword(userData.password);

    // Créer l'utilisateur admin
    return storage.createUser({
      ...userData,
      password: hashedPassword,
      profileCompleted: true
    });
  }

  // Générer un mot de passe temporaire sécurisé
  static generateTemporaryPassword(): string {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Redirection selon le rôle
  static getRedirectPath(role: string): string {
    switch (role) {
      case "admin":
        return "/admin";
      case "hr":
        return "/hr";
      case "recruiter":
        return "/admin/jobs";
      case "manager":
        return "/admin/dashboard";
      case "employee":
        return "/employee";
      case "candidate":
      default:
        return "/dashboard";
    }
  }

  // Vérifier les permissions selon le rôle
  static hasPermission(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole);
  }

  // Système de permissions RBAC complet avec héritage
  static getRoleHierarchy(): Record<string, number> {
    return {
      candidate: 1,
      employee: 2,
      recruiter: 3,
      manager: 4,
      hr: 5,
      admin: 10 // Super admin avec tous les privilèges
    };
  }

  // Permissions par rôle avec héritage automatique
  static getRolePermissions(role: string): string[] {
    const basePermissions: Record<string, string[]> = {
      candidate: [
        "view_jobs",
        "submit_applications", 
        "view_application_status",
        "view_own_profile",
        "edit_own_profile"
      ],
      employee: [
        "view_profile",
        "submit_requests",
        "view_payslips",
        "view_own_documents",
        "request_time_off",
        "clock_in_out"
      ],
      recruiter: [
        "view_candidates",
        "manage_jobs",
        "view_applications",
        "assign_applications", 
        "score_candidates",
        "conduct_interviews",
        "manage_candidate_pipeline",
        "view_interview_feedback"
      ],
      manager: [
        "view_team",
        "approve_leaves",
        "view_reports",
        "manage_team_performance",
        "conduct_performance_reviews",
        "approve_timesheets",
        "view_team_analytics"
      ],
      hr: [
        "manage_employees",
        "view_all_candidates",
        "manage_contracts",
        "manage_payroll", 
        "manage_leaves",
        "manage_benefits",
        "view_hr_reports",
        "manage_onboarding",
        "manage_employee_documents",
        "manage_training",
        "manage_disciplinary_actions",
        "view_all_applications"
      ],
      admin: [
        "*", // Accès complet pour super admin
        "manage_users",
        "create_sensitive_roles", // Privilège exclusif super admin
        "manage_system_settings",
        "view_audit_logs",
        "manage_integrations",
        "manage_security_settings",
        "backup_restore_data",
        "manage_role_permissions"
      ]
    };

    const hierarchy = this.getRoleHierarchy();
    const currentLevel = hierarchy[role] || 0;
    let permissions: string[] = [];

    // Ajouter les permissions du rôle actuel
    permissions = [...(basePermissions[role] || [])];

    // Héritage des permissions des rôles inférieurs (si pas admin)
    if (role !== "admin") {
      Object.entries(basePermissions).forEach(([r, perms]) => {
        if (hierarchy[r] < currentLevel && r !== "admin") {
          // Exclure certaines permissions spécifiques qui ne doivent pas être héritées
          const inheritablePerms = perms.filter(p => 
            !p.includes("manage_system_") && 
            !p.includes("create_sensitive_") &&
            !p.includes("backup_restore_")
          );
          permissions = [...permissions, ...inheritablePerms];
        }
      });
    }

    // Supprimer les doublons
    return [...new Set(permissions)];
  }

  // Vérifier si un rôle peut créer/modifier un autre rôle
  static canManageRole(currentUserRole: string, targetRole: string): boolean {
    const hierarchy = this.getRoleHierarchy();
    const sensitiveRoles = ["hr", "manager", "recruiter", "admin"];
    
    // Seul le super admin peut créer des rôles sensibles
    if (sensitiveRoles.includes(targetRole) && currentUserRole !== "admin") {
      return false;
    }

    // Vérifier la hiérarchie
    return hierarchy[currentUserRole] > hierarchy[targetRole];
  }

  // Permissions spécialisées pour modules
  static getModuleAccess(role: string): Record<string, boolean> {
    const permissions = this.getRolePermissions(role);
    const hasAll = permissions.includes("*");

    return {
      dashboard: true, // Tous ont accès au dashboard
      candidates: hasAll || permissions.some(p => p.includes("candidate") || p.includes("view_applications")),
      jobs: hasAll || permissions.some(p => p.includes("jobs") || p.includes("manage_jobs")),
      applications: hasAll || permissions.some(p => p.includes("applications")),
      interviews: hasAll || permissions.some(p => p.includes("interview")),
      onboarding: hasAll || permissions.some(p => p.includes("onboarding")),
      employees: hasAll || permissions.some(p => p.includes("manage_employees")),
      contracts: hasAll || permissions.some(p => p.includes("contracts")),
      payroll: hasAll || permissions.some(p => p.includes("payroll")),
      reports: hasAll || permissions.some(p => p.includes("reports") || p.includes("analytics")),
      users: hasAll || permissions.includes("manage_users"),
      settings: hasAll || permissions.some(p => p.includes("settings")),
      hr_management: hasAll || permissions.some(p => p.includes("manage_employees") || p.includes("hr")),
    };
  }
}
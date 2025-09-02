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

  // Permissions par rôle
  static getRolePermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      admin: ["*"], // Accès complet
      hr: [
        "view_candidates",
        "manage_employees", 
        "view_applications",
        "manage_contracts",
        "manage_payroll",
        "manage_leaves"
      ],
      recruiter: [
        "view_candidates",
        "manage_jobs",
        "view_applications", 
        "score_candidates",
        "conduct_interviews"
      ],
      manager: [
        "view_team",
        "approve_leaves",
        "view_reports",
        "manage_team_performance"
      ],
      employee: [
        "view_profile",
        "submit_requests",
        "view_payslips"
      ],
      candidate: [
        "view_jobs",
        "submit_applications",
        "view_application_status"
      ]
    };

    return permissions[role] || [];
  }
}
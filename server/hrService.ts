import {
  Payroll,
  InsertPayroll,
  LeaveRequest,
  InsertLeaveRequest,
  LeaveBalance,
  HrRequest,
  InsertHrRequest,
  Employee
} from "@shared/schema";
import { IStorage } from "./storage";

export class HRService {
  constructor(private storage: IStorage) {}

  /**
   * Calcule et crée une fiche de paie
   */
  async generatePayroll(employeeId: number, period: string, payrollData: {
    baseSalary: number;
    bonuses?: number;
    overtime?: number;
    absenceDays?: number;
    createdBy: string;
  }): Promise<Payroll> {
    try {
      const employee = await this.storage.getEmployee(employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }

      // Calcul des charges sociales (approximation 22%)
      const socialCharges = payrollData.baseSalary * 0.22;
      
      // Calcul des impôts (approximation 20%)
      const taxes = (payrollData.baseSalary + (payrollData.bonuses || 0) + (payrollData.overtime || 0)) * 0.20;
      
      // Déduction pour jours d'absence
      const workingDays = 22; // jours ouvrés moyens par mois
      const absenceDeduction = payrollData.absenceDays ? 
        (payrollData.baseSalary / workingDays) * payrollData.absenceDays : 0;

      // Calcul du salaire net
      const grossSalary = payrollData.baseSalary + (payrollData.bonuses || 0) + (payrollData.overtime || 0);
      const totalDeductions = socialCharges + taxes + absenceDeduction;
      const netSalary = grossSalary - totalDeductions;

      const payroll = await this.storage.createPayroll({
        employeeId,
        period,
        baseSalary: payrollData.baseSalary.toString(),
        bonuses: (payrollData.bonuses || 0).toString(),
        overtime: (payrollData.overtime || 0).toString(),
        deductions: absenceDeduction.toString(),
        socialCharges: socialCharges.toString(),
        taxes: taxes.toString(),
        netSalary: netSalary.toString(),
        workingDays: 22,
        absenceDays: payrollData.absenceDays || 0,
        status: "draft",
        createdBy: payrollData.createdBy
      });

      return payroll;
    } catch (error) {
      throw new Error(`Failed to generate payroll: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Traite une demande de congés
   */
  async processLeaveRequest(employeeId: number, leaveData: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason?: string;
    attachmentPath?: string;
  }): Promise<LeaveRequest> {
    try {
      const employee = await this.storage.getEmployee(employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }

      // Calculer le nombre de jours
      const start = new Date(leaveData.startDate);
      const end = new Date(leaveData.endDate);
      const timeDiff = end.getTime() - start.getTime();
      const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

      // Vérifier le solde de congés si nécessaire
      if (leaveData.leaveType === "vacation") {
        const currentYear = new Date().getFullYear();
        const balances = await this.storage.getLeaveBalance(employeeId, currentYear);
        const vacationBalance = balances.find(b => b.leaveType === "vacation");
        
        if (vacationBalance && vacationBalance.remainingDays < totalDays) {
          throw new Error("Insufficient vacation days balance");
        }
      }

      const leaveRequest = await this.storage.createLeaveRequest({
        employeeId,
        leaveType: leaveData.leaveType,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        totalDays,
        reason: leaveData.reason || null,
        status: "pending",
        attachmentPath: leaveData.attachmentPath || null
      });

      return leaveRequest;
    } catch (error) {
      throw new Error(`Failed to process leave request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Approuve une demande de congés
   */
  async approveLeaveRequest(requestId: number, approvedBy: string): Promise<LeaveRequest> {
    try {
      const request = await this.storage.getLeaveRequest(requestId);
      if (!request) {
        throw new Error("Leave request not found");
      }

      const updatedRequest = await this.storage.updateLeaveRequest(requestId, {
        status: "approved",
        approvedBy,
        approvedAt: new Date()
      });

      // Mettre à jour le solde de congés
      if (request.leaveType === "vacation") {
        const currentYear = new Date().getFullYear();
        await this.storage.updateLeaveBalance(
          request.employeeId,
          currentYear,
          request.leaveType,
          request.totalDays
        );
      }

      return updatedRequest;
    } catch (error) {
      throw new Error(`Failed to approve leave request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refuse une demande de congés
   */
  async rejectLeaveRequest(requestId: number, approvedBy: string, reason: string): Promise<LeaveRequest> {
    try {
      const request = await this.storage.getLeaveRequest(requestId);
      if (!request) {
        throw new Error("Leave request not found");
      }

      const updatedRequest = await this.storage.updateLeaveRequest(requestId, {
        status: "rejected",
        approvedBy,
        approvedAt: new Date(),
        rejectionReason: reason
      });

      return updatedRequest;
    } catch (error) {
      throw new Error(`Failed to reject leave request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Crée une demande interne RH
   */
  async createHrRequest(employeeId: number, requestData: {
    requestType: string;
    title: string;
    description: string;
    priority?: string;
    attachmentPath?: string;
  }): Promise<HrRequest> {
    try {
      const employee = await this.storage.getEmployee(employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }

      const hrRequest = await this.storage.createHrRequest({
        employeeId,
        requestType: requestData.requestType,
        title: requestData.title,
        description: requestData.description,
        priority: requestData.priority || "normal",
        status: "pending",
        attachmentPath: requestData.attachmentPath || null
      });

      return hrRequest;
    } catch (error) {
      throw new Error(`Failed to create HR request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assigne une demande RH à un responsable
   */
  async assignHrRequest(requestId: number, assignedTo: string): Promise<HrRequest> {
    try {
      const request = await this.storage.getHrRequest(requestId);
      if (!request) {
        throw new Error("HR request not found");
      }

      const updatedRequest = await this.storage.updateHrRequest(requestId, {
        assignedTo,
        status: "in_progress"
      });

      return updatedRequest;
    } catch (error) {
      throw new Error(`Failed to assign HR request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ferme une demande RH
   */
  async completeHrRequest(requestId: number, responseNotes: string): Promise<HrRequest> {
    try {
      const request = await this.storage.getHrRequest(requestId);
      if (!request) {
        throw new Error("HR request not found");
      }

      const updatedRequest = await this.storage.updateHrRequest(requestId, {
        status: "completed",
        responseNotes,
        completedAt: new Date()
      });

      return updatedRequest;
    } catch (error) {
      throw new Error(`Failed to complete HR request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Récupère les indicateurs RH
   */
  async getHRMetrics(): Promise<{
    totalEmployees: number;
    activeContracts: number;
    pendingLeaveRequests: number;
    pendingHrRequests: number;
    payrollToPrepare: number;
    upcomingLeaves: number;
  }> {
    try {
      const employees = await this.storage.getAllEmployees();
      const activeEmployees = employees.filter(e => e.status === "active");
      
      const allLeaveRequests = await Promise.all(
        employees.map(e => this.storage.getLeaveRequestsByEmployee(e.id))
      );
      const pendingLeaves = allLeaveRequests.flat().filter(r => r.status === "pending");
      
      const upcomingLeaves = allLeaveRequests.flat().filter(r => {
        if (r.status !== "approved") return false;
        const startDate = new Date(r.startDate);
        const today = new Date();
        const daysDiff = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7 && daysDiff >= 0;
      });

      const allHrRequests = await this.storage.getAllHrRequests();
      const pendingHrRequests = allHrRequests.filter(r => r.status === "pending");

      // Estimation des fiches de paie à préparer (mois courant)
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const payrollPromises = employees.map(e => this.storage.getPayrollByEmployee(e.id, currentMonth));
      const existingPayrolls = await Promise.all(payrollPromises);
      const employeesWithoutPayroll = existingPayrolls.filter(p => p.length === 0).length;

      return {
        totalEmployees: employees.length,
        activeContracts: activeEmployees.length,
        pendingLeaveRequests: pendingLeaves.length,
        pendingHrRequests: pendingHrRequests.length,
        payrollToPrepare: employeesWithoutPayroll,
        upcomingLeaves: upcomingLeaves.length
      };
    } catch (error) {
      throw new Error(`Failed to get HR metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialise les soldes de congés pour un nouvel employé
   */
  async initializeLeaveBalances(employeeId: number, year: number): Promise<void> {
    try {
      const leaveTypes = [
        { type: "vacation", days: 25 },
        { type: "sick", days: 90 }, // congés maladie
        { type: "personal", days: 5 },
        { type: "maternity", days: 112 }, // congé maternité
        { type: "paternity", days: 25 }   // congé paternité
      ];

      for (const leave of leaveTypes) {
        // Vérifier si le solde existe déjà
        const existing = await this.storage.getLeaveBalance(employeeId, year);
        const alreadyExists = existing.some(b => b.leaveType === leave.type);
        
        if (!alreadyExists) {
          // Créer le solde initial (implémentation dépendant de votre storage)
          // Note: Cette méthode doit être implémentée dans le storage
          await this.storage.updateLeaveBalance(employeeId, year, leave.type, 0);
        }
      }
    } catch (error) {
      throw new Error(`Failed to initialize leave balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
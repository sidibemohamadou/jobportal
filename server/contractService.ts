import { 
  Contract, 
  InsertContract, 
  Employee, 
  Application,
  ContractAmendment,
  InsertAmendment 
} from "@shared/schema";
import { IStorage } from "./storage";

export class ContractService {
  constructor(private storage: IStorage) {}

  /**
   * Génère automatiquement un contrat quand un candidat est accepté
   */
  async generateContractFromApplication(applicationId: number, contractData: {
    contractType: string;
    startDate: string;
    baseSalary: number;
    workingHours?: number;
    vacationDays?: number;
  }): Promise<Contract> {
    try {
      // Récupérer la candidature
      const application = await this.storage.getApplication(applicationId);
      if (!application) {
        throw new Error("Application not found");
      }

      // Récupérer l'utilisateur candidat
      const user = await this.storage.getUser(application.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Créer l'employé si il n'existe pas déjà
      let employee = await this.storage.getEmployeeByUserId(application.userId);
      
      if (!employee) {
        const job = await this.storage.getJob(application.jobId);
        if (!job) {
          throw new Error("Job not found");
        }

        // Générer un numéro d'employé unique
        const employeeNumber = `EMP${Date.now()}`;

        employee = await this.storage.createEmployee({
          userId: application.userId,
          employeeNumber,
          position: job.title,
          department: "Non défini",
          startDate: contractData.startDate,
          status: "active"
        });
      }

      // Calculer la période d'essai (3 mois par défaut)
      const startDate = new Date(contractData.startDate);
      const trialPeriodEnd = new Date(startDate);
      trialPeriodEnd.setMonth(trialPeriodEnd.getMonth() + 3);

      // Créer le contrat
      const contract = await this.storage.createContract({
        employeeId: employee.id,
        applicationId: applicationId,
        contractType: contractData.contractType,
        startDate: contractData.startDate,
        endDate: contractData.contractType === "CDD" ? undefined : null, // À définir pour les CDD
        trialPeriodEnd: trialPeriodEnd.toISOString().split('T')[0],
        baseSalary: contractData.baseSalary.toString(),
        currency: "EUR",
        workingHours: contractData.workingHours || 35,
        vacationDays: contractData.vacationDays || 25,
        signatureStatus: "pending",
        status: "draft"
      });

      // Mettre à jour le statut de la candidature
      await this.storage.updateApplication(applicationId, {
        status: "contract_generated"
      });

      return contract;
    } catch (error) {
      throw new Error(`Failed to generate contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Crée un avenant au contrat
   */
  async createAmendment(contractId: number, amendmentData: {
    amendmentType: string;
    description: string;
    effectiveDate: string;
    previousValue?: string;
    newValue: string;
    createdBy: string;
  }): Promise<ContractAmendment> {
    try {
      const contract = await this.storage.getContract(contractId);
      if (!contract) {
        throw new Error("Contract not found");
      }

      const amendment = await this.storage.createAmendment({
        contractId,
        amendmentType: amendmentData.amendmentType,
        description: amendmentData.description,
        effectiveDate: amendmentData.effectiveDate,
        previousValue: amendmentData.previousValue || null,
        newValue: amendmentData.newValue,
        signatureStatus: "pending",
        createdBy: amendmentData.createdBy
      });

      return amendment;
    } catch (error) {
      throw new Error(`Failed to create amendment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Valide et active un contrat signé
   */
  async activateContract(contractId: number): Promise<Contract> {
    try {
      const contract = await this.storage.getContract(contractId);
      if (!contract) {
        throw new Error("Contract not found");
      }

      if (contract.signatureStatus !== "signed") {
        throw new Error("Contract must be signed before activation");
      }

      const updatedContract = await this.storage.updateContract(contractId, {
        status: "active",
        signedAt: new Date()
      });

      return updatedContract;
    } catch (error) {
      throw new Error(`Failed to activate contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Termine un contrat
   */
  async terminateContract(contractId: number, endDate: string, reason?: string): Promise<Contract> {
    try {
      const contract = await this.storage.getContract(contractId);
      if (!contract) {
        throw new Error("Contract not found");
      }

      const updatedContract = await this.storage.updateContract(contractId, {
        status: "terminated",
        endDate,
        notes: reason ? `${contract.notes || ''}\nTermination reason: ${reason}` : contract.notes
      });

      // Mettre à jour le statut de l'employé
      const employee = await this.storage.getEmployee(contract.employeeId);
      if (employee) {
        await this.storage.updateEmployee(contract.employeeId, {
          status: "inactive",
          endDate
        });
      }

      return updatedContract;
    } catch (error) {
      throw new Error(`Failed to terminate contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Récupère les contrats en attente de signature
   */
  async getPendingContracts(): Promise<Contract[]> {
    try {
      const allContracts = await this.storage.getActiveContracts();
      return allContracts.filter(contract => 
        contract.signatureStatus === "pending" && 
        contract.status === "draft"
      );
    } catch (error) {
      throw new Error(`Failed to get pending contracts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Récupère les contrats expirant bientôt
   */
  async getExpiringContracts(daysAhead: number = 30): Promise<Contract[]> {
    try {
      const allContracts = await this.storage.getActiveContracts();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      return allContracts.filter(contract => {
        if (!contract.endDate || contract.status !== "active") return false;
        
        const endDate = new Date(contract.endDate);
        return endDate <= futureDate && endDate > new Date();
      });
    } catch (error) {
      throw new Error(`Failed to get expiring contracts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
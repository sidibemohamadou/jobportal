import { storage } from "./storage";

export interface CandidateScore {
  applicationId: number;
  candidate: any;
  job: any;
  autoScore: number;
  manualScore?: number;
  totalScore: number;
  factors: {
    experienceMatch: number;
    skillsMatch: number;
    availabilityScore: number;
    salaryFit: number;
    applicationQuality: number;
  };
}

export class RecruitmentService {
  /**
   * Calcule le score automatique d'un candidat basé sur plusieurs critères
   */
  calculateAutoScore(application: any, job: any): { score: number, factors: any } {
    let totalScore = 0;
    const factors = {
      experienceMatch: 0,
      skillsMatch: 0,
      availabilityScore: 0,
      salaryFit: 0,
      applicationQuality: 0
    };

    // 1. Correspondance d'expérience (25 points max)
    if (job.experienceLevel && application.experienceLevel) {
      const experienceMapping = { 'Débutant': 1, 'Intermédiaire': 2, 'Senior': 3 };
      const jobExp = experienceMapping[job.experienceLevel] || 2;
      const candidateExp = experienceMapping[application.experienceLevel] || 2;
      
      if (candidateExp >= jobExp) {
        factors.experienceMatch = 25;
      } else if (candidateExp === jobExp - 1) {
        factors.experienceMatch = 15;
      } else {
        factors.experienceMatch = 5;
      }
    } else {
      factors.experienceMatch = 10; // Score neutre si pas d'info
    }

    // 2. Correspondance des compétences (30 points max)
    if (job.skills && job.skills.length > 0 && application.skills) {
      const jobSkills = job.skills.map((s: string) => s.toLowerCase());
      const candidateSkills = application.skills.map((s: string) => s.toLowerCase());
      
      const matchingSkills = jobSkills.filter((skill: string) => 
        candidateSkills.some((cs: string) => cs.includes(skill) || skill.includes(cs))
      );
      
      const skillsMatchRatio = matchingSkills.length / jobSkills.length;
      factors.skillsMatch = Math.round(skillsMatchRatio * 30);
    } else {
      factors.skillsMatch = 15; // Score neutre
    }

    // 3. Disponibilité (15 points max)
    if (application.availabilityDate) {
      const availDate = new Date(application.availabilityDate);
      const now = new Date();
      const daysDiff = Math.ceil((availDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 0) {
        factors.availabilityScore = 15; // Disponible immédiatement
      } else if (daysDiff <= 30) {
        factors.availabilityScore = 12; // Dans le mois
      } else if (daysDiff <= 60) {
        factors.availabilityScore = 8; // Dans les 2 mois
      } else {
        factors.availabilityScore = 3; // Plus tard
      }
    } else {
      factors.availabilityScore = 12; // Assume disponible bientôt
    }

    // 4. Adéquation salariale (15 points max)
    if (application.salaryExpectation && job.salary) {
      // Parse des fourchettes de salaire (format: "40k - 55k €")
      const parseSalary = (salaryStr: string): number => {
        const match = salaryStr.match(/(\d+)k/);
        return match ? parseInt(match[1]) * 1000 : 0;
      };

      const candidateSalary = parseSalary(application.salaryExpectation);
      const jobSalaryMatch = job.salary.match(/(\d+)k\s*-\s*(\d+)k/);
      
      if (jobSalaryMatch) {
        const jobMinSalary = parseInt(jobSalaryMatch[1]) * 1000;
        const jobMaxSalary = parseInt(jobSalaryMatch[2]) * 1000;
        
        if (candidateSalary >= jobMinSalary && candidateSalary <= jobMaxSalary) {
          factors.salaryFit = 15; // Parfait match
        } else if (candidateSalary <= jobMaxSalary * 1.1) {
          factors.salaryFit = 10; // Proche
        } else {
          factors.salaryFit = 3; // Trop élevé
        }
      } else {
        factors.salaryFit = 8; // Score neutre
      }
    } else {
      factors.salaryFit = 10; // Score neutre si pas d'info
    }

    // 5. Qualité de la candidature (15 points max)
    let qualityScore = 0;
    if (application.coverLetter && application.coverLetter.length > 100) {
      qualityScore += 5; // Lettre de motivation détaillée
    }
    if (application.cvPath) {
      qualityScore += 5; // CV fourni
    }
    if (application.motivationLetterPath) {
      qualityScore += 3; // Lettre de motivation en fichier
    }
    if (application.phone) {
      qualityScore += 2; // Contact fourni
    }
    factors.applicationQuality = Math.min(qualityScore, 15);

    // Score total (sur 100)
    totalScore = factors.experienceMatch + factors.skillsMatch + 
                factors.availabilityScore + factors.salaryFit + factors.applicationQuality;

    return { score: Math.min(totalScore, 100), factors };
  }

  /**
   * Obtient le Top 10 des candidats pour une offre donnée
   */
  async getTopCandidates(jobId: number, limit: number = 10): Promise<CandidateScore[]> {
    const applications = await storage.getApplicationsForJob(jobId);
    const job = await storage.getJob(jobId);
    
    if (!job) {
      throw new Error("Job not found");
    }

    const scoredCandidates: CandidateScore[] = [];

    for (const application of applications) {
      const candidate = await storage.getUser(application.userId);
      const { score, factors } = this.calculateAutoScore(application, job);
      
      // Mise à jour du score automatique dans la BD
      await storage.updateApplication(application.id, { autoScore: score });

      const totalScore = application.manualScore 
        ? Math.round((score * 0.6) + (application.manualScore * 0.4)) // 60% auto, 40% manuel
        : score;

      scoredCandidates.push({
        applicationId: application.id,
        candidate,
        job,
        autoScore: score,
        manualScore: application.manualScore,
        totalScore,
        factors
      });
    }

    // Tri par score décroissant
    return scoredCandidates
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  }

  /**
   * Affecte des candidats à un recruteur
   */
  async assignCandidatesToRecruiter(applicationIds: number[], recruiterId: string): Promise<void> {
    for (const appId of applicationIds) {
      await storage.updateApplication(appId, { 
        assignedRecruiter: recruiterId,
        status: 'assigned'
      });
    }
  }

  /**
   * Met à jour la note manuelle d'un candidat
   */
  async updateManualScore(applicationId: number, score: number, notes?: string): Promise<void> {
    await storage.updateApplication(applicationId, { 
      manualScore: score,
      scoreNotes: notes,
      status: 'scored'
    });
  }

  /**
   * Obtient les candidatures assignées à un recruteur
   */
  async getAssignedApplications(recruiterId: string): Promise<any[]> {
    const applications = await storage.getApplicationsByRecruiter(recruiterId);
    
    const enrichedApps = [];
    for (const app of applications) {
      const candidate = await storage.getUser(app.userId);
      const job = await storage.getJob(app.jobId);
      enrichedApps.push({ ...app, candidate, job });
    }
    
    return enrichedApps;
  }

  /**
   * Obtient le Top 3 final après notation manuelle
   */
  async getFinalTop3(jobId: number): Promise<CandidateScore[]> {
    const topCandidates = await this.getTopCandidates(jobId, 100);
    
    // Filtre seulement ceux qui ont une note manuelle
    const scoredCandidates = topCandidates.filter(c => c.manualScore !== undefined);
    
    return scoredCandidates
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);
  }
}

export const recruitmentService = new RecruitmentService();
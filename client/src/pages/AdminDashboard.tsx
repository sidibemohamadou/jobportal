import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  LogOut,
  Plus,
  BarChart3,
  PieChart,
  Target,
  Award,
  Activity,
  Clock,
  CheckCircle,
  X,
  Trash2,
  UserCheck,
  Building,
  ArrowRight,
  Mail,
  UserPlus,
  Shield,
  Edit,
  Phone
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar
} from "recharts";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [skills, setSkills] = useState<string[]>(['']);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [salary, setSalary] = useState('');
  const [contractType, setContractType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/admin/jobs"],
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["/api/admin/applications"],
  });
  
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["/api/admin/kpis"],
  });
  
  const { data: applicationAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics/applications"],
  });
  
  const { data: jobAnalytics, isLoading: jobAnalyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics/jobs"],
  });

  // Mutation pour créer un nouvel emploi
  const createJobMutation = useMutation({
    mutationFn: async (jobData: {
      title: string;
      company: string;
      location: string;
      description: string;
      requirements?: string;
      salary?: string;
      contractType: string;
      experienceLevel?: string;
      skills?: string[];
    }) => {
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobData,
          isActive: true
        })
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Erreur lors de la création de l\'offre');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      resetForm();
      toast({
        title: "Succès",
        description: "L'offre d'emploi a été créée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const addSkill = () => {
    setSkills([...skills, '']);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  const resetForm = () => {
    setJobTitle('');
    setCompany('');
    setLocation('');
    setDescription('');
    setRequirements('');
    setSalary('');
    setContractType('');
    setExperienceLevel('');
    setSkills(['']);
  };

  const previewJob = () => ({
    title: jobTitle,
    company: company,
    location: location,
    description: description,
    requirements: requirements,
    salary: salary,
    contractType: contractType,
    experienceLevel: experienceLevel,
    skills: skills.filter(skill => skill.trim() !== '')
  });

  const handleCreateJob = () => {
    // Validation des champs requis
    if (!jobTitle.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le titre du poste est obligatoire",
        variant: "destructive",
      });
      return;
    }
    if (!company.trim()) {
      toast({
        title: "Erreur de validation", 
        description: "Le nom de l'entreprise est obligatoire",
        variant: "destructive",
      });
      return;
    }
    if (!location.trim()) {
      toast({
        title: "Erreur de validation",
        description: "La localisation est obligatoire",
        variant: "destructive",
      });
      return;
    }
    if (!description.trim()) {
      toast({
        title: "Erreur de validation",
        description: "La description est obligatoire",
        variant: "destructive",
      });
      return;
    }
    if (!contractType) {
      toast({
        title: "Erreur de validation",
        description: "Le type de contrat est obligatoire",
        variant: "destructive",
      });
      return;
    }

    const jobData = previewJob();
    createJobMutation.mutate(jobData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Admin RH</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </span>
              <Badge variant="secondary">
                {(user as any)?.role === "admin" ? "Super Admin" : 
                 (user as any)?.role === "hr" ? "RH" : "Recruteur"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Créer une offre
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gestion
            </TabsTrigger>
            {(user as any)?.role === "admin" && (
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Profil Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Vue d'ensemble</h2>
              <div className="flex space-x-2">
                <Link to="/admin/applications">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Candidatures
                  </Button>
                </Link>
                <Link to="/admin/jobs">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle offre
                  </Button>
                </Link>
              </div>
            </div>

            {/* KPIs Cards */}
            {kpisLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-muted rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Candidatures</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{applications.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Taux conversion: {applications.length > 0 ? ((applications.filter((a: any) => a.status === 'accepted').length / applications.length) * 100).toFixed(1) : 0}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Offres Actives</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{jobs.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {new Set(applications.map((a: any) => a.userId)).size} candidats inscrits
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">5</div>
                    <p className="text-xs text-muted-foreground">
                      jours de traitement
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Équipe RH</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">
                      recruteurs actifs
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Candidatures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{applications.filter((a: any) => a.status === 'pending').length}</div>
                    <div className="text-sm text-muted-foreground">En attente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{applications.filter((a: any) => a.status === 'assigned').length}</div>
                    <div className="text-sm text-muted-foreground">Assignées</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{applications.filter((a: any) => a.status === 'scored').length}</div>
                    <div className="text-sm text-muted-foreground">Notées</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{applications.filter((a: any) => a.status === 'reviewed').length}</div>
                    <div className="text-sm text-muted-foreground">Examinées</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{applications.filter((a: any) => a.status === 'interview').length}</div>
                    <div className="text-sm text-muted-foreground">Entretiens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{applications.filter((a: any) => a.status === 'accepted').length}</div>
                    <div className="text-sm text-muted-foreground">Acceptées</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{applications.filter((a: any) => a.status === 'rejected').length}</div>
                    <div className="text-sm text-muted-foreground">Refusées</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Offres les plus populaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.slice(0, 3).map((job: any, index: number) => {
                    const jobApplications = applications.filter((a: any) => a.jobId === job.id);
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                        </div>
                        <Badge variant="secondary">{jobApplications.length} candidatures</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analyses et Graphiques</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Applications */}
              {applicationAnalytics?.monthlyApplications && (
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution des Candidatures</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={applicationAnalytics.monthlyApplications}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#3B82F6" 
                          fill="#3B82F6" 
                          fillOpacity={0.3} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Status Distribution Pie */}
              {applicationAnalytics?.statusDistribution && (
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par Statut</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={applicationAnalytics.statusDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {applicationAnalytics.statusDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Job Popularity */}
              {jobAnalytics?.jobPopularity && (
                <Card>
                  <CardHeader>
                    <CardTitle>Popularité des Offres</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={jobAnalytics.jobPopularity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="applications" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Score Distribution */}
              {applicationAnalytics?.scoreDistribution && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution des Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={applicationAnalytics.scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <h2 className="text-2xl font-bold">Créer une nouvelle offre</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Formulaire Dynamique</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="jobTitle">Titre du poste *</Label>
                    <Input 
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Ex: Développeur Full Stack"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">Entreprise *</Label>
                    <Input 
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ex: TechCorp"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Localisation *</Label>
                    <Input 
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ex: Paris, France"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contractType">Type de contrat</Label>
                      <Select value={contractType} onValueChange={setContractType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="CDD">CDD</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                          <SelectItem value="Stage">Stage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="experienceLevel">Niveau d'expérience</Label>
                      <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Débutant">Débutant</SelectItem>
                          <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                          <SelectItem value="Senior">Senior</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="salary">Salaire</Label>
                    <Input 
                      id="salary"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="Ex: 45k - 60k €"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea 
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez le poste, les missions..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="requirements">Exigences</Label>
                    <Textarea 
                      id="requirements"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="Formation, expérience requise..."
                      rows={3}
                    />
                  </div>

                  {/* Dynamic Skills */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Compétences requises</Label>
                      <Button type="button" onClick={addSkill} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {skills.map((skill, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={skill}
                            onChange={(e) => updateSkill(index, e.target.value)}
                            placeholder="Ex: React, Node.js, SQL..."
                          />
                          {skills.length > 1 && (
                            <Button 
                              type="button" 
                              onClick={() => removeSkill(index)}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={resetForm}>
                      <X className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                    <Button 
                      onClick={handleCreateJob}
                      disabled={createJobMutation.isPending}
                      data-testid="button-create-job"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {createJobMutation.isPending ? 'Création...' : 'Créer l\'offre'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Aperçu en temps réel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 p-6 bg-muted/30 rounded-lg">
                    <div>
                      <h3 className="text-xl font-bold text-primary">
                        {jobTitle || "Titre du poste"}
                      </h3>
                      <p className="text-lg text-muted-foreground">
                        {company || "Nom de l'entreprise"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        📍 {location || "Localisation"}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {contractType && (
                        <Badge variant="secondary">{contractType}</Badge>
                      )}
                      {experienceLevel && (
                        <Badge variant="outline">{experienceLevel}</Badge>
                      )}
                      {salary && (
                        <Badge variant="default">💰 {salary}</Badge>
                      )}
                    </div>

                    {description && (
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-sm">{description}</p>
                      </div>
                    )}

                    {requirements && (
                      <div>
                        <h4 className="font-semibold mb-2">Exigences</h4>
                        <p className="text-sm">{requirements}</p>
                      </div>
                    )}

                    {skills.filter(skill => skill.trim() !== '').length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Compétences</h4>
                        <div className="flex gap-2 flex-wrap">
                          {skills.filter(skill => skill.trim() !== '').map((skill, index) => (
                            <Badge key={index} variant="outline">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <h2 className="text-2xl font-bold">Gestion</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link to="/admin/applications">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Candidatures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Gérer toutes les candidatures reçues
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/admin/jobs">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Offres d'emploi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Consulter et modifier les offres
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/admin/onboarding">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Onboarding
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Gérer l'intégration des nouveaux employés
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/admin/interviews">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Entretiens
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Évaluation et gestion des entretiens
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/admin/employees">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Gestion RH
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Performance, formations et disciplines
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/admin/invitations">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Invitations Candidats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Inviter des candidats présélectionnés
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {(user as any)?.role === "admin" && (
                <Link to="/admin/users">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Utilisateurs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Gestion des comptes utilisateurs
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          </TabsContent>

          {/* Profile Admin Tab - User Management */}
          {(user as any)?.role === "admin" && (
            <TabsContent value="profile" className="space-y-6">
              <AdminProfileManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

// Component for Admin Profile with User Management
function AdminProfileManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('overview');
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profil Administrateur</h2>
        <p className="text-muted-foreground">
          Gestion du profil et des utilisateurs - Accès Super Administrateur
        </p>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Gestion Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Paramètres Système
          </TabsTrigger>
        </TabsList>

        {/* Overview Section */}
        <TabsContent value="overview" className="space-y-6">
          <AdminOverview />
        </TabsContent>

        {/* User Management Section */}
        <TabsContent value="users" className="space-y-6">
          <UserManagementInterface />
        </TabsContent>

        {/* System Settings Section */}
        <TabsContent value="settings" className="space-y-6">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Admin Overview Component
function AdminOverview() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: permissions } = useQuery({
    queryKey: ["/api/auth/permissions"],
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4">Loading...</div>;
  }

  const roleStats = users.reduce((acc: any, user: any) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informations Super Administrateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Permissions Actuelles</h4>
              <div className="flex flex-wrap gap-1">
                {permissions?.permissions?.slice(0, 8)?.map((permission: string) => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission === "*" ? "Accès Complet" : permission.replace(/_/g, " ")}
                  </Badge>
                ))}
                {permissions?.permissions?.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{permissions.permissions.length - 8} autres
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Accès Modules</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(permissions?.moduleAccess || {})
                  .filter(([_, hasAccess]) => hasAccess)
                  .slice(0, 6)
                  .map(([module]) => (
                    <div key={module} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {module.replace(/_/g, " ").toUpperCase()}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Utilisateurs</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Super Admins</p>
                <p className="text-2xl font-bold">{roleStats.admin || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium">Équipe RH</p>
              <p className="text-2xl font-bold">{(roleStats.hr || 0) + (roleStats.recruiter || 0) + (roleStats.manager || 0)}</p>
              <p className="text-xs text-muted-foreground">
                HR: {roleStats.hr || 0} | Recruiter: {roleStats.recruiter || 0} | Manager: {roleStats.manager || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium">Candidats & Employés</p>
              <p className="text-2xl font-bold">{(roleStats.candidate || 0) + (roleStats.employee || 0)}</p>
              <p className="text-xs text-muted-foreground">
                Candidats: {roleStats.candidate || 0} | Employés: {roleStats.employee || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// User Management Interface Component
function UserManagementInterface() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/users", roleFilter === "all" ? null : roleFilter],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Erreur lors de la création');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Utilisateur créé",
        description: "Le nouvel utilisateur a été créé avec succès",
      });
      setShowCreateForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Gestion des Utilisateurs</h3>
          <p className="text-muted-foreground">
            Créer et gérer les comptes utilisateurs avec contrôle RBAC
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Créer Utilisateur
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="admin">Super Admins</SelectItem>
              <SelectItem value="hr">RH</SelectItem>
              <SelectItem value="manager">Managers</SelectItem>
              <SelectItem value="recruiter">Recruteurs</SelectItem>
              <SelectItem value="employee">Employés</SelectItem>
              <SelectItem value="candidate">Candidats</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* User Creation Form */}
      {showCreateForm && (
        <CreateUserForm 
          onSubmit={(data) => createUserMutation.mutate(data)}
          onCancel={() => setShowCreateForm(false)}
          isLoading={createUserMutation.isPending}
        />
      )}

      {/* Users Table */}
      <EnhancedUsersTable 
        users={users}
        isLoading={isLoading}
        onEdit={setEditingUser}
        onRefetch={refetch}
      />
    </div>
  );
}

// Create User Form Component
function CreateUserForm({ onSubmit, onCancel, isLoading }: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'candidate'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Créer un Nouvel Utilisateur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Mot de passe temporaire *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Minimum 8 caractères"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="role">Rôle *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="candidate">Candidat</SelectItem>
                <SelectItem value="employee">Employé</SelectItem>
                <SelectItem value="recruiter">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-orange-500" />
                    Recruteur (Rôle Sensible)
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-blue-500" />
                    Manager (Rôle Sensible)
                  </div>
                </SelectItem>
                <SelectItem value="hr">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-purple-500" />
                    RH (Rôle Sensible)
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-red-500" />
                    Super Admin (Rôle Sensible)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer Utilisateur'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Enhanced Users Table Component
function EnhancedUsersTable({ users, isLoading, onEdit, onRefetch }: {
  users: any[];
  isLoading: boolean;
  onEdit: (user: any) => void;
  onRefetch: () => void;
}) {
  const { toast } = useToast();

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès",
      });
      onRefetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  });

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: any; label: string; icon: JSX.Element }> = {
      admin: { variant: "destructive", label: "Super Admin", icon: <Shield className="w-3 h-3" /> },
      hr: { variant: "default", label: "RH", icon: <Users className="w-3 h-3" /> },
      manager: { variant: "secondary", label: "Manager", icon: <Target className="w-3 h-3" /> },
      recruiter: { variant: "secondary", label: "Recruteur", icon: <UserPlus className="w-3 h-3" /> },
      employee: { variant: "outline", label: "Employé", icon: <Building className="w-3 h-3" /> },
      candidate: { variant: "outline", label: "Candidat", icon: <Mail className="w-3 h-3" /> },
    };
    
    const config = variants[role] || variants.candidate;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded"></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilisateurs ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Utilisateur</th>
                <th className="text-left p-2">Contact</th>
                <th className="text-left p-2">Rôle</th>
                <th className="text-left p-2">Permissions</th>
                <th className="text-left p-2">Créé</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <div className="flex items-center space-x-3">
                      {user.profileImageUrl && (
                        <img
                          src={user.profileImageUrl}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="w-3 h-3" />
                        {user.email || "Non défini"}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-2">{getRoleBadge(user.role || "candidate")}</td>
                  <td className="p-2">
                    <div className="text-xs">
                      {user.permissions?.slice(0, 2)?.map((perm: string) => (
                        <Badge key={perm} variant="outline" className="text-xs mr-1 mb-1">
                          {perm === "*" ? "ALL" : perm.split("_")[0]}
                        </Badge>
                      ))}
                      {user.permissions?.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.permissions.length - 2}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString("fr-FR")
                      : "Non défini"
                    }
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(user)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Supprimer ${user.firstName} ${user.lastName} ?`)) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// System Settings Component
function SystemSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Paramètres Syst��me
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Sécurité RBAC</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Système de contrôle d'accès basé sur les rôles activé
              </p>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Contrôles de rôles sensibles actifs</span>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Permissions Héritées</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Les rôles héritent automatiquement des permissions inférieures
              </p>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Hiérarchie des permissions activée</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Restrictions Super Admin</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Seuls les super admins peuvent créer des rôles sensibles
              </p>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Sécurité rôles sensibles activée</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
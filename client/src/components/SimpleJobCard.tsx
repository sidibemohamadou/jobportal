import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar } from "lucide-react";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  contractType: string;
  experienceLevel?: string;
  skills?: string[];
  salary?: string;
  createdAt: string;
}

interface SimpleJobCardProps {
  job: Job;
  onApply?: (job: Job) => void;
}

export function SimpleJobCard({ job, onApply }: SimpleJobCardProps) {
  const handleApply = () => {
    if (onApply) {
      onApply(job);
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200" data-testid={`job-card-${job.id}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" data-testid={`job-title-${job.id}`}>
              {job.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(job.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          <Badge variant="secondary" data-testid={`contract-type-${job.id}`}>
            {job.contractType}
          </Badge>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3" data-testid={`job-description-${job.id}`}>
          {job.description}
        </p>

        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {job.skills.map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {job.experienceLevel && <span>Niveau: {job.experienceLevel}</span>}
            {job.salary && <span className="ml-4">Salaire: {job.salary}</span>}
          </div>
          <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700" data-testid={`apply-button-${job.id}`}>
            Postuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
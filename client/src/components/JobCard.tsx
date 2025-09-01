import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS, pt } from "date-fns/locale";
import { getLanguage, t } from "@/lib/i18n";
import type { Job } from "@shared/schema";

interface JobCardProps {
  job: Job;
  onApply: (job: Job) => void;
}

const locales = {
  fr: fr,
  en: enUS,
  pt: pt,
};

export function JobCard({ job, onApply }: JobCardProps) {
  const currentLang = getLanguage();
  const locale = locales[currentLang];

  const getContractTypeColor = (contractType: string) => {
    switch (contractType) {
      case 'CDI':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'CDD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'Freelance':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      data-testid={`card-job-${job.id}`}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 
              className="text-lg font-semibold text-foreground mb-2"
              data-testid={`text-job-title-${job.id}`}
            >
              {job.title}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                <span data-testid={`text-company-${job.id}`}>{job.company}</span>
              </span>
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span data-testid={`text-location-${job.id}`}>{job.location}</span>
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span data-testid={`text-date-${job.id}`}>
                  {job.createdAt ? formatDistanceToNow(job.createdAt, { addSuffix: true, locale }) : t('common.unknown')}
                </span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              className={getContractTypeColor(job.contractType)}
              data-testid={`badge-contract-${job.id}`}
            >
              {job.contractType}
            </Badge>
          </div>
        </div>
        
        <p 
          className="text-muted-foreground mb-4 line-clamp-3"
          data-testid={`text-description-${job.id}`}
        >
          {job.description}
        </p>
        
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {job.skills.map((skill, index) => (
              <Badge 
                key={index}
                variant="secondary"
                className="text-xs"
                data-testid={`badge-skill-${job.id}-${index}`}
              >
                {skill}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span 
            className="text-sm text-muted-foreground"
            data-testid={`text-experience-${job.id}`}
          >
            {job.experienceLevel && `${job.experienceLevel} d'expérience`}
          </span>
          <Button 
            onClick={() => onApply(job)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid={`button-apply-${job.id}`}
          >
            {t('apply_button')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

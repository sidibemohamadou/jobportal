import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Trophy, 
  Star, 
  Zap, 
  Plane, 
  MessageSquare, 
  Shield,
  Award,
  ArrowLeft,
  Calendar,
  Target
} from "lucide-react";

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  isActive: boolean;
}

interface UserAchievement {
  id: number;
  userId: string;
  achievementId: number;
  candidateOnboardingId?: number;
  earnedAt: string;
  achievement: Achievement;
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch all available achievements
  const { data: allAchievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/onboarding/achievements"],
    enabled: !!user?.id,
  });

  // Fetch user's earned achievements
  const { data: userAchievements = [], isLoading: userAchievementsLoading } = useQuery({
    queryKey: ["/api/onboarding/user-achievements"],
    enabled: !!user?.id,
  });

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Star,
      Zap,
      Plane,
      MessageSquare,
      Shield,
      Award,
      Trophy,
      Target
    };
    return iconMap[iconName] || Star;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'milestone': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'speed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'quality': return 'bg-green-100 text-green-800 border-green-200';
      case 'engagement': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'milestone': return 'Étapes Clés';
      case 'speed': return 'Rapidité';
      case 'quality': return 'Qualité';
      case 'engagement': return 'Engagement';
      default: return 'Autre';
    }
  };

  const earnedAchievementIds = userAchievements.map((ua: UserAchievement) => ua.achievementId);
  const totalPoints = userAchievements.reduce((sum: number, ua: UserAchievement) => sum + (ua.achievement?.points || 0), 0);
  const totalPossiblePoints = allAchievements.reduce((sum: number, a: Achievement) => sum + a.points, 0);
  const completionPercentage = totalPossiblePoints > 0 ? (totalPoints / totalPossiblePoints) * 100 : 0;

  const categories = ["all", ...new Set(allAchievements.map((a: Achievement) => a.category))];
  const filteredAchievements = selectedCategory === "all" 
    ? allAchievements 
    : allAchievements.filter((a: Achievement) => a.category === selectedCategory);

  if (achievementsLoading || userAchievementsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <span>Mes Badges & Achievements</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Débloquez des badges en progressant dans votre onboarding
            </p>
          </div>
          <Link to="/candidate-onboarding">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progression Globale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{userAchievements.length}</div>
                <div className="text-sm text-muted-foreground">Badges Obtenus</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{totalPoints}</div>
                <div className="text-sm text-muted-foreground">Points Totaux</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{allAchievements.length}</div>
                <div className="text-sm text-muted-foreground">Badges Disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{Math.round(completionPercentage)}%</div>
                <div className="text-sm text-muted-foreground">Complété</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progression</span>
                <span>{userAchievements.length} / {allAchievements.length}</span>
              </div>
              <Progress value={(userAchievements.length / allAchievements.length) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
              data-testid={`filter-${category}`}
            >
              {category === "all" ? "Tous" : getCategoryName(category)}
            </Button>
          ))}
        </div>

        {/* Recent Achievements */}
        {userAchievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Derniers Badges Obtenus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userAchievements
                  .sort((a: UserAchievement, b: UserAchievement) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
                  .slice(0, 3)
                  .map((userAchievement: UserAchievement) => {
                    const IconComponent = getIcon(userAchievement.achievement.icon);
                    return (
                      <div
                        key={userAchievement.id}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50"
                        data-testid={`recent-achievement-${userAchievement.achievement.id}`}
                      >
                        <div className="p-2 rounded-full bg-primary/10">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{userAchievement.achievement.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(userAchievement.earnedAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <Badge variant="secondary">+{userAchievement.achievement.points}</Badge>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement: Achievement) => {
            const IconComponent = getIcon(achievement.icon);
            const isEarned = earnedAchievementIds.includes(achievement.id);
            const userAchievement = userAchievements.find((ua: UserAchievement) => ua.achievementId === achievement.id);
            
            return (
              <Card 
                key={achievement.id} 
                className={`transition-all duration-200 ${
                  isEarned 
                    ? "ring-2 ring-primary/20 bg-primary/5" 
                    : "opacity-75 hover:opacity-100"
                }`}
                data-testid={`achievement-${achievement.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-full ${
                      isEarned ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={getCategoryColor(achievement.category)}
                      >
                        {getCategoryName(achievement.category)}
                      </Badge>
                      {isEarned && (
                        <div className="mt-1">
                          <Badge variant="default" className="bg-green-600">
                            ✓ Obtenu
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-2">{achievement.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{achievement.points} points</span>
                    </div>
                    {isEarned && userAchievement && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(userAchievement.earnedAt).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun badge dans cette catégorie</h3>
            <p className="text-muted-foreground">
              Essayez une autre catégorie ou revenez plus tard !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
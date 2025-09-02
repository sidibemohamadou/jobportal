import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  ArrowLeft,
  Plane,
  Video,
  UserCheck,
  FileText,
  Target,
  AlertCircle
} from "lucide-react";

interface OnboardingEvent {
  id: number;
  candidateOnboardingId: number;
  stepId?: number;
  title: string;
  description?: string;
  eventType: string;
  startDateTime: string;
  endDateTime?: string;
  location?: string;
  attendees?: string[];
  isRecurring: boolean;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CandidateOnboarding {
  id: number;
  userId: string;
  processId: number;
  status: string;
  progress: number;
  startDate: string;
  expectedCompletionDate: string;
  assignedMentor: string;
  notes: string;
}

export default function OnboardingCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<OnboardingEvent | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: "",
    description: "",
    eventType: "meeting",
    startDateTime: "",
    endDateTime: "",
    location: "",
    candidateOnboardingId: 0
  });

  // Fetch candidate's onboarding records
  const { data: onboardings = [], isLoading: onboardingsLoading } = useQuery({
    queryKey: ["/api/onboarding/candidates/user", user?.id],
    enabled: !!user?.id,
  });

  const currentOnboarding = onboardings.find((o: CandidateOnboarding) => o.status !== 'completed');

  // Fetch events for current onboarding
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/onboarding/events"],
    enabled: !!currentOnboarding?.id,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) =>
      apiRequest("POST", "/api/onboarding/events", eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/events"] });
      setCreateEventOpen(false);
      setEventFormData({
        title: "",
        description: "",
        eventType: "meeting",
        startDateTime: "",
        endDateTime: "",
        location: "",
        candidateOnboardingId: 0
      });
      toast({
        title: "Événement créé",
        description: "L'événement a été ajouté à votre calendrier.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'événement.",
        variant: "destructive",
      });
    },
  });

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'training': return <Target className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'deadline': return <AlertCircle className="h-4 w-4" />;
      case 'review': return <FileText className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'training': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'meeting': return 'bg-green-100 text-green-800 border-green-200';
      case 'deadline': return 'bg-red-100 text-red-800 border-red-200';
      case 'review': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeName = (eventType: string) => {
    switch (eventType) {
      case 'training': return 'Formation';
      case 'meeting': return 'Réunion';
      case 'deadline': return 'Échéance';
      case 'review': return 'Évaluation';
      default: return 'Événement';
    }
  };

  const handleCreateEvent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentOnboarding) return;

    createEventMutation.mutate({
      ...eventFormData,
      candidateOnboardingId: currentOnboarding.id
    });
  };

  const getEventsForDate = (date: string) => {
    return events.filter((event: OnboardingEvent) => {
      const eventDate = new Date(event.startDateTime).toISOString().split('T')[0];
      return eventDate === date;
    });
  };

  const getWeekDates = (startDate: string) => {
    const date = new Date(startDate);
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day.toISOString().split('T')[0]);
    }
    return week;
  };

  if (onboardingsLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!currentOnboarding) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Aucun Onboarding en Cours</h1>
            <p className="text-muted-foreground mb-4">
              Vous n'avez actuellement aucun processus d'onboarding en cours pour planifier des événements.
            </p>
            <Link to="/candidate-onboarding">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'Onboarding
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(selectedDate);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-primary" />
              <span>Calendrier d'Onboarding</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Planifiez et suivez vos événements d'intégration
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/candidate-onboarding">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            {(user?.role === 'admin' || user?.role === 'hr') && (
              <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-event">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un Événement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Créer un Événement</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Titre</Label>
                      <Input
                        id="title"
                        data-testid="input-event-title"
                        value={eventFormData.title}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventType">Type d'événement</Label>
                      <Select
                        value={eventFormData.eventType}
                        onValueChange={(value) => setEventFormData(prev => ({ ...prev, eventType: value }))}
                      >
                        <SelectTrigger data-testid="select-event-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="training">Formation</SelectItem>
                          <SelectItem value="meeting">Réunion</SelectItem>
                          <SelectItem value="deadline">Échéance</SelectItem>
                          <SelectItem value="review">Évaluation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDateTime">Début</Label>
                        <Input
                          id="startDateTime"
                          type="datetime-local"
                          data-testid="input-start-datetime"
                          value={eventFormData.startDateTime}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, startDateTime: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDateTime">Fin</Label>
                        <Input
                          id="endDateTime"
                          type="datetime-local"
                          data-testid="input-end-datetime"
                          value={eventFormData.endDateTime}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, endDateTime: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="location">Lieu</Label>
                      <Input
                        id="location"
                        data-testid="input-location"
                        value={eventFormData.location}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Salle de réunion, Zoom, etc."
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        data-testid="input-description"
                        value={eventFormData.description}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setCreateEventOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={createEventMutation.isPending} data-testid="button-submit-event">
                        {createEventMutation.isPending ? "Création..." : "Créer"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Calendar Navigation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() - 7);
                    setSelectedDate(date.toISOString().split('T')[0]);
                  }}
                  data-testid="button-prev-week"
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(today)}
                  data-testid="button-today"
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() + 7);
                    setSelectedDate(date.toISOString().split('T')[0]);
                  }}
                  data-testid="button-next-week"
                >
                  →
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week View */}
            <div className="grid grid-cols-7 gap-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              
              {weekDates.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isToday = date === today;
                const dateObj = new Date(date);
                
                return (
                  <div
                    key={date}
                    className={`min-h-[120px] p-2 border rounded-lg ${
                      isToday ? "bg-primary/5 border-primary" : "bg-card"
                    }`}
                    data-testid={`calendar-day-${date}`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      isToday ? "text-primary" : "text-foreground"
                    }`}>
                      {dateObj.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.map((event: OnboardingEvent) => (
                        <div
                          key={event.id}
                          className={`p-1 rounded text-xs cursor-pointer hover:opacity-80 ${getEventTypeColor(event.eventType)}`}
                          onClick={() => setSelectedEvent(event)}
                          data-testid={`event-${event.id}`}
                        >
                          <div className="flex items-center gap-1">
                            {getEventTypeIcon(event.eventType)}
                            <span className="truncate">{event.title}</span>
                          </div>
                          <div className="text-xs opacity-75">
                            {new Date(event.startDateTime).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Événements à Venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun événement planifié</h3>
                <p className="text-muted-foreground">
                  Les événements apparaîtront ici une fois créés.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events
                  .filter((event: OnboardingEvent) => new Date(event.startDateTime) >= new Date())
                  .sort((a: OnboardingEvent, b: OnboardingEvent) => 
                    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
                  )
                  .slice(0, 5)
                  .map((event: OnboardingEvent) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                      data-testid={`upcoming-event-${event.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${getEventTypeColor(event.eventType)}`}>
                          {getEventTypeIcon(event.eventType)}
                        </div>
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(event.startDateTime).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {event.location && (
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={getEventTypeColor(event.eventType)}>
                        {getEventTypeName(event.eventType)}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Details Dialog */}
        {selectedEvent && (
          <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getEventTypeIcon(selectedEvent.eventType)}
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <Badge className={getEventTypeColor(selectedEvent.eventType)}>
                    {getEventTypeName(selectedEvent.eventType)}
                  </Badge>
                </div>
                
                <div>
                  <Label>Date et heure</Label>
                  <div className="text-sm">
                    {new Date(selectedEvent.startDateTime).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {selectedEvent.endDateTime && (
                      <span> - {new Date(selectedEvent.endDateTime).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    )}
                  </div>
                </div>

                {selectedEvent.location && (
                  <div>
                    <Label>Lieu</Label>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      {selectedEvent.location}
                    </div>
                  </div>
                )}

                {selectedEvent.description && (
                  <div>
                    <Label>Description</Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedEvent.description}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Statut</Label>
                  <Badge variant={selectedEvent.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedEvent.status === 'scheduled' ? 'Planifié' : 
                     selectedEvent.status === 'completed' ? 'Terminé' : 'Annulé'}
                  </Badge>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
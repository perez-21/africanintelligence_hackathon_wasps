import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  ArrowLeft, Calendar, MapPin, Clock, Users, Award, PenTool, 
  Loader2, FileText, CalendarX, Share2, Monitor, UserPlus, Shield, 
  AlignJustify, BookOpen, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useTourLMS } from '@/contexts/TourLMSContext';
import { useAuth } from '@/contexts/AuthContext';
import TeamFormDialog from '@/components/teams/TeamFormDialog';
import TeamsList from '@/components/teams/TeamsList';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ShareEventButton from '@/components/events/ShareEventButton';
import { clg, ocn } from '../../lib/basic';
import { badgeService } from '../../services/badgeService';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { API_URL } = useTourLMS();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRegisteringForEvent, setIsRegisteringForEvent] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    if(!ocn(event))return;
    if (user && event.participants) {
        setIsParticipant(event.participants.includes(user.id));
        setParticipantCount(event.participants.length);
      }
      
  },[event,user])
  
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/events/${id}`, {
        headers: { 'x-auth-token': token },
      });
      
      const eventData = response.data;
      clg('event data - ',eventData)
      setEvent(eventData);
      
      // Check if current user is a participant
      if (user && eventData.participants) {
        setIsParticipant(eventData.participants.includes(user.id));
        setParticipantCount(eventData.participants.length);
      }
      
      // Count teams if available
      if (eventData.teams) {
        setTeamCount(eventData.teams.length);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: 'Failed to load event details',
        description: error.response?.data?.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async () => {
    try {
      setIsRegisteringForEvent(true);
      const token = localStorage.getItem('token');
      
      if (isParticipant) {
        // Leave the event
        await axios.delete(`${API_URL}/admin/events/${id}/register/${user.id}`, {
          headers: { 'x-auth-token': token },
        });
        
        toast({
          title: 'Successfully left the event',
          variant: 'default',
        });
        
        setIsParticipant(false);
        setParticipantCount(prev => Math.max(0, prev - 1));
      } else {
        // Join the event
        await axios.post(`${API_URL}/admin/events/${id}/register/${user.id}`, {}, {
          headers: { 'x-auth-token': token },
        });
        
        toast({
          title: 'Successfully joined the event',
          variant: 'success',
        });
        
        setIsParticipant(true);
        setParticipantCount(prev => prev + 1);
        badgeService.updateStats({totalXp: badgeService.getStats().totalXp + 30});
      }
      
      // Refresh event data
      fetchEventDetails();
    } catch (error) {
      console.error('Error updating participation:', error);
      toast({
        title: isParticipant ? 'Failed to leave event' : 'Failed to join event',
        description: error.response?.data?.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsRegisteringForEvent(false);
    }
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return format(date, 'PPP');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-gray-400">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <CalendarX className="w-16 h-16 mx-auto text-gray-600 mb-3" />
        <h2 className="text-2xl font-bold text-gray-300">Event Not Found</h2>
        <p className="text-gray-400 mt-2">
          The event you are looking for does not exist or has been deleted
        </p>
        <Button asChild className="mt-6">
          <Link to="/student/events">Back to Events</Link>
        </Button>
      </div>
    );
  }

  const isEventPast = new Date(event.eventDate) < new Date();

  return (
    <div className="container px-4 py-6 mx-auto max-w-7xl">
      <Button variant="ghost" className="mb-6" asChild>
        <Link
          to="/student/events"
          className="flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          <span>Back to Events</span>
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Header */}
          <div className="relative rounded-lg overflow-hidden">
            <div className="h-64 w-full">
              {event.flyer ? (
                <img 
                  src={event.flyer} 
                  alt={event.title} 
                  className={`w-full h-full object-cover ${isEventPast ? 'grayscale' : ''}`}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r ${isEventPast ? 'from-gray-600 to-gray-800' : 'from-purple-600 to-blue-600'} flex items-center justify-center`}>
                  <Calendar className="h-24 w-24 text-white" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-6">
              {event.eventTypeDetails && (
                <Badge 
                  className="self-start mb-3" 
                  style={{ backgroundColor: event.eventTypeDetails.color || '#8B5CF6' }}
                >
                  {event.eventTypeDetails.name}
                </Badge>
              )}
              <h1 className="text-3xl font-bold text-white">{event.title}</h1>
            </div>
          </div>

          {/* Event Tabs */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Event Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{event.description}</p>
                </CardContent>
              </Card>

              {event.timeline && event.timeline.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="relative border-l border-purple-200 dark:border-purple-800">
                      {event.timeline.map((item, index) => (
                        <li key={index} className="mb-6 ml-4">
                          <div className="absolute w-3 h-3 bg-purple-600 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900"></div>
                          <time className="mb-1 text-sm font-normal leading-none text-gray-400">{item.date}</time>
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                          <p className="text-base font-normal text-gray-500">{item.description}</p>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {event.prizes && event.prizes.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="mr-2 h-5 w-5" />
                      Prizes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.prizes.map((prize, index) => (
                        <div key={index} className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          <h4 className="font-semibold text-lg">{prize.title}</h4>
                          <p className="text-purple-600 dark:text-purple-400 font-medium">{prize.value}</p>
                          {prize.description && <p className="text-sm mt-1">{prize.description}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="guidelines">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Event Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  {event.guidelines?.text ? (
                    <div dangerouslySetInnerHTML={{ __html: event.guidelines.text }} />
                  ) : (
                    <p>No guidelines have been provided for this event.</p>
                  )}
                  
                  {event.guidelines?.pdf && (
                    <div className="mt-6">
                      <Button asChild variant="outline">
                        <a href={event.guidelines.pdf} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          Download Guidelines PDF
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {event.techStack && event.techStack.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Monitor className="mr-2 h-5 w-5" />
                      Technology Stack
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {event.techStack.map((tech, index) => (
                        <Badge key={index} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="teams">
              {!isParticipant ? (
                <Alert className="mb-6">
                  <Shield className="h-4 w-4" />
                  <AlertTitle>You need to join this event first</AlertTitle>
                  <AlertDescription>
                    Please register for the event before creating or joining teams.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Teams</h3>
                    <TeamFormDialog 
                      eventId={id}
                      onTeamCreated={() => fetchEventDetails()}
                    />
                  </div>

                  <TeamsList 
                    eventId={id} 
                    userId={user.id}
                    onTeamsUpdated={() => fetchEventDetails()}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Actions */}
          <Card className="bg-gradient-to-br from-purple-50/10 to-blue-50/10 backdrop-blur-sm border-purple-200/20">
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatEventDate(event.eventDate)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{event.location || 'Virtual'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">
                      {event.duration ? `${event.duration.value} ${event.duration.unit}` : 'TBD'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">Participants</p>
                    <p className="font-medium">{participantCount}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-3 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">Teams</p>
                    <p className="font-medium">{teamCount}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {!isEventPast ? (
                <Button 
                  onClick={handleParticipate} 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isRegisteringForEvent}
                >
                  {isRegisteringForEvent ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isParticipant ? (
                    'Leave Event'
                  ) : (
                    'Join Event'
                  )}
                </Button>
              ) : (
                <Button disabled className="w-full">
                  Event Ended
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Mentorship Info */}
          {event.mentorship && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PenTool className="mr-2 h-5 w-5" />
                  Mentorship
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{event.mentorship}</p>
              </CardContent>
            </Card>
          )}

          {/* Event Share */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="mr-2 h-5 w-5" />
                Share Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <ShareEventButton eventTitle={event.title} eventId={id} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;

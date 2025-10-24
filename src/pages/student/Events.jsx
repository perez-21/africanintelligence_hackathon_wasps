
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useTourLMS } from '@/contexts/TourLMSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Calendar, 
  Search,
  CalendarOff,
  ArrowUpRight,
  Users,
  Calendar as CalendarIcon,
  MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from '@/components/ui/card';

const Events = () => {
  const { toast } = useToast();
  const { API_URL } = useTourLMS();
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');



  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/events`, {
        headers: { 'x-auth-token': token },
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Failed to load events',
        description: error.response?.data?.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/event-types`, {
        headers: { 'x-auth-token': token },
      });
      setEventTypes(response.data);
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const filteredEvents = events
    .filter(event => event.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(event => filterType === 'all' ? true : event.eventType === filterType)
    .filter(event => {
      if (filterStatus === 'all') return true;
      const now = new Date();
      const eventDate = new Date(event.eventDate);
      if (filterStatus === 'upcoming') return eventDate >= now;
      if (filterStatus === 'past') return eventDate < now;
      return true;
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
        <p className="text-lg text-gray-500">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Events</h1>
          <p className="text-gray-500">Discover and participate in events</p>
        </div>
      </div>
      
      {/* Filter options */}
      <div className="grid gap-4 mb-8 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {eventTypes.map((type) => (
              <SelectItem key={type._id} value={type._id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming Events</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Events grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const isEventPast = new Date(event.eventDate) < new Date();
            return (
              <Link
                to={`/student/events/${event._id}`}
                key={event._id}
                className="block transition-all duration-200 hover:translate-y-[-4px]"
              >
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                  <div className="h-48 overflow-hidden relative">
                    {event.flyer ? (
                      <img
                        src={event.flyer}
                        alt={event.title}
                        className={`w-full h-full object-cover ${
                          isEventPast ? 'grayscale' : ''
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          isEventPast
                            ? 'bg-gradient-to-br from-gray-700 to-gray-900'
                            : 'bg-gradient-to-br from-purple-600 to-blue-700'
                        }`}
                      >
                        <Calendar className="h-16 w-16 text-white opacity-40" />
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {isEventPast ? (
                        <Badge className="bg-gray-700">Past</Badge>
                      ) : (
                        <Badge className="bg-green-600">Upcoming</Badge>
                      )}
                      
                      {event.eventTypeDetails && (
                        <Badge
                          style={{ backgroundColor: event.eventTypeDetails.color }}
                        >
                          {event.eventTypeDetails.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-lg font-semibold line-clamp-2">{event.title}</h3>
                    
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {formatEventDate(event.eventDate)}
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      
                      {event.participantDetails && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          {event.participantDetails.length} participants
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 w-full justify-between"
                    >
                      View Details
                      <ArrowUpRight size={16} />
                    </Button>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarOff className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No events found</h3>
          <p className="text-gray-500 max-w-md">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? "No events match your search criteria. Try adjusting your filters."
              : "There are no events scheduled at the moment. Check back later!"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Events;

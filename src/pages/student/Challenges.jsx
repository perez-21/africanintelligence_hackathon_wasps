import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, Clock, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { wsService } from '@/services/websocket';
import { useTourLMS } from '@/contexts/TourLMSContext';
import { mockChallenges } from '@/data/mockChallenges';
import ChallengeDetail from '@/components/challenge/ChallengeDetail';
import ChallengeAttempt from '@/components/challenge/ChallengeAttempt';
import { badgeService } from '../../services/badgeService';

const Challenges = () => {
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [upcomingChallenges, setUpcomingChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [attemptingChallenge, setAttemptingChallenge] = useState(null);
  const [submittedChallenges, setSubmittedChallenges] = useState(new Set());
  const { token } = useTourLMS();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) return;

    // Initialize WebSocket connection with token
    wsService.connect(token);

    // Set up event listeners for challenge updates
    wsService.subscribe('challenge_list', (data) => {
      setActiveChallenges(data.active || []);
      setUpcomingChallenges(data.upcoming || []);
      setCompletedChallenges(data.completed || []);
    });

    // For testing, use mock data
    setActiveChallenges(mockChallenges.active);
    setUpcomingChallenges(mockChallenges.upcoming);
    setCompletedChallenges(mockChallenges.completed);

    return () => {
      wsService.disconnect();
    };
  }, [token]);

  const handleJoinChallenge = async (challengeId) => {
    // Simulate joining a challenge
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Challenge Joined!",
      description: "You've successfully joined the challenge. Good luck!",
    });
    setSelectedChallenge(null);
    setAttemptingChallenge(activeChallenges.find(c => c.id === challengeId));
    badgeService.updateStats({totalXp: badgeService.getStats().totalXp + 20});
  };

  const handleSubmitSolution = async (challengeId, submission) => {
    // Simulate submitting a solution
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmittedChallenges(prev => new Set([...prev, challengeId]));
    setAttemptingChallenge(null);
    toast({
      title: "Solution Submitted!",
      description: "Your solution has been submitted successfully.",
    });
    badgeService.updateStats({totalXp: badgeService.getStats().totalXp + 50});
  };

  const renderChallengeCard = (challenge, type) => {
    const isSubmitted = submittedChallenges.has(challenge.id);
    const isAttempting = attemptingChallenge?.id === challenge.id;

    return (
      <Card key={challenge.id} className="p-6 mb-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedChallenge(challenge)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-purple-500" />
            <h3 className="text-xl font-semibold">{challenge.title}</h3>
          </div>
          {type === 'active' && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-lg font-medium">{formatTime(challenge.timeLeft)}</span>
            </div>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{challenge.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>{challenge.participants} participants</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>{challenge.maxScore} points</span>
            </div>
          </div>
          <Button
            variant={type === 'active' ? 'default' : 'outline'}
            className={type === 'active' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            onClick={(e) => {
              e.stopPropagation();
              if (type === 'active' && !isSubmitted && !isAttempting) {
                setSelectedChallenge(challenge);
              }
            }}
            disabled={isSubmitted || isAttempting}
          >
            {isSubmitted ? 'Submitted' : isAttempting ? 'In Progress' : type === 'active' ? 'Join Challenge' : 'View Details'}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Challenges</h1>
      
      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Active Challenges</h2>
          {activeChallenges.map(challenge => renderChallengeCard(challenge, 'active'))}
        </div>
      )}

      {/* Upcoming Challenges */}
      {upcomingChallenges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Upcoming Challenges</h2>
          {upcomingChallenges.map(challenge => renderChallengeCard(challenge, 'upcoming'))}
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Completed Challenges</h2>
          {completedChallenges.map(challenge => renderChallengeCard(challenge, 'completed'))}
        </div>
      )}

      {/* Empty State */}
      {activeChallenges.length === 0 && upcomingChallenges.length === 0 && completedChallenges.length === 0 && (
        <Card className="p-8 text-center">
          <Cpu className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Challenges Available</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Check back later for new challenges and opportunities to test your skills!
          </p>
        </Card>
      )}

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <ChallengeDetail
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onJoin={handleJoinChallenge}
        />
      )}

      {/* Challenge Attempt Modal */}
      {attemptingChallenge && (
        <ChallengeAttempt
          challenge={attemptingChallenge}
          onClose={() => setAttemptingChallenge(null)}
          onSubmit={handleSubmitSolution}
        />
      )}
    </div>
  );
};

const formatTime = (ms) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

export default Challenges; 
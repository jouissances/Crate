import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { stationAPI, spotifyAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Music, Radio, Play, Heart, BookOpen, MessageSquare } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const StationPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [station, setStation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [djInfo, setDjInfo] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStation = async () => {
      try {
        const data = await stationAPI.getStation(id || '');
        setStation(data);
        
        setDjInfo({
          username: 'dj_username',
          display_name: 'DJ Name',
          profile_image: null
        });
      } catch (error) {
        console.error('Failed to fetch station:', error);
        toast({
          title: 'Error',
          description: 'Failed to load station details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchStation();
    }
  }, [id, toast]);

  const handleGoLive = async () => {
    try {
      await stationAPI.startLiveSession(id || '');
      window.location.href = `/live/${id}`;
    } catch (error) {
      console.error('Failed to start live session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start live session',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading station...</p>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Station not found</p>
      </div>
    );
  }

  const isOwner = isAuthenticated && user?.id === station.dj_id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Station Info */}
        <div className="md:w-2/3">
          <Card className="border-orange-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{station.name}</CardTitle>
                  {station.description && (
                    <CardDescription>{station.description}</CardDescription>
                  )}
                </div>
                {isOwner && (
                  <Button 
                    onClick={handleGoLive} 
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Radio className="h-4 w-4 mr-2" />
                    Go Live
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center mb-6">
                {station.cover_art ? (
                  <img 
                    src={station.cover_art} 
                    alt={station.name} 
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <Music className="h-16 w-16 text-gray-400" />
                )}
              </div>
              
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-10 w-10 border-2 border-orange-600">
                  <AvatarImage src={djInfo?.profile_image} alt={djInfo?.username} />
                  <AvatarFallback className="bg-orange-200 text-orange-800">
                    {djInfo?.username?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">DJ: {djInfo?.display_name}</p>
                  <p className="text-sm text-gray-500">@{djInfo?.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {station.mood && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Mood</h3>
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-lg">
                        {station.mood.emoji} {station.mood.text}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {station.currently_reading && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Currently Reading</h3>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-orange-600" />
                      <span className="text-sm">
                        {station.currently_reading.title} by {station.currently_reading.author}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {station.quote && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Quote</h3>
                  <blockquote className="pl-4 border-l-2 border-orange-600 italic">
                    "{station.quote}"
                  </blockquote>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Tracks */}
        <div className="md:w-1/3">
          <Card className="border-orange-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              {station.tracks && station.tracks.length > 0 ? (
                <div className="space-y-4">
                  {station.tracks.map((track: any) => (
                    <div key={track.id} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        {track.album_art ? (
                          <img 
                            src={track.album_art} 
                            alt={track.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{track.name}</p>
                        <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Music className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No tracks added yet</p>
                </div>
              )}
              
              {isOwner && (
                <Button 
                  className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                  variant="outline"
                >
                  Add Tracks
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Sound Bites */}
      {station.sound_bites && station.sound_bites.length > 0 && (
        <Card className="border-orange-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Sound Bites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {station.sound_bites.map((bite: any) => (
                <div key={bite.id} className="flex items-center p-3 border rounded-md">
                  <Button size="icon" variant="ghost" className="h-8 w-8 mr-2">
                    <Play className="h-4 w-4" />
                  </Button>
                  <div>
                    <p className="text-sm font-medium">{bite.name}</p>
                    <p className="text-xs text-gray-500">{Math.floor(bite.duration / 60)}:{(bite.duration % 60).toString().padStart(2, '0')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StationPage;

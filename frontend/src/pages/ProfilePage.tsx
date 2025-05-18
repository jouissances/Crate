import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/authContext';
import { stationAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Music, Radio, Settings, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserStations = async () => {
      try {
        const allStations = await stationAPI.getAllStations();
        const userStations = allStations.filter((station: any) => station.dj_id === user?.id);
        setStations(userStations);
      } catch (error) {
        console.error('Failed to fetch stations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your stations',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchUserStations();
    }
  }, [user, toast]);
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading profile...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card className="border-orange-200 dark:border-gray-700">
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto border-4 border-orange-600">
                <AvatarImage src={user.profile_image} alt={user.username} />
                <AvatarFallback className="bg-orange-200 text-orange-800 text-2xl">
                  {user.username?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-2">{user.display_name}</CardTitle>
              <CardDescription>@{user.username}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Badge variant="outline" className="capitalize">
                  {user.role === 'dj' ? (
                    <>
                      <Radio className="h-3 w-3 mr-1" />
                      DJ
                    </>
                  ) : (
                    <>
                      <Music className="h-3 w-3 mr-1" />
                      Listener
                    </>
                  )}
                </Badge>
              </div>
              
              <div className="flex justify-center space-x-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Stations</p>
                  <p className="font-bold">{stations.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Followers</p>
                  <p className="font-bold">0</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Following</p>
                  <p className="font-bold">0</p>
                </div>
              </div>
              
              <div className="pt-2">
                {user.spotify_connected ? (
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm">Connected to Spotify</span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: 'Not implemented',
                        description: 'Spotify connection would be triggered here',
                      });
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect Spotify
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700"
                onClick={logout}
              >
                Log Out
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Content Area */}
        <div className="md:col-span-2">
          <Tabs defaultValue="stations">
            <TabsList className="mb-4">
              <TabsTrigger value="stations">My Stations</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="history">Listening History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stations">
              {user.role === 'dj' && (
                <div className="mb-4">
                  <Link to="/create-station">
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <Music className="h-4 w-4 mr-2" />
                      Create New Station
                    </Button>
                  </Link>
                </div>
              )}
              
              {loading ? (
                <div className="text-center py-8">Loading your stations...</div>
              ) : stations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {stations.map((station) => (
                    <Card key={station.id} className="overflow-hidden border-orange-200 dark:border-gray-700">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                        {station.cover_art ? (
                          <img 
                            src={station.cover_art} 
                            alt={station.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle>{station.name}</CardTitle>
                        {station.description && (
                          <CardDescription>{station.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardFooter>
                        <div className="flex space-x-2 w-full">
                          <Link to={`/station/${station.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              View
                            </Button>
                          </Link>
                          <Link to={`/live/${station.id}`} className="flex-1">
                            <Button className="w-full bg-red-600 hover:bg-red-700">
                              Go Live
                            </Button>
                          </Link>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                  <Music className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium mb-1">No stations yet</h3>
                  <p className="text-gray-500 mb-4">
                    {user.role === 'dj' 
                      ? "You haven't created any stations yet. Create your first station to start sharing your music taste!"
                      : "You don't have any stations as a listener. Consider becoming a DJ to create your own stations!"}
                  </p>
                  {user.role === 'dj' && (
                    <Link to="/create-station">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        Create Your First Station
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="favorites">
              <div className="text-center py-8 px-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <Music className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium mb-1">No favorites yet</h3>
                <p className="text-gray-500">
                  You haven't favorited any stations yet. Browse stations and mark them as favorites to see them here!
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <div className="text-center py-8 px-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <Music className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium mb-1">No listening history</h3>
                <p className="text-gray-500">
                  Your listening history will appear here once you start tuning into stations.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

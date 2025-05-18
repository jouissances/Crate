import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { liveAPI, stationAPI } from '../lib/api';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Music, Radio, Headphones } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [stations, setStations] = useState<any[]>([]);
  const [liveStations, setLiveStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stationsData, liveSessionsData] = await Promise.all([
          stationAPI.getAllStations(),
          liveAPI.getLiveSessions()
        ]);
        
        setStations(stationsData);
        setLiveStations(liveSessionsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading stations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Discover Music Like a Crate-Digging DJ</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Create your own themed radio station, share your vibes, and connect with like-minded listeners.
        </p>
        {!isAuthenticated && (
          <div className="mt-6 space-x-4">
            <Link to="/register">
              <Button className="bg-orange-600 hover:bg-orange-700">Sign Up</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline">Log In</Button>
            </Link>
          </div>
        )}
      </section>

      {liveStations.length > 0 && (
        <section>
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <h2 className="text-2xl font-bold">Live Now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveStations.map((session) => {
              const station = stations.find(s => s.id === session.station_id);
              if (!station) return null;
              
              return (
                <Card key={session.station_id} className="overflow-hidden border-orange-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle>{station.name}</CardTitle>
                    <CardDescription>Live Session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center mb-4">
                      {station.cover_art ? (
                        <img 
                          src={station.cover_art} 
                          alt={station.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Radio className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link to={`/live/${station.id}`} className="w-full">
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        <Headphones className="h-4 w-4 mr-2" />
                        Join Live
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold mb-4">Discover Stations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => (
            <Card key={station.id} className="overflow-hidden border-orange-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle>{station.name}</CardTitle>
                {station.description && (
                  <CardDescription>{station.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center mb-4">
                  {station.cover_art ? (
                    <img 
                      src={station.cover_art} 
                      alt={station.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music className="h-12 w-12 text-gray-400" />
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/station/${station.id}`} className="w-full">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    View Station
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;

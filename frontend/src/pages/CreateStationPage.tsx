import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { stationAPI, spotifyAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Music, Upload, Search, Plus, BookOpen, Quote } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const CreateStationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mood: {
      text: '',
      emoji: ''
    },
    currently_reading: {
      title: '',
      author: ''
    },
    quote: '',
    cover_art: null
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        cover_art: e.target.files ? e.target.files[0] : null
      }));
    }
  };
  
  const handleSearchTracks = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await spotifyAPI.searchTracks(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search tracks:', error);
      toast({
        title: 'Search failed',
        description: 'Failed to search for tracks. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleAddTrack = (track: any) => {
    if (selectedTracks.some(t => t.id === track.id)) {
      return;
    }
    
    const formattedTrack = {
      spotify_id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      album_art: track.album.images[0]?.url,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url
    };
    
    setSelectedTracks(prev => [...prev, formattedTrack]);
  };
  
  const handleRemoveTrack = (index: number) => {
    setSelectedTracks(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const stationData = {
        ...formData,
        tracks: selectedTracks.length > 0 ? selectedTracks : []
      };
      
      console.log('Creating station with data:', stationData);
      const station = await stationAPI.createStation(stationData);
      
      toast({
        title: 'Station created',
        description: 'Your station has been created successfully!',
      });
      
      navigate(`/station/${station.id}`);
    } catch (error) {
      console.error('Failed to create station:', error);
      toast({
        title: 'Creation failed',
        description: 'Failed to create your station. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create a New Station</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border-orange-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Station Details</CardTitle>
              <CardDescription>Basic information about your station</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Station Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Late Night Tokyo Drifts"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="A brief description of your station's vibe"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cover_art">Cover Art (optional)</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
                    {formData.cover_art ? (
                      <img 
                        src={URL.createObjectURL(formData.cover_art as Blob)} 
                        alt="Cover preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="cover_art"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverArtChange}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('cover_art')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Personal Touches</CardTitle>
              <CardDescription>Add your unique vibe to the station</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mood.emoji">Mood Emoji</Label>
                  <Input
                    id="mood.emoji"
                    name="mood.emoji"
                    value={formData.mood.emoji}
                    onChange={handleChange}
                    placeholder="🫠"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mood.text">Mood Text</Label>
                  <Input
                    id="mood.text"
                    name="mood.text"
                    value={formData.mood.text}
                    onChange={handleChange}
                    placeholder="Chill"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currently_reading.title">Currently Reading (optional)</Label>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <Input
                    id="currently_reading.title"
                    name="currently_reading.title"
                    value={formData.currently_reading.title}
                    onChange={handleChange}
                    placeholder="Book Title"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currently_reading.author">Author</Label>
                <Input
                  id="currently_reading.author"
                  name="currently_reading.author"
                  value={formData.currently_reading.author}
                  onChange={handleChange}
                  placeholder="Author Name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quote">Favorite Quote (optional)</Label>
                <div className="flex items-start space-x-2">
                  <Quote className="h-4 w-4 text-orange-600 flex-shrink-0 mt-2" />
                  <Textarea
                    id="quote"
                    name="quote"
                    value={formData.quote}
                    onChange={handleChange}
                    placeholder="A quote that inspires you"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="border-orange-200 dark:border-gray-700 mb-6">
          <CardHeader>
            <CardTitle>Add Tracks</CardTitle>
            <CardDescription>Search and add tracks to your station</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="search">
              <TabsList className="mb-4">
                <TabsTrigger value="search">Search Tracks</TabsTrigger>
                <TabsTrigger value="selected">Selected Tracks ({selectedTracks.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="search" className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for tracks..."
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={handleSearchTracks}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="text-center py-4">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((track) => (
                      <div 
                        key={track.id} 
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                      >
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                          {track.album.images[0] ? (
                            <img 
                              src={track.album.images[0].url} 
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
                          <p className="text-xs text-gray-500 truncate">
                            {track.artists.map((a: any) => a.name).join(', ')}
                          </p>
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={() => handleAddTrack(track)}
                          disabled={selectedTracks.some(t => t.spotify_id === track.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {searchQuery.trim() ? 'No results found' : 'Search for tracks to add to your station'}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="selected">
                {selectedTracks.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedTracks.map((track, index) => (
                      <div 
                        key={index} 
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                      >
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
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleRemoveTrack(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No tracks selected yet
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            className="bg-orange-600 hover:bg-orange-700"
            disabled={isLoading || !formData.name}
            onClick={(e) => {
              console.log('Manual button clicked');
              if (!isLoading && formData.name) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          >
            {isLoading ? 'Creating...' : 'Create Station Manually'}
          </Button>
          <Button 
            type="submit" 
            className="bg-orange-600 hover:bg-orange-700"
            disabled={isLoading || !formData.name}
          >
            {isLoading ? 'Creating...' : 'Create Station'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateStationPage;

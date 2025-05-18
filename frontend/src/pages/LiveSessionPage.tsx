import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { stationAPI } from '../lib/api';
import { useWebSocket } from '../lib/websocket';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog';
import { Music, Send, Heart, DollarSign } from 'lucide-react';

const LiveSessionPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [station, setStation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [tipAmount, setTipAmount] = useState(1);
  const [tipMessage, setTipMessage] = useState('');
  const [showTipDialog, setShowTipDialog] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const token = localStorage.getItem('token') || '';
  
  const { 
    isConnected, 
    messages, 
    listeners, 
    tips, 
    currentTrack,
    sendChatMessage,
    sendTip
  } = useWebSocket(id || '', token);
  
  useEffect(() => {
    const fetchStation = async () => {
      try {
        const data = await stationAPI.getStation(id || '');
        setStation(data);
      } catch (error) {
        console.error('Failed to fetch station:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchStation();
    }
  }, [id]);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim() && isConnected) {
      sendChatMessage(chatMessage);
      setChatMessage('');
    }
  };
  
  const handleSendTip = () => {
    if (station && isConnected) {
      sendTip(station.dj_id, tipAmount, tipMessage);
      setShowTipDialog(false);
      setTipAmount(1);
      setTipMessage('');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading live session...</p>
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
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Station Info */}
      <div className="md:col-span-2">
        <Card className="bg-white dark:bg-gray-800 border-orange-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-500">Live</span>
                </div>
                <CardTitle className="text-2xl mt-2">{station.name}</CardTitle>
              </div>
              
              {isAuthenticated && user?.id !== station.dj_id && (
                <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Tip DJ
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send a tip to the DJ</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Amount ($)</label>
                        <Input
                          type="number"
                          min="1"
                          value={tipAmount}
                          onChange={(e) => setTipAmount(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Message (optional)</label>
                        <Input
                          value={tipMessage}
                          onChange={(e) => setTipMessage(e.target.value)}
                          placeholder="Add a message with your tip"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSendTip} className="bg-orange-600 hover:bg-orange-700">
                        Send Tip
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center mb-4">
              {currentTrack ? (
                <div className="w-full h-full p-4 flex flex-col items-center justify-center">
                  <img 
                    src={currentTrack.album_art} 
                    alt={currentTrack.name} 
                    className="w-32 h-32 object-cover rounded-md shadow-lg mb-4"
                  />
                  <h3 className="text-lg font-semibold">{currentTrack.name}</h3>
                  <p className="text-gray-500">{currentTrack.artist}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Music className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p>Waiting for music to start...</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="h-10 w-10 border-2 border-orange-600">
                <AvatarFallback className="bg-orange-200 text-orange-800">
                  DJ
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">DJ: {station.dj_username}</p>
                <p className="text-sm text-gray-500">{listeners.length} listening</p>
              </div>
            </div>
            
            {station.mood && (
              <div className="mb-4">
                <p className="text-sm">
                  <span className="font-semibold">Mood:</span> {station.mood.emoji} {station.mood.text}
                </p>
              </div>
            )}
            
            {station.quote && (
              <div className="mb-4">
                <p className="text-sm italic">"{station.quote}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Chat */}
      <div>
        <Card className="bg-white dark:bg-gray-800 border-orange-200 dark:border-gray-700 h-[600px] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Live Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-4 space-y-4"
            >
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {message.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-semibold">{message.display_name}</p>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {tips.map((tip) => (
                <div key={tip.id} className="flex items-center space-x-2 bg-orange-100 dark:bg-orange-900/20 p-2 rounded">
                  <Heart className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs">
                      <span className="font-semibold">{tip.from_user.display_name}</span> tipped ${tip.amount}
                    </p>
                    {tip.message && <p className="text-sm">{tip.message}</p>}
                  </div>
                </div>
              ))}
            </div>
            
            {isAuthenticated ? (
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="bg-orange-600 hover:bg-orange-700">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <p className="text-center text-sm text-gray-500">
                Log in to join the conversation
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveSessionPage;

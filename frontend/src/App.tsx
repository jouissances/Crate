import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import { Toaster } from './components/ui/toaster';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StationPage from './pages/StationPage';
import CreateStationPage from './pages/CreateStationPage';
import ProfilePage from './pages/ProfilePage';
import LiveSessionPage from './pages/LiveSessionPage';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/station/:id" element={<StationPage />} />
            <Route path="/live/:id" element={<LiveSessionPage />} />
            <Route 
              path="/create-station" 
              element={
                <ProtectedRoute>
                  <CreateStationPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;

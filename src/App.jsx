import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WatchProvider } from './context/WatchContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

import HomePage from './pages/HomePage';
import SingleMoviesPage from './pages/SingleMoviesPage';
import SeriesMoviesPage from './pages/SeriesMoviesPage';
import WatchMoviePage from './pages/WatchMoviePage';
import SearchPage from './pages/SearchPage';
import AccountPage from './pages/AccountPage';
import WatchPartyLobbyPage from './pages/WatchPartyLobbyPage';
import WatchPartyRoomPage from './pages/WatchPartyRoomPage';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <WatchProvider>
          <div className="flex flex-col min-h-screen bg-dark-bg text-gray-100">
            {/* Navigation Header */}
            <Navbar />

            {/* Main Content Area */}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/phim-moi" element={<SingleMoviesPage />} />
                <Route path="/phim-le" element={<SingleMoviesPage />} />
                <Route path="/phim-bo" element={<SeriesMoviesPage />} />
                <Route path="/phim/:slug" element={<WatchMoviePage />} />
                <Route path="/xem-chung" element={<WatchPartyLobbyPage />} />
                <Route path="/xem-chung/:roomId" element={<WatchPartyRoomPage />} />
                <Route path="/tim-kiem" element={<SearchPage />} />
                <Route path="/tai-khoan" element={<AccountPage />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />

            {/* Global Authentication Modal */}
            <AuthModal />
          </div>
        </WatchProvider>
      </AuthProvider>
    </Router>
  );
}

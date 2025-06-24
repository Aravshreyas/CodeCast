import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Header from './components/Header';
import Classroom from './pages/Classroom'; // Import Classroom page

function App() {
  return (
    <AppProvider>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
        <Router>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/classroom/:sessionId" element={<Classroom />} /> {/* Add classroom route */}
            </Routes>
          </main>
        </Router>
      </div>
    </AppProvider>
  );
}

export default App;
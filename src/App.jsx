import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Home from './components/Home/Home';
import Background from './components/Background/Background';
import PhyloBackground from './components/Background/PhyloBackground';
import CV from './components/CV/CV';
import About from './components/About/About';
import Contact from './components/Contact/Contact';
import Projects from './components/Projects/Projects';
import ESPM112L from './components/ESPM112L/ESPM112L';
import ESPM112L2021 from './components/ESPM112L/ESPM112L2021';
import ESPM112L2023 from './components/ESPM112L/ESPM112L2023';
import PostView from './components/ESPM112L/PostView';
import './App.css';

function BackgroundSelector() {
  const location = useLocation();
  const isESPMPage = location.pathname.includes('espm112l') || location.pathname.includes('_posts');
  return isESPMPage ? <PhyloBackground /> : <Background />;
}

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <Home />
                <CV />
              </>
            } />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/espm112l" element={<ESPM112L />} />
            <Route path="/espm112l-2021" element={<ESPM112L2021 />} />
            <Route path="/espm112l-2023" element={<ESPM112L2023 />} />
            <Route path="/posts/:slug" element={<PostView />} />
          </Routes>
        </main>
        <BackgroundSelector />
      </div>
    </Router>
  );
}

export default App;

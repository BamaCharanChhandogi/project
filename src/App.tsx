// App.tsx (unchanged from previous example)
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ChairConfigurator } from './components/ChairConfigurator';
import { ARRedirect } from './components/ARRedirect';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Routes>
          <Route path="/" element={<ChairConfigurator />} />
          <Route path="/ar" element={<ARRedirect />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
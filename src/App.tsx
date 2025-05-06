import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ChairConfigurator } from './components/ChairConfigurator';
import { ARViewer } from './components/ARRedirect';
import App2 from './components/App2';
import App3 from './components/ChairModel';
import Hoodie from './components/HoodieExperience';
import { Navbar } from './components/Navbar';
import Learn  from './components/Learn';

const App = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="flex-1 w-full h-full">
          <Routes>
            <Route path="/" element={<ChairConfigurator />} />
            <Route path="/ar" element={<ARViewer />} />
            <Route path="/model/glove" element={<App2 />} />
            <Route path="/model/chair" element={<App3 />} />
            <Route path="/model/hoodie" element={<Hoodie />} />
            <Route path="/model/learn" element={<Learn />} />
            <Route path="/ar-fallback" element={<div>AR failed...</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
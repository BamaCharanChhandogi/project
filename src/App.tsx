import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ChairConfigurator } from './components/ChairConfigurator';
import  {ARViewer}  from './components/ARRedirect';
import App2 from './components/App2';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Routes>
          <Route path="/" element={<ChairConfigurator />} />
          <Route path="/ar" element={<ARViewer />} />
          <Route path="/ar1" element={<App2 />} />
          <Route path="/ar-fallback" element={<div>AR failed...</div>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
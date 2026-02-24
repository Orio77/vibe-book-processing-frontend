
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UploadPDF from './components/UploadPDF';
import PDFList from './components/PDFList';
import PDFReader from './components/PDFReader';
import { Home, Upload } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-sans text-slate-800">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="font-bold text-xl text-blue-600">BookProcessing</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link to="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                  <Link to="/upload" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload PDF
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<PDFList />} />
            <Route path="/upload" element={<UploadPDF />} />
            <Route path="/read/:id" element={<PDFReader />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">3D Model Viewer</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                Home
              </Link>
              <Link to="/model/glove"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/model/glove') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                Glove Model
              </Link>
              <Link to="/model/chair"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/model/chair') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                Chair Model
              </Link>
              <Link to="/model/hoodie"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/model/chair') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                T-Shirts
              </Link>
              {/* <Link to="/ar"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/ar') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                AR View
              </Link> */}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/model/glove"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/model/glove') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setIsMenuOpen(false)}>
              Glove Model
            </Link>
            <Link to="/model/chair"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/model/chair') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setIsMenuOpen(false)}>
              Chair Model
            </Link>
            <Link to="/ar"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/ar') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setIsMenuOpen(false)}>
              AR View
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
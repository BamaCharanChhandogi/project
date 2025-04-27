import React, { useRef, Suspense, useState, useEffect } from "react";
const CustomDropdown = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    console.log("Dropdown options:", options); // Add this debug line
    console.log("Dropdown value:", value);    // Add this debug line
  
    useEffect(() => {
      function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
  
    return (
      <div className="relative w-[99%] ml-1" ref={dropdownRef}>
        <div
          className="w-full p-2 bg-[#b9c8ce] rounded-lg text-gray-500 flex justify-between items-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </div>
  
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#b9c8ce] rounded-lg z-10">
            {options.map((option) => (
              <div
                key={option}
                className="p-2 hover:bg-gray-300 cursor-pointer text-gray-500"
                onClick={() => {
                  onChange({ target: { value: option } });
                  setIsOpen(false);
                }}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  export default CustomDropdown;
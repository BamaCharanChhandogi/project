import Lottie from "lottie-react";
import React, { useRef, useEffect, useState } from "react";
import loadingAnimation from "./delta-loading.json"; // adjust path as needed

const VideoLoader = () => {
  const windowWidth = window.innerWidth;
  useEffect(() => {
    // First, add a style tag to the head to immediately hide all scrollbars
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      html, body {
        overflow: hidden !important;
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
      }
      
      /* Hide scrollbars for different browsers */
      ::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      
      * {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Clean up when component unmounts
    return () => {
      document.head.removeChild(styleElement);
      
      // Optional: restore scrolling when loader is removed
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  const getPositionStyles = () => {
    if (windowWidth >= 1536) {
      return { left: "70%", transform: "translate(-50%, -60%)" };
    } else if (windowWidth >= 1280) {
      return { left: "78%", transform: "translate(-50%, -55%)" };
    } else if (windowWidth >= 1024) {
      return { left: "50%", transform: "translate(-50%, -50%)" };
    } else {
      return { left: "50%", transform: "translate(-50%, -40%)" };
    }
  };

  const positionStyles = getPositionStyles();

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: positionStyles.left,
        transform: positionStyles.transform,
        width: windowWidth >= 768 ? "40vw" : "70vw",
        maxWidth: "200px",
        height: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
        overflow:"hidden"
      }}
    >
      <Lottie
        animationData={loadingAnimation}
        autoplay
        loop
        style={{
          width: "100%",
          height: "auto",
        }}
      />
    </div>
  );
};

export default VideoLoader;

// const VideoLoader = () => {
//     return (
//       <div style={{
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         width: '50%',
//         height: '50%',
//         display: 'flex',
//         justifyContent:'right',
//         alignItems: 'center',
//         background: 'rgba(0, 0, 0, 0.5)'
//       }}>
//         <video
//           autoPlay
//           loop
//           muted
//           playsInline
//           style={{
//             maxWidth: '100%',
//             maxHeight: '100%'
//           }}
//         >
//           <source src="/patterns/Delta Loading 1.mp4" type="video/mp4" />
//           Your browser does not support the video tag.
//         </video>
//       </div>
//     );
//   };
//   export default VideoLoader;

// const VideoLoader = () => {
//   return (
//     <div
//       style={{
//         position: "absolute",
//         top: "50%", // Center vertically
//         left: "50%", // Center horizontally
//         transform: "translate(-50%, -50%)", // Offset to truly center
//         width: "50vw", // Responsive width (adjust as needed)
//         maxWidth: "400px", // Optional: limit max size
//         height: "auto", // Maintain aspect ratio
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         background: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
//         zIndex: 10, // Ensure it’s above the canvas
//       }}
//     >
//       <video
//         autoPlay
//         loop
//         muted
//         playsInline
//         style={{
//           width: "100%",
//           height: "auto",
//           objectFit: "contain", // Ensure the video fits without distortion
//         }}
//       >
//         <source src="/patterns/Delta Loading 1.mp4" type="video/mp4" />
//         Your browser does not support the video tag.
//       </video>
//     </div>
//   );
// };

// export default VideoLoader;

const VideoLoader = () => {
    // Get the window dimensions to adjust positioning
    const windowWidth = window.innerWidth;
    
    // Dynamically calculate position based on screen size
    // These values should match your model positioning logic
    const getPositionStyles = () => {
      if (windowWidth >= 1536) { // 2xl breakpoint
        return {
          left: "70%", // Shifted right to match model position
          transform: "translate(-50%, -60%)"
        };
      } else if (windowWidth >= 1280) { // xl breakpoint
        return {
          left: "78%", // Slightly adjusted for xl screens
          transform: "translate(-50%, -55%)"
        };
      } else if (windowWidth >= 1024) { // lg breakpoint
        return {
          left: "50%", // Center for medium screens
          transform: "translate(-50%, -50%)"
        };
      } else {
        return {
          left: "50%", // Centered for small screens
          transform: "translate(-50%, -40%)" // Slightly higher
        };
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
          width: windowWidth >= 768 ? "40vw" : "70vw", // Responsive width
          maxWidth: "500px",
          height: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
          mixBlendMode: "screen",
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: "50%",
            height: "auto",
            objectFit: "contain",
          }}
        >
          <source src="/patterns/Delta Loading 1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };
  
  export default VideoLoader;
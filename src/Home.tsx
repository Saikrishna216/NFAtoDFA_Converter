// Home.tsx
import { useEffect } from "react";
import "./Home.css"; // Import the CSS file

function Home() {
  useEffect(() => {
    // Add a class to the body to enable full-screen styling
    document.body.classList.add("home-page");
    return () => {
      // Remove the class when the component unmounts
      document.body.classList.remove("home-page");
    };
  }, []);

  return (
    <div className="home-container">
      <h2 className="home-title animate-fade-in">Welcome to the NFA to DFA Converter</h2>
      <p className="home-description animate-fade-in-delay">
        Use the navigation above to go to the converter page where you can input your NFA data and convert it to a DFA.
      </p>
    </div>
  );
}

export default Home;
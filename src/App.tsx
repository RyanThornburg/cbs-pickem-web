import ReactGA from "react-ga4";
import "./App.css";
import Dashboard from "./dashboard/Dashboard";

function App() {
  ReactGA.initialize("G-2BW7X4NL74");
  ReactGA.send({
    hitType: "pageview",
    page: "/",
    title: "Home",
  });
  return (
    <div className="App">
      <Dashboard></Dashboard>
    </div>
  );
}

export default App;

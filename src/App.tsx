import ReactGA from "react-ga4";
import "./App.css";
import Dashboard from "./dashboard/Dashboard";
import { CurrentWeekProvider } from "./dashboard/components/CurrentWeekContext";

function App() {
  ReactGA.initialize("G-2BW7X4NL74");
  ReactGA.send({
    hitType: "pageview",
    page: "/",
    title: "Home",
  });
  return (
    <div className="App">
      <CurrentWeekProvider>
        <Dashboard />
      </CurrentWeekProvider>
    </div>
  );
}

export default App;

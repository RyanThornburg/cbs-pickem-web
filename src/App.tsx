import ReactGA from "react-ga4";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Dashboard from "./dashboard/Dashboard";
import { CurrentWeekProvider } from "./dashboard/components/CurrentWeekContext";
import { getInitialTab } from "./dashboard/utils/defaultTab";

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
        <BrowserRouter>
          <Routes>
            <Route path="/:tab" element={<Dashboard />} />
            <Route path="/" element={<Navigate to={`/${getInitialTab()}`} replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CurrentWeekProvider>
    </div>
  );
}

export default App;

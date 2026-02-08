import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Albums from "./pages/Albums";
import Diary from "./pages/Diary";
import Anniversary from "./pages/Anniversary";
import Tasks from "./pages/Tasks";
import Messages from "./pages/Messages";
import Mood from "./pages/Mood";
import Wishes from "./pages/Wishes";
import TimeCapsule from "./pages/TimeCapsule";
import Footprints from "./pages/Footprints";
import TodoList from "./pages/TodoList";
import Pair from "./pages/Pair";
import Settings from "./pages/Settings";
import Timeline from "./pages/Timeline";
import Achievements from "./pages/Achievements";
import HundredThings from "./pages/HundredThings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/pair" component={Pair} />
      <Route path="/albums" component={Albums} />
      <Route path="/diary" component={Diary} />
      <Route path="/anniversary" component={Anniversary} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/messages" component={Messages} />
      <Route path="/mood" component={Mood} />
      <Route path="/wishes" component={Wishes} />
      <Route path="/time-capsule" component={TimeCapsule} />
      <Route path="/footprints" component={Footprints} />
      <Route path="/todo-list" component={TodoList} />
      <Route path="/settings" component={Settings} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/hundred-things" component={HundredThings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

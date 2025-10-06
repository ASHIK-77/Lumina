import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Donors from "@/pages/categories/Donors";
import Volunteers from "@/pages/categories/Volunteers";
import NGOs from "@/pages/categories/NGOs";
import Businesses from "@/pages/categories/Businesses";
import Medical from "@/pages/categories/Medical";
import Farmers from "@/pages/categories/Farmers";
import Clothing from "@/pages/categories/Clothing";
import Events from "@/pages/categories/Events";
import Homes from "@/pages/categories/Homes";
import Disaster from "@/pages/categories/Disaster";
import Developers from "@/pages/categories/Developers";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/donors" component={Donors} />
      <Route path="/volunteers" component={Volunteers} />
      <Route path="/ngos" component={NGOs} />
      <Route path="/businesses" component={Businesses} />
      <Route path="/medical" component={Medical} />
      <Route path="/farmers" component={Farmers} />
      <Route path="/clothing" component={Clothing} />
      <Route path="/events" component={Events} />
      <Route path="/homes" component={Homes} />
      <Route path="/disaster" component={Disaster} />
      <Route path="/developers" component={Developers} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

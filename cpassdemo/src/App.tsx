import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignupProvider } from "@/context/SignupContext";
import Index from "./pages/Index";
import WorkerDashboard from "./pages/WorkerDashboard";
import TVETDashboard from "./pages/TVETDashboard";
import TVETDashboardNew from "./pages/TVETDashboardNew";
import TVETLogin from "./pages/TVETLogin";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnershipLogin from "./pages/PartnershipLogin";
import PartnershipDashboard from "./pages/PartnershipDashboard";
import NotFound from "./pages/NotFound";
// Worker auth & signup
import WorkerLogin from "./pages/WorkerLogin";
import VerifyPhone from "./pages/signup/VerifyPhone";
import ConfirmInvite from "./pages/signup/ConfirmInvite";
import BasicInfo from "./pages/signup/BasicInfo";
import WorkSituation from "./pages/signup/WorkSituation";
import DomainSelection from "./pages/signup/DomainSelection";
import WorkContexts from "./pages/signup/WorkContexts";
import TaskSelection from "./pages/signup/TaskSelection";
import ProficiencyPrimer from "./pages/signup/ProficiencyPrimer";
import ProficiencyRating from "./pages/signup/ProficiencyRating";
import SignupSuccess from "./pages/signup/SignupSuccess";
// New unified worker dashboard
import WorkerDashboardNew from "./pages/dashboard/WorkerDashboardNew";
import WorkerDashboardDynamic from "./pages/WorkerDashboardDynamic";
import WorkerProfile from "./pages/WorkerProfile";

// Django
import WorkerLoginDjango from "./pages/WorkerLoginDjango";
import TVETLoginDjango from "./pages/TVETLoginDjango";
import SignupSuccessDjango from "./pages/signup/SignupSuccessDjango";
import PartnershipLoginDjango from "./pages/PartnershipLoginDjango";
import WorkerDashboardDynamicDjango from "./pages/WorkerDashboardDynamicDjango";
import WorkerProfileDjango from "./pages/WorkerProfileDjango";
import TVETDashboardNewDjango from "./pages/TVETDashboardNewDjango";
// Telegram Mini App
import BasicInfoTelegram from "./pages/signup/BasicInfoTelegram";
import WorkerDashboardTelegram from "./pages/WorkerDashboardTelegram";
import WorkerProfilePublic from "./pages/WorkerProfilePublic";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SignupProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* Django backend */}
            <Route path="/worker-login" element={<WorkerLoginDjango />} />
            <Route path="/signup/success" element={<SignupSuccessDjango />} />
            <Route path="/login/partnership" element={<PartnershipLoginDjango />} /> {/*TODO: This may need further review */}
            <Route path="/dashboard/worker/dynamic" element={<WorkerDashboardDynamicDjango />} />
            <Route path="/dashboard/worker/new" element={<WorkerProfileDjango />} />
            <Route path="/worker-profile/:userId" element={<WorkerProfilePublic />} />
            {/* Django TVET Dashboard - NEW */}
            <Route path="/dashboard/tvet-django" element={<TVETDashboardNewDjango />} />
            <Route path="/login/tvet-django" element={<TVETLoginDjango />} />

            {/* Telegram Mini App routes */}
            <Route path="/worker-dashboard-telegram" element={<WorkerDashboardTelegram />} />
            <Route path="/signup/basic-info-telegram" element={<BasicInfoTelegram />} />

            {/* Legacy worker dashboard */}
            <Route path="/worker" element={<WorkerDashboard />} />

            {/* <Route path="/dashboard/worker/dynamic" element={<WorkerDashboardDynamic />} /> */}
            {/* <Route path="/dashboard/worker/new" element={<WorkerProfile />} /> */}
            {/* Legacy TVET dashboard - SUPABASE VERSION (KEPT FOR REFERENCE) */}
            <Route path="/tvet" element={<TVETDashboard />} />

            {/* New TVET routes - SUPABASE VERSION (KEPT FOR REFERENCE) */}
            <Route path="/login/tvet" element={<TVETLogin />} /> {/* SUPABASE - Use /login/tvet-django for Django */}
            <Route path="/dashboard/tvet" element={<TVETDashboardNew />} /> {/* SUPABASE - Use /dashboard/tvet-django for Django */}

            <Route path="/partner" element={<PartnerDashboard />} />
            {/* New Partnership routes */}
            {/* <Route path="/login/partnership" element={<PartnershipLogin />} /> */} {/* TODO: Replaced by django */}
            <Route path="/dashboard/partnership" element={<PartnershipDashboard />} />
            {/* Worker login/signup */}
            {/* <Route path="/worker-login" element={<WorkerLogin />} /> */} {/* TODO: Replaced by django */}
            <Route path="/signup/verify-phone" element={<VerifyPhone />} />
            <Route path="/signup/confirm-invite" element={<ConfirmInvite />} />
            <Route path="/signup/basic-info" element={<BasicInfo />} />
            <Route path="/signup/work-situation" element={<WorkSituation />} />
            <Route path="/signup/domain-selection" element={<DomainSelection />} />
            <Route path="/signup/work-contexts" element={<WorkContexts />} />
            <Route path="/signup/task-selection" element={<TaskSelection />} />
            <Route path="/signup/proficiency-primer" element={<ProficiencyPrimer />} />
            <Route path="/signup/proficiency-rating" element={<ProficiencyRating />} />
            {/* <Route path="/signup/success" element={<SignupSuccess />} /> */} {/* TODO: Replaced by django */}
            {/* New unified worker dashboard */}
            <Route path="/dashboard/worker" element={<WorkerDashboardNew />} />
            {/* Profile routes - redirect to new dashboard */}
            <Route path="/profile/bronze" element={<WorkerDashboardNew />} />
            <Route path="/profile/silver" element={<WorkerDashboardNew />} />
            <Route path="/profile/gold" element={<WorkerDashboardNew />} />
            <Route path="/profile/platinum" element={<WorkerDashboardNew />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SignupProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
//A6C06D7C
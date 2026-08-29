import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import GuestHome from "@/pages/GuestHome";
import GuestBooking from "@/pages/GuestBooking";
import MyBookings from "@/pages/MyBookings";
import OwnerDashboard from "@/pages/OwnerDashboard";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<GuestHome />} />
            <Route path="/book/:eventTypeId" element={<GuestBooking />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/admin" element={<OwnerDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

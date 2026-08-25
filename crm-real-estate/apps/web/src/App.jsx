import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute, AdminRoute } from "./components/RouteGuards.jsx";
import Layout from "./components/Layout.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import ClientDetailPage from "./pages/ClientDetailPage.jsx";
import PropertiesPage from "./pages/PropertiesPage.jsx";
import PropertyDetailPage from "./pages/PropertyDetailPage.jsx";
import DealsPage from "./pages/DealsPage.jsx";
import DealsListPage from "./pages/DealsListPage.jsx";
import DealDetailPage from "./pages/DealDetailPage.jsx";
import TeamPage from "./pages/TeamPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/deals/list" element={<DealsListPage />} />
            <Route path="/deals/:id" element={<DealDetailPage />} />
            <Route
              path="/team"
              element={
                <AdminRoute>
                  <TeamPage />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

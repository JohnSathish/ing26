import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ROUTES } from './utils/constants';
import Home from './pages/Home';
import Login from './pages/Login';
import AboutUs from './pages/AboutUs';
import OurVision from './pages/OurVision';
import OurMission from './pages/OurMission';
import DonBosco from './pages/DonBosco';
import GC29 from './pages/GC29';
import Provincials from './pages/Provincials';
import ViceProvincial from './pages/ViceProvincial';
import Economer from './pages/Economer';
import ProvincialSecretary from './pages/ProvincialSecretary';
import Council from './pages/Council';
import Councillors2024_2025 from './pages/Councillors2024_2025';
import Dimension from './pages/Dimension';
import CommissionPage from './pages/CommissionPage';
import DiocesePage from './pages/DiocesePage';
import Circulars from './pages/Circulars';
import NewsLine from './pages/NewsLine';
import Gallery from './pages/Gallery';
import NewsDetail from './pages/NewsDetail';
import AllNews from './pages/AllNews';
import Province from './pages/Province';
import ProvincialMessagePage from './pages/ProvincialMessagePage';
import AdminDashboard from './pages/Admin/Dashboard';
import BirthdayManagement from './pages/Admin/BirthdayManagement';
import NewsManagement from './pages/Admin/NewsManagement';
import MessagesManagement from './pages/Admin/MessagesManagement';
import HousesManagement from './pages/Admin/HousesManagement';
import BannersManagement from './pages/Admin/BannersManagement';
import HeroSliderManagement from './pages/Admin/HeroSliderManagement';
import CircularsManagement from './pages/Admin/CircularsManagement';
import NewsLineManagement from './pages/Admin/NewsLineManagement';
import GalleryManagement from './pages/Admin/GalleryManagement';
import ProvincialsManagement from './pages/Admin/ProvincialsManagement';
import CouncilManagement from './pages/Admin/CouncilManagement';
import CommissionsManagement from './pages/Admin/CommissionsManagement';
import QuickLinksManagement from './pages/Admin/QuickLinksManagement';
import CollaborationsManagement from './pages/Admin/CollaborationsManagement';
import SettingsManagement from './pages/Admin/SettingsManagement';
import StrennaManagement from './pages/Admin/StrennaManagement';
import './App.css';
import './styles/design-system.css';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}

// Admin Route Component (requires admin role)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { authenticated, loading, user } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (user?.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.ABOUT_US} element={<AboutUs />} />
      <Route path={ROUTES.OUR_VISION} element={<OurVision />} />
      <Route path={ROUTES.OUR_MISSION} element={<OurMission />} />
      <Route path={ROUTES.DON_BOSCO} element={<DonBosco />} />
      <Route path={ROUTES.GC29} element={<GC29 />} />
      <Route path={ROUTES.PROVINCIALS} element={<Provincials />} />
      <Route path={ROUTES.VICE_PROVINCIAL} element={<ViceProvincial />} />
      <Route path={ROUTES.ECONOMER} element={<Economer />} />
      <Route path={ROUTES.PROVINCIAL_SECRETARY} element={<ProvincialSecretary />} />
      <Route path={ROUTES.COUNCIL} element={<Council />} />
      <Route path={ROUTES.COUNCILLORS_2024_2025} element={<Councillors2024_2025 />} />
      <Route path={ROUTES.DIMENSION} element={<Dimension />} />
      <Route path={ROUTES.COMMISSION_SCHOOL_EDUCATION} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_HIGHER_EDUCATION} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_NON_FORMAL} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_YOUTH_AT_RISK} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_MIGRANTS_DESK} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_YOUTH_CENTRE} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_SCOUTS_GUIDE} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_HOSTEL_BOARDING} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_SPORTS_ACADEMY} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_FORMATION} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_SALESIAN_FAMILY} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_COOPERATORS_ADMA} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_PAST_PUPIL} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_SOCIAL_COMMUNICATION} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_PROTECTOR_MINOR} element={<CommissionPage />} />
      <Route path={ROUTES.COMMISSION_ECOLOGY} element={<CommissionPage />} />
      <Route path={ROUTES.DIOCESE_BONGAIGAON} element={<DiocesePage />} />
      <Route path={ROUTES.DIOCESE_DIPHU} element={<DiocesePage />} />
      <Route path={ROUTES.DIOCESE_GUWAHATI} element={<DiocesePage />} />
      <Route path={ROUTES.DIOCESE_NONGSTOIN} element={<DiocesePage />} />
      <Route path={ROUTES.DIOCESE_TEZPUR} element={<DiocesePage />} />
      <Route path={ROUTES.DIOCESE_TURA} element={<DiocesePage />} />
      <Route path={ROUTES.CIRCULARS} element={<Circulars />} />
      <Route path={ROUTES.NEWSLINE} element={<NewsLine />} />
      <Route path={ROUTES.GALLERY} element={<Gallery />} />
      <Route path="/news/:slug" element={<NewsDetail />} />
      <Route path={ROUTES.ALL_NEWS} element={<AllNews />} />
      <Route path={ROUTES.PROVINCE} element={<Province />} />
      <Route path={ROUTES.PROVINCIAL_MESSAGE} element={<ProvincialMessagePage />} />
      <Route
        path={ROUTES.ADMIN.DASHBOARD}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.BIRTHDAY}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <BirthdayManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.NEWS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <NewsManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.MESSAGES}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <MessagesManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.HOUSES}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <HousesManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.BANNERS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <BannersManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.HERO_SLIDER}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <HeroSliderManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.CIRCULARS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <CircularsManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.NEWSLINE}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <NewsLineManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.GALLERY}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <GalleryManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.PROVINCIALS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <ProvincialsManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.COUNCIL}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <CouncilManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.COMMISSIONS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <CommissionsManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.QUICK_LINKS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <QuickLinksManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.COLLABORATIONS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <CollaborationsManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.SETTINGS}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <SettingsManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.STRENNA}
        element={
          <ProtectedRoute>
            <AdminRoute>
              <StrennaManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

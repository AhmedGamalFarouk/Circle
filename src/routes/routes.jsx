import { createBrowserRouter, RouterProvider } from "react-router";
import { lazy, Suspense } from "react";
// Components
import RootLayout from "../layouts/RootLayout";
import { useAuth } from "../hooks/useAuth";
import CirclesRequistsContainer from "../pages/CirclesRequests/CirclesRequestsContainer";
import { useLocation } from "react-router";
import { Navigate } from "react-router";
// Lazy loaded components with dynamic imports
const AboutUs = lazy(() => import("../pages/AboutUs/AboutUs"));
const Payments = lazy(() => import("../pages/Payments/PaymentContainer"));
const LandingPage = lazy(() => import("../pages/Landing/LandingContainer"));
const Notfound = lazy(() => import("../pages/Notfound/Notfound.jsx"));
const ForgetPassword = lazy(
  () =>
    import(
      "../pages/Authentication/ForgetPasswordPage/ForgetPasswordContainer"
    ),
);
const LoginPage = lazy(
  () => import("../pages/Authentication/LoginPage/LoginPage"),
);
const RegisterPage = lazy(
  () => import("../pages/Authentication/RegisterPage/RegisterPage"),
);
const EventsContainer = lazy(() => import("../pages/Events/EventsContainer"));
const PaymentSuccess = lazy(() => import("../pages/Payments/Success"));
const PaymentFailure = lazy(() => import("../pages/Payments/Cancel"));
const Explore = lazy(() => import("../pages/Explore/Explore"));
const ProfileContainer = lazy(
  () => import("../pages/ProfilePage/ProfileContainer.jsx"),
);
const Memories = lazy(() => import("../pages/Memories"));
const CirclesPageContainer = lazy(
  () => import("../pages/CirclesPage/CirclesPageContainer.jsx"),
);
const CirclePageContainer = lazy(
  () => import("../pages/CirlclePage/CirclePageContainer.jsx"),
);
const MemoryUploadPage = lazy(
  () => import("../pages/Memories/AddMemories.jsx"),
);

// Simple wrapper component for lazy-loaded routes
const LazyWrapper = ({ children }) => (
  <Suspense fallback={<div />}>{children}</Suspense>
);

function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children;
}
const routes = createBrowserRouter([
  {
    path: "/login",
    element: (
      <LazyWrapper>
        <LoginPage />
      </LazyWrapper>
    ),
  },
  {
    path: "/register",
    element: (
      <LazyWrapper>
        <RegisterPage />
      </LazyWrapper>
    ),
  },
  {
    path: "/forget-password",
    element: (
      <LazyWrapper>
        <ForgetPassword />
      </LazyWrapper>
    ),
  },
  {
    path: "/success",
    element: (
      <LazyWrapper>
        <PaymentSuccess />
      </LazyWrapper>
    ),
  },
  {
    path: "/cancel",
    element: (
      <LazyWrapper>
        <PaymentFailure />
      </LazyWrapper>
    ),
  },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <LazyWrapper>
            <LandingPage />
          </LazyWrapper>
        ),
      },
      {
        path: "circles",
        element: (
          <ProtectedRoute>
            <LazyWrapper>
              <CirclesPageContainer />
            </LazyWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "circles/:circleId",
        element: (
          <ProtectedRoute>
            <LazyWrapper>
              <CirclePageContainer />
            </LazyWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "payments",
        element: (
          <LazyWrapper>
            <Payments />
          </LazyWrapper>
        ),
      },
      {
        path: "events",
        element: (
          <ProtectedRoute>
            <LazyWrapper>
              <EventsContainer />
            </LazyWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "about",
        element: (
          <LazyWrapper>
            <AboutUs />
          </LazyWrapper>
        ),
      },
      {
        path: "explore",
        element: (
          <LazyWrapper>
            <Explore />
          </LazyWrapper>
        ),
      },
      // "events/:cirlceId/:eventId/memories"
      {
        path: "circles/:circleId/memories",
        element: (
          <ProtectedRoute>
            <LazyWrapper>
              <Memories />
            </LazyWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "circles/:circleId/memories/add",
        element: (
          <ProtectedRoute>
            <LazyWrapper>
              <MemoryUploadPage />
            </LazyWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "circles-requests",
        element: (
          <ProtectedRoute>
            <LazyWrapper>
              <CirclesRequistsContainer />
            </LazyWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile/:profileId",
        element: (
          <ProtectedRoute>
            <LazyWrapper>
              <ProfileContainer />
            </LazyWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: (
          <LazyWrapper>
            <Notfound />
          </LazyWrapper>
        ),
      },
    ],
  },
]);

export default function RoutesPages() {
  return <RouterProvider router={routes} />;
}

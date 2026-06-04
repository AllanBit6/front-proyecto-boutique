import { createBrowserRouter } from "react-router-dom"

import { AppLayout } from "@/layouts/AppLayout"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage"
import { featureRoutes } from "@/features/featureRoutes"
import { NotFoundPage } from "@/pages/NotFoundPage"
import {
  HomeRedirect,
  ProtectedRoute,
  RoleProtectedRoute,
} from "@/route-guards"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
      {
        path: "/",
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <HomeRedirect />,
          },
          ...featureRoutes.map((route) => ({
            path: route.path,
            element: <RoleProtectedRoute route={route} />,
          })),
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
])

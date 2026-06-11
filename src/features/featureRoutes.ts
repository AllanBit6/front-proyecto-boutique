import { ajustesRoutes } from "@/features/ajustes/routes/ajustesRoutes"
import { authRoutes } from "@/features/auth/routes/authRoutes"
import { cajaRoutes } from "@/features/caja/routes/cajaRoutes"
import { cajeroRoutes } from "@/features/cajero/routes/cajeroRoutes"
import { comprasRoutes } from "@/features/compras/routes/comprasRoutes"
import { dashboardRoutes } from "@/features/dashboard/routes/dashboardRoutes"
import { inventarioRoutes } from "@/features/inventario/routes/inventarioRoutes"
import { reporteriaRoutes } from "@/features/reporteria/routes/reporteriaRoutes"
import { usuariosRoutes } from "@/features/usuarios/routes/usuariosRoutes"
import { ventasRoutes } from "@/features/ventas/routes/ventasRoutes"

export const featureRoutes = [
  ...dashboardRoutes,
  ...cajeroRoutes,
  ...cajaRoutes,
  ...usuariosRoutes,
  ...inventarioRoutes,
  ...ventasRoutes,
  ...comprasRoutes,
  ...ajustesRoutes,
  ...reporteriaRoutes,
  ...authRoutes,
]

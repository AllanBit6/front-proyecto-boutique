export type Role = "admin" | "cashier"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  status: "active" | "inactive"
}

export interface Product {
  id: string
  sku: string
  name: string
  stock: number
  price: number
}

export interface Sale {
  id: string
  cashierId: string
  total: number
  createdAt: string
}

export interface Purchase {
  id: string
  supplierName: string
  total: number
  createdAt: string
}

export interface CashRegister {
  id: string
  cashierId: string
  openedAt: string
  closedAt?: string
  openingAmount: number
  closingAmount?: number
}

import { storage, CurrentUser, CustomerAccount, ServiceAccount, DistributorAccount, FactoryAccount } from '../store'

type Account = CustomerAccount | ServiceAccount | DistributorAccount | FactoryAccount

export function getAccountsByRole<T = Account>(role: string): T[] {
  return storage.getAccounts<T>(role)
}

export function getCurrentUser(): CurrentUser | null {
  return storage.getCurrentUser()
}

export function loginAs(role: CurrentUser['role'], account: Account): void {
  storage.setCurrentUser({
    role,
    id: account.id,
    name: account.name,
    phone: account.phone,
  })
}

export function logout(): void {
  storage.clearCurrentUser()
}

export function isLoggedInAs(role: string): boolean {
  const user = storage.getCurrentUser()
  return user !== null && user.role === role
}

export function ensureSeedData(): void {
  storage.seedAccounts()
}

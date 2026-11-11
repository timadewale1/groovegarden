declare module '@paystack/inline-js' {
  type PaystackSuccess = {
    id: number
    reference: string
    message: string
  }

  type PaystackCallbacks = {
    key: string
    email: string
    amount: number
    currency: string
    reference: string
    phone?: string
    firstName?: string
    lastName?: string
    onSuccess: (transaction: PaystackSuccess) => void
    onCancel: () => void
    onError: (error: { message: string }) => void
  }

  export default class PaystackPop {
    newTransaction(options: PaystackCallbacks): void
  }
}

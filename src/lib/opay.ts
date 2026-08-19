/**
 * Unlike Paystack/Flutterwave's client-side inline widgets, OPay's checkout is server-initiated
 * — the backend already called OPay's cashier/create API and handed back a hosted checkoutUrl
 * (see InitializePaymentResult.checkoutUrl). All the frontend does is navigate the payer there;
 * OPay redirects back to /support?opay_reference=... afterwards, where AdminSupportView picks
 * the reference back up and calls confirm.
 */
export function redirectToOpayCheckout(checkoutUrl: string): void {
  window.location.href = checkoutUrl;
}

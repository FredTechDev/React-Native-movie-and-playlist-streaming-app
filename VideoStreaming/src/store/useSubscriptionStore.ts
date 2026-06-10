import { create } from 'zustand';
import { Subscription, SubscriptionPlan } from '../types';

interface SubscriptionState {
  subscription: Subscription;
  loading: boolean;
  error: string | null;
  
  purchasePlan: (
    plan: SubscriptionPlan, 
    paymentMethod: Subscription['paymentMethod'], 
    billingDetails: { email?: string; phoneNumber?: string }
  ) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  applyPromoCode: (code: string) => Promise<number>; // returns discount rate (0 to 1)
}

const DEFAULT_SUB: Subscription = {
  plan: 'FREE',
  status: 'ACTIVE',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days free trial
  paymentMethod: null,
  billingAmount: 0,
  autoRenew: false
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: DEFAULT_SUB,
  loading: false,
  error: null,

  purchasePlan: async (plan, paymentMethod, billingDetails) => {
    set({ loading: true, error: null });
    try {
      // Simulate API latency & processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      let amount = 0;
      switch (plan) {
        case 'BASIC': amount = 7.99; break;
        case 'PREMIUM': amount = 14.99; break;
        case 'FAMILY': amount = 19.99; break;
        case 'STUDENT': amount = 4.99; break;
        default: amount = 0;
      }

      // If M-Pesa is selected, simulate STK push trigger
      if (paymentMethod === 'MPESA') {
        if (!billingDetails.phoneNumber) {
          throw new Error('M-Pesa phone number is required');
        }
        // Simulated STK push
        console.log(`[M-Pesa] Triggered STK Push to ${billingDetails.phoneNumber} for KES ${amount * 130}`);
      }

      const newSubscription: Subscription = {
        plan,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod,
        billingAmount: amount,
        autoRenew: true
      };

      set({ subscription: newSubscription, loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Payment failed', loading: false });
      return false;
    }
  },

  cancelSubscription: async () => {
    set({ loading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { subscription } = get();
      set({
        subscription: {
          ...subscription,
          autoRenew: false,
          status: 'CANCELLED'
        },
        loading: false
      });
      return true;
    } catch {
      set({ error: 'Failed to cancel subscription', loading: false });
      return false;
    }
  },

  applyPromoCode: async (code) => {
    // Simulate promo codes: "CAMPUS70" = 70% off, "NETSTREAM10" = 10% off
    await new Promise(resolve => setTimeout(resolve, 500));
    if (code.toUpperCase() === 'CAMPUS70') return 0.7;
    if (code.toUpperCase() === 'NETSTREAM10') return 0.1;
    return 0;
  }
}));

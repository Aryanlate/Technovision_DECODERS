import { PlanType, StudentProfile } from '@opportunity-kit/shared';
import { getStoredProfile, saveStoredProfile } from './storage';
import { trackEvent } from './analytics';

export const PLAN_STORAGE_EVENT = 'opportunitykit_plan_changed';

export interface UsageStats {
  plan: PlanType;
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  isExceeded: boolean;
}

/**
 * Returns the current student's active plan.
 */
export function getUserPlan(): PlanType {
  const profile = getStoredProfile();
  return (profile.plan as PlanType) || 'free';
}

/**
 * Sets the current student's plan in storage and notifies components.
 */
export function setUserPlan(plan: PlanType): void {
  const profile = getStoredProfile();
  const updated: StudentProfile = {
    ...profile,
    plan
  };
  saveStoredProfile(updated);
  trackEvent('plan_changed', { plan });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PLAN_STORAGE_EVENT, { detail: { plan } }));
  }
}

/**
 * Retrieves monthly verification usage statistics.
 */
export function getUsageStats(): UsageStats {
  const profile = getStoredProfile();
  const plan = (profile.plan as PlanType) || 'free';
  const isUnlimited = plan === 'premium' || plan === 'college';
  const limit = isUnlimited ? Infinity : (profile.monthlyChecksLimit ?? 5);
  const used = profile.monthlyChecksUsed !== undefined ? profile.monthlyChecksUsed : 3;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);

  return {
    plan,
    used,
    limit: isUnlimited ? 9999 : limit,
    remaining,
    isUnlimited,
    isExceeded: !isUnlimited && used >= limit
  };
}

/**
 * Increments monthly opportunity checks count for the student.
 */
export function incrementUsage(): void {
  const profile = getStoredProfile();
  const current = profile.monthlyChecksUsed !== undefined ? profile.monthlyChecksUsed : 3;
  const updated: StudentProfile = {
    ...profile,
    monthlyChecksUsed: current + 1
  };
  saveStoredProfile(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('opportunitykit_usage_updated', { detail: { used: current + 1 } }));
  }
}

/**
 * Checks if the current plan has access to LLM agent features.
 */
export function canAccessAgentFeatures(): boolean {
  const plan = getUserPlan();
  return plan === 'premium' || plan === 'college';
}

/**
 * Mock Razorpay checkout payload & processor.
 * Structured with order ID, currency, and signature simulation
 * so live Razorpay keys can be plugged in seamlessly.
 */
export interface MockRazorpayOrder {
  orderId: string;
  amount: number;
  currency: 'INR';
  plan: PlanType;
  customerName: string;
  customerEmail: string;
}

export async function processMockPayment(
  plan: PlanType,
  amountInr: number,
  billingCycle: 'monthly' | 'annual' = 'monthly'
): Promise<{ success: boolean; transactionId: string; orderId: string }> {
  const profile = getStoredProfile();
  const orderId = `order_SETU_${Date.now()}`;
  const transactionId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;

  // Simulate network roundtrip (300ms)
  await new Promise((resolve) => setTimeout(resolve, 350));

  // Activate the plan
  setUserPlan(plan);

  trackEvent('payment_success', {
    plan,
    amountInr,
    billingCycle,
    orderId,
    transactionId,
    studentName: profile.name
  });

  return {
    success: true,
    transactionId,
    orderId
  };
}

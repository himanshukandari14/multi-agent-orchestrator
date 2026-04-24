import { API_BASE } from "@/lib/api";

export type ApiPlan = {
  slug: string;
  name: string;
  description: string | null;
  monthly_credits: number;
  price_cents: number;
  currency: string;
};

export type BillingMeResponse = {
  user: {
    id: string;
    github_login: string;
    email: string | null;
    credit_balance: number;
    dodo_customer_id: string | null;
  };
  subscription: {
    status: string;
    plan: {
      slug: string;
      name: string;
      monthly_credits: number;
    } | null;
    dodo_subscription_id: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
};

export async function fetchBillingPlans(): Promise<ApiPlan[]> {
  const res = await fetch(`${API_BASE}/billing/plans`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Plans: ${res.status}`);
  }
  const data = (await res.json()) as { plans: ApiPlan[] };
  return data.plans;
}

export async function fetchBillingMe(token: string): Promise<BillingMeResponse> {
  const res = await fetch(`${API_BASE}/billing/me`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Billing profile: ${res.status}`);
  }
  return res.json() as Promise<BillingMeResponse>;
}

export async function startCheckout(
  token: string,
  planSlug: "pro" | "pro_plus"
): Promise<{ checkout_url: string }> {
  const res = await fetch(`${API_BASE}/billing/checkout`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan_slug: planSlug }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Checkout: ${res.status}`);
  }
  return res.json() as Promise<{ checkout_url: string }>;
}

export function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

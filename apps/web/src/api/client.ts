import {
  Strategy,
  Rule,
  CreateStrategyPayload,
  PatchStrategyPayload,
  CreateRulePayload,
} from '@matchiq/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    throw new Error(`[${res.status}] ${await res.text()}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export const api = {
  getStrategies: (token: string | null) => request<Strategy[]>('/strategies', token),

  getStrategy: (token: string | null, id: string) => request<Strategy>(`/strategies/${id}`, token),

  createStrategy: (token: string | null, body: CreateStrategyPayload) =>
    request<Strategy>('/strategies', token, { method: 'POST', body: JSON.stringify(body) }),

  patchStrategy: (token: string | null, id: string, body: PatchStrategyPayload) =>
    request<Strategy>(`/strategies/${id}`, token, { method: 'PATCH', body: JSON.stringify(body) }),

  getRules: (token: string | null, strategyId: string) =>
    request<Rule[]>(`/strategies/${strategyId}/rules`, token),

  createRule: (token: string | null, strategyId: string, body: CreateRulePayload) =>
    request<Rule>(`/strategies/${strategyId}/rules`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteRule: (token: string | null, ruleId: string) =>
    request<void>(`/rules/${ruleId}`, token, { method: 'DELETE' }),
};

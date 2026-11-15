import axios, { AxiosError } from 'axios';

/**
 * Klien endpoint billing internal (session + CSRF).
 * Tidak memakai instance `@/api/http` karena base URL-nya `/api/client`.
 */

export interface CheckoutSession {
    order_uuid: string;
    invoice: string;
    amount: number;
    reference: string;
    qr_url: string | null;
    qr_string: string | null;
    status: string;
    expires_at: string | null;
    status_url: string;
    success_url: string;
}

export interface OrderStatus {
    order_uuid: string;
    status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
    paid_at: string | null;
    amount: number;
    invoice: string | null;
    plan: string | null;
    expires_at: string | null;
    qr_url: string | null;
    qr_string: string | null;
}

export interface BillingInvoice {
    id: string;
    planName: string;
    amount: number;
    status: 'unpaid' | 'paid' | 'expired' | 'refunded';
    dueDate: string;
    paidAt: string | null;
    orderUuid: string | null;
}

const client = axios.create({
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

const csrfToken = (): string =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

const csrfHeader = (): Record<string, string> => ({
    'X-CSRF-TOKEN': csrfToken(),
});

export const createCheckoutSession = async (plan: string, cycle: string): Promise<CheckoutSession> => {
    const response = await client.post<CheckoutSession>(
        '/api/billing/checkout',
        { plan, cycle },
        { headers: csrfHeader() }
    );

    return response.data;
};

export const getOrderStatus = async (uuid: string): Promise<OrderStatus> => {
    const response = await client.get<OrderStatus>(`/api/billing/orders/${encodeURIComponent(uuid)}`);

    return response.data;
};

export const getInvoices = async (): Promise<BillingInvoice[]> => {
    const response = await client.get<{ data: BillingInvoice[] }>('/api/billing/invoices');

    return response.data.data ?? [];
};

export const billingErrorMessage = (error: unknown): string => {
    const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;

    if (axiosError?.response?.status === 419) {
        return 'Sesi kedaluwarsa. Muat ulang halaman lalu coba lagi.';
    }

    const validation = axiosError?.response?.data?.errors;

    if (validation) {
        const first = Object.values(validation)[0];

        if (Array.isArray(first) && first.length > 0) {
            return first[0];
        }
    }

    return axiosError?.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.';
};


/* ============================================================
 * Benefit & self-service create server
 * ============================================================ */

export interface BenefitServer {
    id: number | null;
    server_id: number | null;
    identifier: string | null;
    uuid: string | null;
    name: string;
    status: string;
    created_at: string | null;
}

export interface BenefitSubscription {
    id: number;
    status: 'provisioning' | 'active' | 'suspended' | 'expired' | 'cancelled' | 'failed';
    is_expired: boolean;
    starts_at: string | null;
    expires_at: string | null;
    expires_at_label: string | null;
    days_remaining: number;
    expires_soon: boolean;
    period_days: number | null;
    period_progress: number | null;
    auto_renew: boolean;
    plan: {
        id: number;
        slug: string;
        name: string;
        tagline: string | null;
        specs: { cpu: string; ram: string; disk: string; bandwidth: string };
        limits: {
            server: number;
            backup: number;
            database: number;
            allocation: number;
            memory_mb: number;
            cpu_percent: number;
            disk_mb: number;
        };
        features: string[];
        price_monthly: number;
    } | null;
    slots: { total: number; used: number; remaining: number };
    servers: BenefitServer[];
    can_create: boolean;
    block_reason: string | null;
}

export interface BenefitSummary {
    subscriptions: BenefitSubscription[];
    has_subscription: boolean;
    can_create: boolean;
    server_slots: { total: number; used: number; remaining: number };
}

export const getBenefits = async (): Promise<BenefitSummary> => {
    const response = await client.get<BenefitSummary>('/api/billing/benefits');

    return response.data;
};

export interface CreateServerResult {
    ok: boolean;
    message: string;
    server: { id: number; name: string; identifier: string | null; uuid: string | null; status: string };
}

export const createBillingServer = async (name: string, subscriptionId?: number): Promise<CreateServerResult> => {
    const response = await client.post<CreateServerResult>(
        '/api/billing/create-server',
        { name, subscription_id: subscriptionId },
        { headers: csrfHeader() }
    );

    return response.data;
};

/**
 * Definisi paket (plan) yang dipakai halaman landing, pricing, dan dashboard user.
 *
 * Sumber data:
 *   1. `window.PanelPlans` — di-inject dari Blade (`partials/theme/plans-bootstrap.blade.php`).
 *      Nanti fase 2: diisi dari tabel `plans` lewat controller.
 *   2. Fallback statis di bawah supaya UI tetap jalan sebelum backend billing ada.
 */

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface Plan {
    slug: string;
    name: string;
    tagline: string;
    priceMonthly: number;
    /** Diskon dalam persen bila bayar tahunan. 0 = tanpa diskon. */
    yearlyDiscount?: number;
    featured?: boolean;
    ribbon?: string;
    stock?: number | null;
    specs: {
        cpu: string;
        ram: string;
        disk: string;
        bandwidth: string;
    };
    features: string[];
}

/** Statistik publik yang di-inject dari `templates/wrapper.blade.php`. */
export interface SystemStats {
    serversCount: number;
    usersCount: number;
    nestsCount: number;
    eggsCount: number;
    nodesCount: number;
}

/** Satu baris invoice pelanggan (fase 2: dari tabel `invoices`). */
export interface PanelInvoice {
    id: string;
    planName: string;
    amount: number;
    status: 'paid' | 'unpaid' | 'expired' | 'refunded';
    dueDate: string;
}

declare global {
    interface Window {
        PanelPlans?: Plan[];
        SystemStats?: SystemStats;
        PanelInvoices?: PanelInvoice[];
        PanelActivePlan?: string | null;
    }
}

export const FALLBACK_PLANS: Plan[] = [
    {
        slug: 'starter',
        name: 'Starter',
        tagline: 'Untuk bot, panel pribadi, dan server kecil.',
        priceMonthly: 15000,
        yearlyDiscount: 15,
        stock: 24,
        specs: { cpu: '1 vCPU', ram: '2 GB', disk: '10 GB NVMe', bandwidth: '1 TB' },
        features: [
            '1 server / 1 panel',
            'Unlimited sub-user',
            'Backup harian 3 slot',
            'DDoS protection dasar',
            'Support tiket 24 jam',
        ],
    },
    {
        slug: 'growth',
        name: 'Growth',
        tagline: 'Paling pas untuk komunitas dan server publik.',
        priceMonthly: 45000,
        yearlyDiscount: 20,
        featured: true,
        ribbon: 'Paling Laris',
        stock: 12,
        specs: { cpu: '3 vCPU', ram: '8 GB', disk: '40 GB NVMe', bandwidth: '4 TB' },
        features: [
            '3 server / 3 panel',
            'Backup harian 10 slot',
            'DDoS protection lanjutan',
            'Gratis 1 subdomain panel',
            'Prioritas support',
            'Auto-provisioning instan',
        ],
    },
    {
        slug: 'elite',
        name: 'Elite',
        tagline: 'Performa tinggi untuk server ramai & kebutuhan produksi.',
        priceMonthly: 120000,
        yearlyDiscount: 25,
        stock: 6,
        specs: { cpu: '6 vCPU', ram: '16 GB', disk: '100 GB NVMe', bandwidth: '10 TB' },
        features: [
            '10 server / 10 panel',
            'Backup harian 30 slot',
            'DDoS protection premium',
            'Dedicated IP opsional',
            'Prioritas support 1 jam',
            'Migrasi data gratis',
            'Akses API Application',
        ],
    },
];

export const getPlans = (): Plan[] => {
    const injected = typeof window !== 'undefined' ? window.PanelPlans : undefined;

    if (Array.isArray(injected) && injected.length > 0) {
        return injected;
    }

    return FALLBACK_PLANS;
};

export const formatIDR = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

export const billingCycleLabel = (cycle: BillingCycle): string => {
    switch (cycle) {
        case 'quarterly':
            return '3 bulan';
        case 'yearly':
            return 'tahun';
        default:
            return 'bulan';
    }
};

/** Total yang harus dibayar untuk siklus tertentu (sebelum promo tambahan). */
export const priceForCycle = (plan: Plan, cycle: BillingCycle): number => {
    switch (cycle) {
        case 'quarterly':
            return Math.round(plan.priceMonthly * 3 * 0.95);
        case 'yearly': {
            const discount = plan.yearlyDiscount ?? 0;
            return Math.round(plan.priceMonthly * 12 * (1 - discount / 100));
        }
        default:
            return plan.priceMonthly;
    }
};

/** Harga per bulan versi efektif, dipakai untuk badge "hemat X%". */
export const monthlyEquivalent = (plan: Plan, cycle: BillingCycle): number => {
    const total = priceForCycle(plan, cycle);
    const months = cycle === 'yearly' ? 12 : cycle === 'quarterly' ? 3 : 1;
    return Math.round(total / months);
};

export const savingsPercent = (plan: Plan, cycle: BillingCycle): number => {
    if (cycle === 'monthly') {
        return 0;
    }

    const baseline = plan.priceMonthly * (cycle === 'yearly' ? 12 : 3);
    const total = priceForCycle(plan, cycle);

    return Math.max(0, Math.round(((baseline - total) / baseline) * 100));
};

export const orderUrl = (plan: Plan, cycle: BillingCycle): string =>
    `/checkout?plan=${encodeURIComponent(plan.slug)}&cycle=${cycle}`;

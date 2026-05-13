import { LiabilityType } from '@/types';

export function cop(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

export function pct(value: number, decimals = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

export function fmtDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

export function fmtDateShort(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

export const typeLabels: Record<LiabilityType, string> = {
    mortgage:          'Hipoteca',
    personal_loan:     'Préstamo Personal',
    vehicle_loan:      'Crédito Vehículo',
    credit_card_loan:  'Crédito Tarjeta',
    cooperative_loan:  'Crédito Cooperativa',
    other:             'Otro',
};

export const typeColors: Record<LiabilityType, string> = {
    mortgage:          'blue',
    personal_loan:     'purple',
    vehicle_loan:      'indigo',
    credit_card_loan:  'red',
    cooperative_loan:  'green',
    other:             'gray',
};

/** French amortization formula: P * r / (1 - (1+r)^-n) */
export function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number, isEA = false): number {
    const r = isEA ? Math.pow(1 + annualRate, 1 / 12) - 1 : annualRate / 12;
    if (r === 0) return principal / termMonths;
    return principal * r / (1 - Math.pow(1 + r, -termMonths));
}

/** Generate amortization schedule client-side (mirrors backend). */
export function generateSchedule(
    principal: number,
    annualRate: number,
    termMonths: number,
    monthlyPayment: number,
    firstPaymentDate: string,
    isEA = false,
) {
    const r = isEA ? Math.pow(1 + annualRate, 1 / 12) - 1 : annualRate / 12;
    const schedule = [];
    let balance = principal;
    let date = new Date(firstPaymentDate + 'T00:00:00');

    for (let i = 1; i <= termMonths; i++) {
        const interest = balance * r;
        const principal_chunk = Math.min(monthlyPayment - interest, balance);
        const ending = Math.max(0, balance - principal_chunk);

        schedule.push({
            number: i,
            date: date.toISOString().slice(0, 10),
            beginning_balance: balance,
            payment: principal_chunk + interest,
            principal: principal_chunk,
            interest,
            ending_balance: ending,
        });

        balance = ending;
        date = new Date(date);
        date.setMonth(date.getMonth() + 1);
        if (balance < 0.01) break;
    }

    return schedule;
}

/** Simulate extra payments client-side. */
export function simulateExtra(
    schedule: ReturnType<typeof generateSchedule>,
    currentBalance: number,
    currentPaymentIdx: number,
    extraMonthly: number,
    lumpSum?: number,
    lumpSumDate?: string,
) {
    const remaining = schedule.slice(currentPaymentIdx);
    let balance = currentBalance;
    const newSched = [];
    let totalInterest = 0;
    let lumpApplied = false;

    for (const row of remaining) {
        if (!lumpApplied && lumpSum && lumpSumDate && row.date >= lumpSumDate) {
            balance = Math.max(0, balance - lumpSum);
            lumpApplied = true;
        }
        const r = row.beginning_balance > 0 ? row.interest / row.beginning_balance : 0;
        const interest = balance * r;
        const effectivePayment = Math.min(row.payment + extraMonthly, balance + interest);
        const principal = effectivePayment - interest;
        const ending = Math.max(0, balance - principal);
        totalInterest += interest;

        newSched.push({ ...row, beginning_balance: balance, interest, principal, payment: effectivePayment, ending_balance: ending });
        balance = ending;
        if (balance < 0.01) break;
    }

    const origPayoff = remaining.length > 0 ? remaining[remaining.length - 1].date : '';
    const newPayoff = newSched.length > 0 ? newSched[newSched.length - 1].date : '';
    const origInterest = remaining.reduce((s, r) => s + r.interest, 0);
    const monthsSaved = remaining.length - newSched.length;

    return { newSched, totalInterest, origInterest, monthsSaved, newPayoff, origPayoff };
}

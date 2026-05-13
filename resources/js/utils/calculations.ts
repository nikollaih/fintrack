export function calculateProjectedInterest(
    balance: number,
    rateEA: number,
    months: number,
): number {
    return balance * (Math.pow(1 + rateEA, months / 12) - 1);
}

export function getCycleROI(revenue: number, expenses: number): number {
    if (expenses === 0) return 0;
    return ((revenue - expenses) / expenses) * 100;
}

export function calculateCashback(amount: number, cashbackRate: number): number {
    return amount * cashbackRate;
}

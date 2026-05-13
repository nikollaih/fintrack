// ── Retirement Planner ────────────────────────────────────────────────
export interface RetirementPlan {
    id?: string;
    current_age: number;
    target_retirement_age: number;
    expected_monthly_expense_at_retirement: number;
    life_expectancy: number;
    expected_annual_inflation_rate: number;
    expected_portfolio_return_rate: number;
    expected_retirement_return_rate: number;
    monthly_contribution: number;
    include_agro_income: boolean;
    agro_monthly_equivalent: number | null;
    notes: string | null;
    years_to_retirement: number;
    retirement_years: number;
    total_monthly_contribution: number;
}

export interface RetirementScenario {
    return_rate: number;
    projected_corpus: number;
    meets_goal: boolean;
    gap: number;
    gap_pct: number;
    required_contribution: number;
    passive_income_perp: number;
    passive_income_25y: number;
    passive_income_30y: number;
    projected_retirement_age: number;
}

export interface RetirementChartPoint {
    age: number;
    portfolio: number;
    required: number;
    target: number;
}

export interface RetirementAssetProjection {
    name: string;
    type: string;
    current_balance: number;
    projected_at_retirement: number;
    pct_of_corpus: number;
    pct_of_total: number;
}

export interface RetirementCalculations {
    required_corpus: number;
    required_corpus_real: number;
    monthly_expense_at_retirement: number;
    projected_corpus: number;
    gap_amount: number;
    gap_pct: number;
    on_track: boolean;
    projected_retirement_age: number;
    required_monthly_contribution: number;
    monthly_passive_income_perp: number;
    monthly_passive_income_25y: number;
    monthly_passive_income_30y: number;
    scenarios: {
        conservative: RetirementScenario;
        moderate: RetirementScenario;
        optimistic: RetirementScenario;
    };
    chart_data: RetirementChartPoint[];
    asset_projections: RetirementAssetProjection[];
    agro_impact: {
        improved_retirement_age: number;
        without_retirement_age: number;
        years_earlier: number;
        improved_corpus: number;
        agro_monthly_equivalent: number;
    } | null;
    action_plan: string[];
}

export interface RetirementPortfolio {
    total: number;
    assets: Array<{ id: string; name: string; type: string; rate_ea: number | null; balance: number }>;
}

export interface RetirementSnapshotRecord {
    snapshot_date: string;
    total_portfolio_value: number;
    required_corpus: number;
    gap: number;
    projected_retirement_age: number;
    on_track: boolean;
}

// ── Report ────────────────────────────────────────────────────────────
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface Report {
    id: string;
    year: number;
    month: number;
    label: string;
    status: ReportStatus;
    file_size_human: string;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export type CategoryType = 'expense' | 'income' | 'agro' | 'both';

export interface Category {
    id: string;
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
    is_predefined: boolean;
    is_active: boolean;
    sort_order: number;
}

export interface Tenant {
    id: string;
    name: string;
    email: string;
    plan: 'free' | 'pro';
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    tenant_id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

export type AssetType = 'cajita' | 'cdt' | 'cooperativa' | 'cash' | 'other';

export interface Asset {
    id: string;
    type: AssetType;
    name: string;
    initial_balance: number;
    start_date: string;
    rate_ea: number | null;
    compounding_frequency: 'daily' | 'monthly' | 'at_maturity';
    maturity_date: string | null;
    notes: string | null;
    // Server-computed (present when loaded with computation)
    balance?: number;
    interest_earned?: number;
    interest_this_month?: number;
    maturity_value?: number;
    days_to_maturity?: number | null;
    created_at: string;
    updated_at: string;
}

export interface AssetMovement {
    id: string;
    asset_id: string;
    date: string;
    amount: number;
    note: string | null;
    created_at: string;
}

export interface ProjectionPoint {
    date: string;
    balance: number;
    is_projection: boolean;
}

export interface PortfolioProjectionPoint {
    date: string;
    total: number;
    is_projection: boolean;
    [assetId: string]: number | boolean | string;
}

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'debit' | 'credit_card';

export interface Transaction {
    id: string;
    account_id: string | null;
    account?: { id: string; name: string; type: AccountType };
    category_id: string | null;
    category?: Category | null;
    category_text?: string | null;
    type: TransactionType;
    amount: number;
    category: string;
    description: string | null;
    date: string;
    payment_method: PaymentMethod;
    cashback_rate: number;
    created_at: string;
}

export type SupplierCategory = 'seeds' | 'fertilizer' | 'pesticide' | 'labor' | 'other';

export interface Supplier {
    id: string;
    name: string;
    category: SupplierCategory;
    phone: string | null;
    notes: string | null;
    created_at: string;
}

export type BuyerType = 'plaza' | 'restaurant' | 'intermediary' | 'direct' | 'other';

export interface Buyer {
    id: string;
    name: string;
    type: BuyerType;
    phone: string | null;
    location: string | null;
    notes: string | null;
    created_at: string;
}

export type CropStatus = 'planned' | 'active' | 'harvested' | 'failed';
export type CropPhase = 'preparation' | 'sowing' | 'maintenance' | 'harvest';

export interface CropCycle {
    id: string;
    crop_type: string;
    area_sqm: number;
    location: string;
    sown_at: string;
    expected_harvest_at: string | null;
    harvested_at: string | null;
    status: CropStatus;
    notes: string | null;
    expenses?: CropExpense[];
    sales?: CropSale[];
    total_expenses: number | null;
    total_revenue: number | null;
    profit: number | null;
    created_at: string;
    updated_at: string;
}

export interface CropExpense {
    id: string;
    cycle_id: string;
    supplier_id: string | null;
    supplier?: Supplier;
    category_id: string | null;
    category?: Category | null;
    category_text?: string | null;
    phase: CropPhase;
    description: string | null;
    amount: number;
    expense_date: string;
    created_at: string;
}

export interface CropSale {
    id: string;
    cycle_id: string;
    buyer_id: string | null;
    buyer?: Buyer;
    quantity: number;
    unit: string;
    unit_price: number;
    total: number;
    sale_date: string;
    notes: string | null;
    created_at: string;
}

export interface MonthlySummary {
    month: string;
    income: number;
    expenses: number;
}

export interface DashboardSummary {
    total_assets: number;
    monthly_income: number;
    monthly_expenses: number;
    net_balance: number;
}

export interface PaginatedResource<T> {
    data: T[];
    links: unknown;
    meta: unknown;
}

export interface FixedExpenseCheck {
    id: string;
    fixed_expense_id: string;
    transaction_id: string | null;
    month: number;
    year: number;
    is_paid: boolean;
    paid_at: string | null;
}

export interface FixedExpense {
    id: string;
    name: string;
    amount: number;
    category_id: string | null;
    category?: Category | null;
    category_text?: string | null;
    payment_method: PaymentMethod;
    expected_day: number;
    is_active: boolean;
    notes: string | null;
    check: FixedExpenseCheck | null;
    created_at: string;
}

export type AccountType = 'savings' | 'checking' | 'credit_card' | 'cash' | 'digital_wallet' | 'investment';

export interface Account {
    id: string;
    name: string;
    type: AccountType;
    currency: string;
    initial_balance: number;
    balance: number;
    is_active: boolean;
    is_credit_card: boolean;
    notes: string | null;
    created_at: string;
}

export interface AccountSummaryItem {
    id: string;
    name: string;
    type: AccountType;
    is_credit_card: boolean;
    balance: number;
    currency: string;
}

export interface AccountsSummary {
    accounts: AccountSummaryItem[];
    total_assets: number;
    total_debt: number;
    net_worth: number;
}

export interface Transfer {
    id: string;
    from_account_id: string;
    from_account?: { id: string; name: string; type: AccountType };
    to_account_id: string;
    to_account?: { id: string; name: string; type: AccountType };
    amount: number;
    date: string;
    description: string | null;
    created_at: string;
}

export interface FixedExpensesSummary {
    total: number;
    paid: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
}

// ── Liabilities ───────────────────────────────────────────────────────────────
export type LiabilityType = 'mortgage' | 'personal_loan' | 'vehicle_loan' | 'credit_card_loan' | 'cooperative_loan' | 'other';
export type LiabilityStatus = 'active' | 'paid_off' | 'refinanced';
export type PaymentType = 'scheduled' | 'extra_payment' | 'lump_sum_payment';

export interface LiabilityCard {
    id: string;
    name: string;
    type: LiabilityType;
    status: LiabilityStatus;
    original_amount: number;
    outstanding_balance: number;
    annual_interest_rate: number;
    term_months: number;
    monthly_payment: number;
    payment_day: number;
    start_date: string;
    first_payment_date: string;
    payments_made: number;
    projected_payoff_date: string | null;
    pct_paid: number;
    linked_account: { id: string; name: string } | null;
    notes: string | null;
    estimated_property_value: number | null;
}

export interface LiabilityFull extends LiabilityCard {
    early_payment_penalty_rate: number | null;
    created_at: string;
}

export interface AmortizationRow {
    number: number;
    date: string;
    beginning_balance: number;
    payment: number;
    principal: number;
    interest: number;
    ending_balance: number;
}

export interface LiabilityPaymentRecord {
    id: string;
    payment_number: number | null;
    payment_date: string;
    total_paid: number;
    principal_paid: number;
    interest_paid: number;
    outstanding_balance_after: number;
    payment_type: PaymentType;
    notes: string | null;
}

export interface LiabilitySimulationRecord {
    id: string;
    name: string;
    extra_monthly_payment: number;
    lump_sum_amount: number | null;
    lump_sum_date: string | null;
    resulting_payoff_date: string;
    resulting_total_interest: number;
    resulting_months_saved: number;
    created_at: string;
}

export interface LiabilityPosition {
    current_payment_number: number;
    actual_balance: number;
    total_interest_paid: number;
    total_principal_paid: number;
    pct_paid: number;
    projected_payoff_date: string;
}

export interface LiabilityTotals {
    total_debt: number;
    monthly_commitment: number;
    total_remaining_interest: number;
    debt_free_date: string | null;
}

export interface DebtSummary {
    total_debt: number;
    monthly_commitment: number;
    next_payment_date: string | null;
    next_payment_name: string | null;
    next_payment_amount: number | null;
    active_count: number;
}

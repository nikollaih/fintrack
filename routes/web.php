<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\AssetMovementController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\BuyerController;
use App\Http\Controllers\CropCycleController;
use App\Http\Controllers\CropExpenseController;
use App\Http\Controllers\CropSaleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FixedExpenseController;
use App\Http\Controllers\LiabilityController;
use App\Http\Controllers\LiabilityPaymentController;
use App\Http\Controllers\LiabilitySimulationController;
use App\Http\Controllers\ProjectionController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RetirementPlannerController;
use Illuminate\Support\Facades\Route;

// Guest routes
Route::middleware('guest')->group(function (): void {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store'])->name('register.store');
    Route::get('/forgot-password', [ForgotPasswordController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])->name('password.email');
});

// Authenticated + tenant-initialized routes
Route::middleware(['auth', 'tenant'])->group(function (): void {
    Route::post('/logout', LogoutController::class)->name('logout');

    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/', fn () => redirect()->route('dashboard'));

    Route::resource('accounts', AccountController::class)->except(['create', 'edit']);

    Route::get('/retirement-planner', [RetirementPlannerController::class, 'index'])->name('retirement.index');
    Route::post('/retirement-planner', [RetirementPlannerController::class, 'save'])->name('retirement.save');

    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::post('/reports/generate', [ReportController::class, 'generate'])->name('reports.generate');
    Route::get('/reports/{report}/download', [ReportController::class, 'download'])->name('reports.download');
    Route::delete('/reports/{report}', [ReportController::class, 'destroy'])->name('reports.destroy');
    Route::resource('categories', CategoryController::class)->except(['create', 'edit', 'show']);
    Route::resource('transfers', TransferController::class)->only(['store', 'destroy']);

    // Assets with show + projection
    Route::resource('assets', AssetController::class)->except(['create', 'edit']);
    Route::get('/assets/{asset}/projection', [AssetController::class, 'projection'])->name('assets.projection');

    // Asset movements
    Route::resource('asset-movements', AssetMovementController::class)->only(['store', 'destroy']);

    // Portfolio projections page
    Route::get('/projections', ProjectionController::class)->name('projections');

    Route::resource('transactions', TransactionController::class)->except(['create', 'edit', 'show']);

    Route::resource('fixed-expenses', FixedExpenseController::class)->except(['create', 'edit', 'show']);
    Route::post('fixed-expenses/{fixedExpense}/toggle', [FixedExpenseController::class, 'toggle'])
        ->name('fixed-expenses.toggle');
    Route::post('fixed-expenses/{fixedExpense}/pay', [FixedExpenseController::class, 'pay'])
        ->name('fixed-expenses.pay');

    // Liabilities
    Route::resource('liabilities', LiabilityController::class)->except(['create', 'edit']);
    Route::post('liabilities/{liability}/payments', [LiabilityPaymentController::class, 'store'])->name('liability-payments.store');
    Route::delete('liabilities/{liability}/payments/{payment}', [LiabilityPaymentController::class, 'destroy'])->name('liability-payments.destroy');
    Route::post('liabilities/{liability}/simulations/preview', [LiabilitySimulationController::class, 'preview'])->name('liability-simulations.preview');
    Route::post('liabilities/{liability}/simulations', [LiabilitySimulationController::class, 'store'])->name('liability-simulations.store');
    Route::delete('liabilities/{liability}/simulations/{simulation}', [LiabilitySimulationController::class, 'destroy'])->name('liability-simulations.destroy');

    Route::resource('suppliers', SupplierController::class)->except(['create', 'edit', 'show']);
    Route::resource('buyers', BuyerController::class)->except(['create', 'edit', 'show']);

    Route::resource('crop-cycles', CropCycleController::class)->except(['create', 'edit']);
    Route::resource('crop-expenses', CropExpenseController::class)->only(['store', 'destroy']);
    Route::resource('crop-sales', CropSaleController::class)->only(['store', 'destroy']);
});

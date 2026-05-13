<?php

namespace App\Services;

use App\Models\Category;

class CategorySeederService
{
    public function seedForTenant(string $tenantId): void
    {
        foreach ($this->predefined() as $item) {
            Category::create(array_merge($item, [
                'tenant_id' => $tenantId,
                'is_predefined' => true,
                'is_active' => true,
            ]));
        }
    }

    private function predefined(): array
    {
        return [
            // ── Expense categories ─────────────────────────────────────────
            ['name' => 'Alimentación',             'type' => 'expense', 'icon' => 'shopping-bag',         'color' => '#f97316', 'sort_order' => 1],
            ['name' => 'Vivienda',                  'type' => 'expense', 'icon' => 'home',                 'color' => '#6366f1', 'sort_order' => 2],
            ['name' => 'Servicios públicos',        'type' => 'expense', 'icon' => 'bolt',                 'color' => '#f59e0b', 'sort_order' => 3],
            ['name' => 'Transporte',                'type' => 'expense', 'icon' => 'car',                  'color' => '#3b82f6', 'sort_order' => 4],
            ['name' => 'Salud',                     'type' => 'expense', 'icon' => 'heart',                'color' => '#ef4444', 'sort_order' => 5],
            ['name' => 'Educación',                 'type' => 'expense', 'icon' => 'book',                 'color' => '#8b5cf6', 'sort_order' => 6],
            ['name' => 'Entretenimiento',           'type' => 'expense', 'icon' => 'device-gamepad',       'color' => '#ec4899', 'sort_order' => 7],
            ['name' => 'Ropa y calzado',            'type' => 'expense', 'icon' => 'shirt',                'color' => '#a78bfa', 'sort_order' => 8],
            ['name' => 'Tecnología',                'type' => 'expense', 'icon' => 'device-laptop',        'color' => '#06b6d4', 'sort_order' => 9],
            ['name' => 'Restaurantes',              'type' => 'expense', 'icon' => 'tools-kitchen',        'color' => '#fb923c', 'sort_order' => 10],
            ['name' => 'Mercado',                   'type' => 'expense', 'icon' => 'shopping-cart',        'color' => '#10b981', 'sort_order' => 11],
            ['name' => 'Combustible',               'type' => 'expense', 'icon' => 'gas-station',          'color' => '#6b7280', 'sort_order' => 12],
            ['name' => 'Seguros',                   'type' => 'expense', 'icon' => 'shield',               'color' => '#1d4ed8', 'sort_order' => 13],
            ['name' => 'Créditos y deudas',         'type' => 'expense', 'icon' => 'credit-card',          'color' => '#dc2626', 'sort_order' => 14],
            ['name' => 'Ahorro e inversión',        'type' => 'expense', 'icon' => 'piggy-bank',           'color' => '#059669', 'sort_order' => 15],
            ['name' => 'Familia y dependientes',    'type' => 'expense', 'icon' => 'users',                'color' => '#db2777', 'sort_order' => 16],
            ['name' => 'Mascotas',                  'type' => 'expense', 'icon' => 'paw',                  'color' => '#92400e', 'sort_order' => 17],
            ['name' => 'Suscripciones digitales',   'type' => 'expense', 'icon' => 'player-play',          'color' => '#b91c1c', 'sort_order' => 18],
            ['name' => 'Otros gastos',              'type' => 'expense', 'icon' => 'dots-circle-horizontal','color' => '#9ca3af', 'sort_order' => 19],

            // ── Income categories ──────────────────────────────────────────
            ['name' => 'Salario',                   'type' => 'income', 'icon' => 'briefcase',             'color' => '#059669', 'sort_order' => 20],
            ['name' => 'Freelance',                 'type' => 'income', 'icon' => 'code',                  'color' => '#6366f1', 'sort_order' => 21],
            ['name' => 'Negocio propio',            'type' => 'income', 'icon' => 'building-store',        'color' => '#f97316', 'sort_order' => 22],
            ['name' => 'Arriendo recibido',         'type' => 'income', 'icon' => 'home',                  'color' => '#0ea5e9', 'sort_order' => 23],
            ['name' => 'Intereses y rendimientos',  'type' => 'income', 'icon' => 'trending-up',           'color' => '#10b981', 'sort_order' => 24],
            ['name' => 'Dividendos',                'type' => 'income', 'icon' => 'chart-bar',             'color' => '#8b5cf6', 'sort_order' => 25],
            ['name' => 'Ventas',                    'type' => 'income', 'icon' => 'currency-dollar',       'color' => '#f59e0b', 'sort_order' => 26],
            ['name' => 'Transferencia recibida',    'type' => 'income', 'icon' => 'arrow-down-circle',     'color' => '#3b82f6', 'sort_order' => 27],
            ['name' => 'Reembolso',                 'type' => 'income', 'icon' => 'receipt',               'color' => '#22c55e', 'sort_order' => 28],
            ['name' => 'Otros ingresos',            'type' => 'income', 'icon' => 'plus-circle',           'color' => '#9ca3af', 'sort_order' => 29],

            // ── Agro categories ────────────────────────────────────────────
            ['name' => 'Semillas',                       'type' => 'agro', 'icon' => 'seeding',           'color' => '#65a30d', 'sort_order' => 30],
            ['name' => 'Fertilizantes',                  'type' => 'agro', 'icon' => 'droplet',           'color' => '#16a34a', 'sort_order' => 31],
            ['name' => 'Herbicidas',                     'type' => 'agro', 'icon' => 'plant',             'color' => '#84cc16', 'sort_order' => 32],
            ['name' => 'Insecticidas y fungicidas',      'type' => 'agro', 'icon' => 'bug',               'color' => '#ca8a04', 'sort_order' => 33],
            ['name' => 'Mano de obra siembra',           'type' => 'agro', 'icon' => 'user',              'color' => '#92400e', 'sort_order' => 34],
            ['name' => 'Mano de obra mantenimiento',     'type' => 'agro', 'icon' => 'tool',              'color' => '#78716c', 'sort_order' => 35],
            ['name' => 'Mano de obra cosecha',           'type' => 'agro', 'icon' => 'users',             'color' => '#b45309', 'sort_order' => 36],
            ['name' => 'Transporte de insumos',          'type' => 'agro', 'icon' => 'truck',             'color' => '#2563eb', 'sort_order' => 37],
            ['name' => 'Transporte de cosecha',          'type' => 'agro', 'icon' => 'truck',             'color' => '#1d4ed8', 'sort_order' => 38],
            ['name' => 'Arriendo de maquinaria',         'type' => 'agro', 'icon' => 'tractor',           'color' => '#d97706', 'sort_order' => 39],
            ['name' => 'Imprevistos agro',               'type' => 'agro', 'icon' => 'alert-circle',      'color' => '#ef4444', 'sort_order' => 40],
        ];
    }
}

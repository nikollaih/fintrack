<?php

declare(strict_types=1);

use App\Models\Tenant;

return [
    'tenant_model' => Tenant::class,
    'id_generator' => Stancl\Tenancy\UUIDGenerator::class,

    'domain_model' => Stancl\Tenancy\Database\Models\Domain::class,

    'central_domains' => [
        '127.0.0.1',
        'localhost',
    ],

    /*
     * Single-database tenancy: no DatabaseTenancyBootstrapper.
     * Tenant isolation is handled by BelongsToTenant scope + tenant_id FK on every table.
     */
    'bootstrappers' => [
        Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class,
        Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper::class,
    ],

    'database' => [
        'central_connection' => env('DB_CONNECTION', 'pgsql'),
        'template_tenant_connection' => null,
        'prefix' => 'tenant',
        'suffix' => '',
        'managers' => [
            'sqlite' => Stancl\Tenancy\Database\TenantDatabaseManagers\SQLiteDatabaseManager::class,
            'mysql' => Stancl\Tenancy\Database\TenantDatabaseManagers\MySQLDatabaseManager::class,
            'pgsql' => Stancl\Tenancy\Database\TenantDatabaseManagers\PostgreSQLDatabaseManager::class,
        ],
    ],

    'cache' => [
        'tag_base' => 'tenant',
    ],

    'filesystem' => [
        'suffix_base' => 'tenant',
        'disks' => [],
        'root_override' => [],
    ],

    'redis' => [
        'prefixed_connections' => [],
    ],

    'features' => [],

    'identification_middleware' => [
        Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
    ],

    'migrate_within_transaction' => false,

    'seeder' => Illuminate\Database\Seeder::class,
];

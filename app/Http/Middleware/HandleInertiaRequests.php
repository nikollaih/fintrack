<?php

namespace App\Http\Middleware;

use App\Models\Liability;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
            ],
            'ziggy' => fn () => [...(new Ziggy)->toArray(), 'location' => $request->url()],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'warning' => fn () => $request->session()->get('warning'),
                'error'   => fn () => $request->session()->get('error'),
            ],
            'active_liabilities_count' => fn () => $request->user() && tenancy()->initialized
                ? Liability::where('status', 'active')->count()
                : 0,
        ]);
    }
}

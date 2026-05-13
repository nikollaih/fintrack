<?php

namespace App\Http\Controllers;

use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::orderBy('sort_order')->orderBy('name')->get();

        $grouped = [
            'expense' => CategoryResource::collection($categories->where('type', 'expense')->values()),
            'income' => CategoryResource::collection($categories->where('type', 'income')->values()),
            'agro' => CategoryResource::collection($categories->where('type', 'agro')->values()),
            'both' => CategoryResource::collection($categories->where('type', 'both')->values()),
        ];

        return Inertia::render('Categories/Index', [
            'grouped' => $grouped,
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        Category::create(array_merge($request->validated(), [
            'is_predefined' => false,
            'sort_order' => 999,
        ]));

        return back()->with('success', 'Categoría creada.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $data = $request->validated();

        // Predefined categories: only allow color, icon, is_active to be changed
        if ($category->is_predefined) {
            $data = array_intersect_key($data, array_flip(['color', 'icon', 'is_active']));
        }

        $category->update($data);

        return back()->with('success', 'Categoría actualizada.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->is_predefined) {
            return back()->with('error', 'Las categorías predefinidas no pueden eliminarse.');
        }

        $category->delete();

        return back()->with('success', 'Categoría eliminada.');
    }
}

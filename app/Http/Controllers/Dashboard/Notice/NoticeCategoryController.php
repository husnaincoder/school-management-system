<?php

namespace App\Http\Controllers\Dashboard\Notice;

use App\Http\Controllers\Controller;
use App\Models\NoticeCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NoticeCategoryController extends Controller
{
    public function index()
    {
        $categories = NoticeCategory::latest()->get();

        return Inertia::render('dashboard/notice/NoticeCategories', [
            'categories' => $categories,
        ]);
    }

    public function create()
    {
        return redirect()->route('notice-categories.index');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:notice_categories,slug',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        if (empty($validated['slug'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
        }

        NoticeCategory::create($validated);

        return back()->with('success', 'Notice category created successfully.');
    }

    public function show($id)
    {
        return redirect()->route('notice-categories.index');
    }

    public function edit($id)
    {
        return redirect()->route('notice-categories.index');
    }

    public function update(Request $request, $id)
    {
        $category = NoticeCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:notice_categories,slug,' . $category->id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        if (empty($validated['slug'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
        }

        $category->update($validated);

        return back()->with('success', 'Notice category updated successfully.');
    }

    public function destroy($id)
    {
        $category = NoticeCategory::findOrFail($id);
        $category->delete();

        return back()->with('success', 'Notice category deleted successfully.');
    }
}

<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Search\GlobalSearchService;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function __construct(
        protected GlobalSearchService $searchService
    ) {}

    public function meta(Request $request)
    {
        $user = $request->user();
        abort_unless($user, 401);

        $roles = $user->getRoleNames()->map(fn ($r) => (string) $r)->all();
        $canStudents = count(array_intersect($roles, ['super_admin', 'admin', 'accountant'])) > 0;
        $canStaff = count(array_intersect($roles, ['super_admin', 'admin'])) > 0;
        $canCollect = $this->searchService->canCollectFee($roles);

        return response()->json([
            'can_search_people' => $canStaff,
            'can_search_students' => $canStudents,
            'can_collect_fee' => $canCollect,
            'filter_tree' => $canStudents ? $this->searchService->filterTree() : [],
        ]);
    }

    public function search(Request $request)
    {
        $user = $request->user();
        abort_unless($user, 401);

        $validated = $request->validate([
            'q' => 'nullable|string|max:100',
            'type' => 'nullable|in:all,pages,students,teachers,employees',
            'academic_session_id' => 'nullable|integer',
            'class_id' => 'nullable|integer',
            'section_id' => 'nullable|integer',
            'fee_status' => 'nullable|in:all,paid,unpaid,partial,no_invoice',
            'payment_method' => 'nullable|in:cash,bank,card,online,cheque',
        ]);

        $results = $this->searchService->search(
            $user,
            (string) ($validated['q'] ?? ''),
            $validated['type'] ?? 'all',
            isset($validated['academic_session_id']) ? (int) $validated['academic_session_id'] : null,
            isset($validated['class_id']) ? (int) $validated['class_id'] : null,
            isset($validated['section_id']) ? (int) $validated['section_id'] : null,
            $validated['fee_status'] ?? null,
            $validated['payment_method'] ?? null,
        );

        return response()->json([
            'query' => $validated['q'] ?? '',
            'results' => $results,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\TransportRoute;
use App\Models\StudentTransport;
use App\Models\Student;
use Illuminate\Http\Request;

class TransportController extends Controller
{
    public function vehicles()
    {
        $vehicles = Vehicle::orderBy('vehicle_number')->get();
        $routes = TransportRoute::where('is_active', true)->orderBy('route_name')->get();
        return inertia('dashboard/transport/Vehicles', [
            'vehicles' => $vehicles,
            'routes' => $routes,
        ]);
    }

    public function vehicleStore(Request $request)
    {
        $validated = $request->validate([
            'vehicle_number' => 'required|string|unique:vehicles',
            'vehicle_name' => 'nullable|string',
            'driver_name' => 'required|string',
            'driver_phone' => 'required|string',
            'capacity' => 'required|integer|min:1',
        ]);

        Vehicle::create($validated);
        return back()->with('success', 'Vehicle added.');
    }

    public function routes()
    {
        $routes = TransportRoute::with('vehicle', 'studentTransports')->get();
        return inertia('dashboard/transport/Routes', ['routes' => $routes]);
    }

    public function routeStore(Request $request)
    {
        $validated = $request->validate([
            'route_name' => 'required|string',
            'start_point' => 'required|string',
            'end_point' => 'required|string',
            'monthly_fee' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        TransportRoute::create($validated);
        return back()->with('success', 'Route created.');
    }

    public function routeUpdate(Request $request, TransportRoute $route)
    {
        $validated = $request->validate([
            'route_name' => 'required|string',
            'start_point' => 'required|string',
            'end_point' => 'required|string',
            'monthly_fee' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        $route->update($validated);
        return back()->with('success', 'Route updated.');
    }

    public function routeDestroy(TransportRoute $route)
    {
        $route->delete();
        return back()->with('success', 'Route deleted.');
    }

    public function assignments(Request $request)
    {
        $query = StudentTransport::with('student.user', 'route', 'vehicle');

        if ($request->route_id) {
            $query->where('route_id', $request->route_id);
        }

        $assignments = $query->latest()->paginate(20)->withQueryString();
        $routes = TransportRoute::where('is_active', true)->orderBy('route_name')->get();
        $vehicles = Vehicle::orderBy('vehicle_number')->get();
        $students = Student::with('user')->get();

        return inertia('dashboard/transport/Assignments', [
            'assignments' => $assignments,
            'routes' => $routes,
            'vehicles' => $vehicles,
            'students' => $students,
            'filters' => $request->only(['route_id']),
        ]);
    }

    public function assignTransport(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'route_id' => 'required|exists:transport_routes,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'pickup_point' => 'required|string',
            'start_date' => 'required|date',
        ]);

        StudentTransport::create($validated);
        return back()->with('success', 'Transport assigned.');
    }
}

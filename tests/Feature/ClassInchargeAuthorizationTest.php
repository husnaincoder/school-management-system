<?php

namespace Tests\Feature;

use App\Models\AcademicSession;
use App\Models\ClassActivity;
use App\Models\ClassIncharge;
use App\Models\ClassNotice;
use App\Models\ClassSection;
use App\Models\ClassSectionGroup;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\SubjectGroup;
use App\Models\Teacher;
use App\Models\User;
use App\Services\ClassIncharge\ClassInchargeAccessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ClassInchargeAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private ClassSection $sectionA;

    private ClassSection $sectionB;

    private ClassSectionGroup $groupA;

    private ClassSectionGroup $groupB;

    private StudentEnrollment $enrollmentA;

    private StudentEnrollment $enrollmentB;

    private User $inchargeUser;

    private Teacher $inchargeTeacher;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('class_incharge', 'web');
        Role::findOrCreate('teacher', 'web');

        $this->session = AcademicSession::create([
            'name' => '2026-27',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'is_active' => true,
            'is_current' => true,
        ]);

        $class = SchoolClass::create(['name' => 'Class 10', 'class_number' => '10', 'is_active' => true]);
        $secA = Section::create(['name' => 'A', 'is_active' => true]);
        $secB = Section::create(['name' => 'B', 'is_active' => true]);
        $subjectGroup = SubjectGroup::create(['name' => 'General', 'is_active' => true]);

        $this->sectionA = ClassSection::create([
            'academic_session_id' => $this->session->id,
            'class_id' => $class->id,
            'section_id' => $secA->id,
            'is_active' => true,
        ]);
        $this->sectionB = ClassSection::create([
            'academic_session_id' => $this->session->id,
            'class_id' => $class->id,
            'section_id' => $secB->id,
            'is_active' => true,
        ]);

        $this->groupA = ClassSectionGroup::create([
            'class_section_id' => $this->sectionA->id,
            'subject_group_id' => $subjectGroup->id,
        ]);
        $this->groupB = ClassSectionGroup::create([
            'class_section_id' => $this->sectionB->id,
            'subject_group_id' => $subjectGroup->id,
        ]);

        $this->inchargeUser = User::factory()->create(['is_active' => true]);
        $this->inchargeUser->assignRole('class_incharge');
        $this->inchargeTeacher = Teacher::create([
            'user_id' => $this->inchargeUser->id,
            'staff_id' => 'T-IN-1',
            'is_active' => true,
        ]);

        ClassIncharge::create([
            'class_section_id' => $this->sectionA->id,
            'teacher_id' => $this->inchargeTeacher->id,
            'is_active' => true,
        ]);

        $studentUserA = User::factory()->create(['is_active' => true]);
        $studentA = Student::create([
            'user_id' => $studentUserA->id,
            'first_name' => 'Ali',
            'last_name' => 'A',
            'admission_number' => 'ADM-A-1',
        ]);
        $this->enrollmentA = StudentEnrollment::create([
            'student_id' => $studentA->id,
            'class_section_group_id' => $this->groupA->id,
            'roll_number' => '1',
            'status' => 'active',
        ]);

        $studentUserB = User::factory()->create(['is_active' => true]);
        $studentB = Student::create([
            'user_id' => $studentUserB->id,
            'first_name' => 'Bilal',
            'last_name' => 'B',
            'admission_number' => 'ADM-B-1',
        ]);
        $this->enrollmentB = StudentEnrollment::create([
            'student_id' => $studentB->id,
            'class_section_group_id' => $this->groupB->id,
            'roll_number' => '1',
            'status' => 'active',
        ]);
    }

    public function test_class_incharge_can_view_assigned_class_dashboard(): void
    {
        $this->actingAs($this->inchargeUser)
            ->get(route('class-incharge.dashboard'))
            ->assertOk();
    }

    public function test_class_incharge_cannot_view_other_class_subjects(): void
    {
        $this->actingAs($this->inchargeUser)
            ->get(route('class-incharge.subjects', $this->sectionB->id))
            ->assertForbidden();
    }

    public function test_class_incharge_can_view_assigned_class_subjects_and_timetable(): void
    {
        $this->actingAs($this->inchargeUser)
            ->get(route('class-incharge.subjects', $this->sectionA->id))
            ->assertOk();

        $this->actingAs($this->inchargeUser)
            ->get(route('class-incharge.timetable', $this->sectionA->id))
            ->assertOk();
    }

    public function test_class_incharge_can_manage_remarks_for_own_class_only(): void
    {
        $this->actingAs($this->inchargeUser)
            ->post(route('teacher.remarks.store'), [
                'student_enrollment_id' => $this->enrollmentA->id,
                'type' => 'remark',
                'body' => 'Good progress',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('student_remarks', [
            'student_enrollment_id' => $this->enrollmentA->id,
            'body' => 'Good progress',
        ]);

        $this->actingAs($this->inchargeUser)
            ->post(route('teacher.remarks.store'), [
                'student_enrollment_id' => $this->enrollmentB->id,
                'type' => 'remark',
                'body' => 'Should fail',
            ])
            ->assertForbidden();
    }

    public function test_class_incharge_can_manage_announcements_for_own_class_only(): void
    {
        $this->actingAs($this->inchargeUser)
            ->post(route('class-incharge.notices.store'), [
                'class_section_group_id' => $this->groupA->id,
                'title' => 'PTM',
                'body' => 'Tomorrow',
                'notify_parents' => false,
            ])
            ->assertRedirect();

        $foreign = ClassNotice::create([
            'class_section_group_id' => $this->groupB->id,
            'title' => 'Other',
            'body' => 'x',
            'created_by' => $this->inchargeUser->id,
        ]);

        $this->actingAs($this->inchargeUser)
            ->delete(route('class-incharge.notices.destroy', $foreign->id))
            ->assertForbidden();
    }

    public function test_class_incharge_can_manage_activities_for_own_class_only(): void
    {
        $this->actingAs($this->inchargeUser)
            ->post(route('class-incharge.activities.store'), [
                'class_section_id' => $this->sectionA->id,
                'title' => 'Sports Day',
            ])
            ->assertRedirect();

        $this->actingAs($this->inchargeUser)
            ->post(route('class-incharge.activities.store'), [
                'class_section_id' => $this->sectionB->id,
                'title' => 'Should fail',
            ])
            ->assertForbidden();

        $foreign = ClassActivity::create([
            'class_section_id' => $this->sectionB->id,
            'title' => 'Foreign',
            'created_by' => $this->inchargeUser->id,
        ]);

        $this->actingAs($this->inchargeUser)
            ->delete(route('class-incharge.activities.destroy', $foreign->id))
            ->assertForbidden();
    }

    public function test_class_incharge_can_recommend_promotion_for_own_students_only(): void
    {
        $this->actingAs($this->inchargeUser)
            ->post(route('class-incharge.promotion-recommendations.store'), [
                'student_enrollment_id' => $this->enrollmentA->id,
                'recommendation' => 'promote',
                'remarks' => 'Ready',
            ])
            ->assertRedirect();

        $this->actingAs($this->inchargeUser)
            ->post(route('class-incharge.promotion-recommendations.store'), [
                'student_enrollment_id' => $this->enrollmentB->id,
                'recommendation' => 'promote',
            ])
            ->assertForbidden();
    }

    public function test_class_incharge_can_view_parents_of_own_class(): void
    {
        $this->actingAs($this->inchargeUser)
            ->get(route('class-incharge.parents.index'))
            ->assertOk();
    }

    public function test_inactive_assignment_does_not_grant_access(): void
    {
        ClassIncharge::where('teacher_id', $this->inchargeTeacher->id)->update(['is_active' => false]);

        $this->actingAs($this->inchargeUser)
            ->get(route('class-incharge.subjects', $this->sectionA->id))
            ->assertForbidden();

        $access = app(ClassInchargeAccessService::class);
        $this->assertFalse($access->canManageClassSection($this->inchargeUser, $this->sectionA->id));
    }

    public function test_assignment_without_class_incharge_role_does_not_grant_incharge_scope(): void
    {
        $teacherOnly = User::factory()->create(['is_active' => true]);
        $teacherOnly->assignRole('teacher');
        $teacher = Teacher::create([
            'user_id' => $teacherOnly->id,
            'staff_id' => 'T-ONLY-1',
            'is_active' => true,
        ]);
        ClassIncharge::create([
            'class_section_id' => $this->sectionA->id,
            'teacher_id' => $teacher->id,
            'is_active' => true,
        ]);

        $access = app(ClassInchargeAccessService::class);
        $this->assertFalse($access->canManageClassSection($teacherOnly, $this->sectionA->id));
        $this->assertTrue($access->accessibleClassSectionGroupIdsForUser($teacherOnly)->isEmpty());

        $this->actingAs($teacherOnly)
            ->get(route('class-incharge.dashboard'))
            ->assertForbidden();
    }

    public function test_access_service_respects_class_section_not_just_name(): void
    {
        $otherSession = AcademicSession::create([
            'name' => '2025-26',
            'start_date' => '2025-04-01',
            'end_date' => '2026-03-31',
            'is_active' => true,
            'is_current' => false,
        ]);
        $historical = ClassSection::create([
            'academic_session_id' => $otherSession->id,
            'class_id' => $this->sectionA->class_id,
            'section_id' => $this->sectionA->section_id,
            'is_active' => true,
        ]);

        $access = app(ClassInchargeAccessService::class);
        $this->assertTrue($access->canManageClassSection($this->inchargeUser, $this->sectionA->id));
        $this->assertFalse($access->canManageClassSection($this->inchargeUser, $historical->id));
    }
}

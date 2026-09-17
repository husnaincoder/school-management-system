<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Legacy upgrade: class_section_group_id → class_section_id.
 * On migrate:fresh the create migration already uses class_section_id, so this is a no-op.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('class_incharges')) {
            return;
        }

        // Fresh installs / already migrated.
        if (Schema::hasColumn('class_incharges', 'class_section_id')
            && ! Schema::hasColumn('class_incharges', 'class_section_group_id')) {
            $this->ensureSectionTeacherUnique();

            return;
        }

        if (! Schema::hasColumn('class_incharges', 'class_section_id')) {
            Schema::table('class_incharges', function (Blueprint $table) {
                $table->unsignedBigInteger('class_section_id')->nullable()->after('id');
            });

            Schema::table('class_incharges', function (Blueprint $table) {
                $table->foreign('class_section_id')
                    ->references('id')
                    ->on('class_sections')
                    ->cascadeOnDelete();
            });
        }

        if (Schema::hasColumn('class_incharges', 'class_section_group_id')) {
            $rows = DB::table('class_incharges')->get();
            foreach ($rows as $row) {
                $groupId = $row->class_section_group_id ?? null;
                if (! $groupId) {
                    continue;
                }

                $classSectionId = DB::table('class_section_groups')
                    ->where('id', $groupId)
                    ->value('class_section_id');

                if ($classSectionId) {
                    DB::table('class_incharges')
                        ->where('id', $row->id)
                        ->update(['class_section_id' => $classSectionId]);
                }
            }

            $dupes = DB::table('class_incharges')
                ->select('teacher_id', 'class_section_id', DB::raw('COUNT(*) as c'))
                ->whereNotNull('class_section_id')
                ->groupBy('teacher_id', 'class_section_id')
                ->having('c', '>', 1)
                ->get();

            foreach ($dupes as $dup) {
                $ids = DB::table('class_incharges')
                    ->where('teacher_id', $dup->teacher_id)
                    ->where('class_section_id', $dup->class_section_id)
                    ->orderByDesc('is_active')
                    ->orderByDesc('id')
                    ->pluck('id');

                $drop = $ids->slice(1)->all();
                if ($drop !== []) {
                    DB::table('class_incharges')->whereIn('id', $drop)->delete();
                }
            }

            $this->dropGroupIdArtifacts();
        }

        DB::table('class_incharges')->whereNull('class_section_id')->delete();

        if (Schema::getConnection()->getDriverName() === 'mysql'
            && Schema::hasColumn('class_incharges', 'class_section_id')) {
            DB::statement('ALTER TABLE class_incharges MODIFY class_section_id BIGINT UNSIGNED NOT NULL');
        }

        $this->ensureSectionTeacherUnique();
    }

    public function down(): void
    {
        if (! Schema::hasTable('class_incharges') || ! Schema::hasColumn('class_incharges', 'class_section_id')) {
            return;
        }

        if ($this->indexExists('class_incharges_section_teacher_unique')) {
            Schema::table('class_incharges', function (Blueprint $table) {
                $table->dropUnique('class_incharges_section_teacher_unique');
            });
        }

        if (! Schema::hasColumn('class_incharges', 'class_section_group_id')) {
            Schema::table('class_incharges', function (Blueprint $table) {
                $table->unsignedBigInteger('class_section_group_id')->nullable()->after('id');
            });

            Schema::table('class_incharges', function (Blueprint $table) {
                $table->foreign('class_section_group_id')
                    ->references('id')
                    ->on('class_section_groups')
                    ->cascadeOnDelete();
            });
        }

        $rows = DB::table('class_incharges')->get();
        foreach ($rows as $row) {
            $groupId = DB::table('class_section_groups')
                ->where('class_section_id', $row->class_section_id)
                ->orderBy('id')
                ->value('id');
            if ($groupId) {
                DB::table('class_incharges')->where('id', $row->id)->update([
                    'class_section_group_id' => $groupId,
                ]);
            }
        }

        $this->dropForeignKeyIfExists('class_incharges', 'class_section_id');

        if (Schema::hasColumn('class_incharges', 'class_section_id')) {
            Schema::table('class_incharges', function (Blueprint $table) {
                $table->dropColumn('class_section_id');
            });
        }

        if (! $this->indexExists('class_incharges_class_section_group_id_teacher_id_unique')) {
            Schema::table('class_incharges', function (Blueprint $table) {
                $table->unique(['class_section_group_id', 'teacher_id']);
            });
        }
    }

    protected function dropGroupIdArtifacts(): void
    {
        // Drop unique index first (MySQL fails dropConstrainedForeignId if this remains).
        foreach ([
            'class_incharges_class_section_group_id_teacher_id_unique',
            'class_incharges_class_section_group_id_foreign',
        ] as $index) {
            if ($this->indexExists($index)) {
                try {
                    DB::statement("ALTER TABLE class_incharges DROP INDEX `{$index}`");
                } catch (\Throwable) {
                    //
                }
            }
        }

        $this->dropForeignKeyIfExists('class_incharges', 'class_section_group_id');

        if (Schema::hasColumn('class_incharges', 'class_section_group_id')) {
            Schema::table('class_incharges', function (Blueprint $table) {
                $table->dropColumn('class_section_group_id');
            });
        }
    }

    protected function ensureSectionTeacherUnique(): void
    {
        if (! Schema::hasColumn('class_incharges', 'class_section_id')) {
            return;
        }

        if (! $this->indexExists('class_incharges_section_teacher_unique')) {
            Schema::table('class_incharges', function (Blueprint $table) {
                $table->unique(['class_section_id', 'teacher_id'], 'class_incharges_section_teacher_unique');
            });
        }
    }

    protected function dropForeignKeyIfExists(string $table, string $column): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver !== 'mysql') {
            try {
                Schema::table($table, function (Blueprint $blueprint) use ($column) {
                    $blueprint->dropForeign([$column]);
                });
            } catch (\Throwable) {
                //
            }

            return;
        }

        $database = Schema::getConnection()->getDatabaseName();
        $fkName = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', $database)
            ->where('TABLE_NAME', $table)
            ->where('COLUMN_NAME', $column)
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->value('CONSTRAINT_NAME');

        if ($fkName) {
            DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$fkName}`");
        }
    }

    protected function indexExists(string $indexName): bool
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'sqlite') {
            $row = DB::selectOne(
                "SELECT 1 AS ok FROM sqlite_master WHERE type='index' AND name = ? LIMIT 1",
                [$indexName]
            );
            return (bool) $row;
        }
        if ($driver !== 'mysql') {
            return false;
        }

        $database = Schema::getConnection()->getDatabaseName();
        $row = DB::selectOne(
            'SELECT 1 AS ok FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
             LIMIT 1',
            [$database, 'class_incharges', $indexName]
        );

        return (bool) $row;
    }
};

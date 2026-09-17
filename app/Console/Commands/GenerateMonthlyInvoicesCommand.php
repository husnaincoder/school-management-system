<?php

namespace App\Console\Commands;

use App\Services\Fee\AutoInvoiceService;
use Illuminate\Console\Command;

class GenerateMonthlyInvoicesCommand extends Command
{
    protected $signature = 'fee:generate-monthly-invoices {month? : YYYY-MM, default current month}';

    protected $description = 'Generate monthly invoices for all enrollments (run on 1st of month)';

    public function handle(AutoInvoiceService $autoInvoiceService): int
    {
        $month = $this->argument('month') ?? now()->format('Y-m');
        $this->info('Generating invoices for ' . $month . '...');
        $result = $autoInvoiceService->generateForMonth($month);
        $this->info('Created: ' . $result['created'] . ', Skipped: ' . $result['skipped']);
        if (!empty($result['errors'])) {
            $this->warn('Errors: ' . count($result['errors']));
            foreach (array_slice($result['errors'], 0, 5) as $err) {
                $this->line('  - Enrollment ' . $err['enrollment_id'] . ': ' . $err['message']);
            }
        }
        return 0;
    }
}

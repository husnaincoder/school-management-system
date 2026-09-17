<?php

namespace App\Console\Commands;

use App\Services\Fee\FineCalculationService;
use Illuminate\Console\Command;

class ApplyLateFinesCommand extends Command
{
    protected $signature = 'fee:apply-late-fines';

    protected $description = 'Apply late fines to overdue invoices (run daily)';

    public function handle(FineCalculationService $fineService): int
    {
        $count = $fineService->applyLateFines();
        $this->info('Applied late fines to ' . $count . ' invoice(s).');
        return 0;
    }
}

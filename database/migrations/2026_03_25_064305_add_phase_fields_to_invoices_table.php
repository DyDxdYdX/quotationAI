<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('phase_key')->nullable()->after('quotation_id');
            $table->string('phase_name')->nullable()->after('phase_key');
            $table->text('phase_description')->nullable()->after('phase_name');
            $table->decimal('phase_percentage', 8, 2)->nullable()->after('phase_description');

            $table->unique(['quotation_id', 'phase_key'], 'invoices_quotation_phase_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropUnique('invoices_quotation_phase_unique');
            $table->dropColumn([
                'phase_key',
                'phase_name',
                'phase_description',
                'phase_percentage',
            ]);
        });
    }
};

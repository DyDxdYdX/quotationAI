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
        Schema::table('quotations', function (Blueprint $table) {
            $table->string('quotation_number')->nullable()->after('id');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('invoice_number')->nullable()->after('id');
        });
        
        // Backfill existing records
        // For quotations
        $users = \App\Models\User::all();
        foreach ($users as $user) {
            // Get user's quotations via client relation
             $quotations = \App\Models\Quotation::whereHas('client', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->orderBy('created_at')->get();

            $count = 1;
            foreach ($quotations as $quotation) {
                $quotation->quotation_number = str_pad($count, 6, '0', STR_PAD_LEFT);
                $quotation->save();
                $count++;
            }

            // Get user's invoices via client relation
            $invoices = \App\Models\Invoice::whereHas('client', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->orderBy('created_at')->get();

            $count = 1;
            foreach ($invoices as $invoice) {
                $invoice->invoice_number = str_pad($count, 6, '0', STR_PAD_LEFT);
                $invoice->save();
                $count++;
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn('quotation_number');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('invoice_number');
        });
    }
};

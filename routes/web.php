<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('manage-client', [ClientController::class, 'index'])->name('manage-client');

    Route::get('manage-quotation', [App\Http\Controllers\QuotationController::class, 'index'])->name('manage-quotation');
    Route::post('quotation/generate', [App\Http\Controllers\QuotationController::class, 'generate'])->name('quotation.generate');
    Route::get('quotation/{quotation}/pdf', [App\Http\Controllers\QuotationController::class, 'generatePdf'])->name('quotation.pdf');
    Route::resource('quotation', App\Http\Controllers\QuotationController::class);

    Route::get('client', [ClientController::class, 'index'])->name('client');
    Route::post('client', [ClientController::class, 'store'])->name('client.store');
    Route::put('client/{client}', [ClientController::class, 'update'])->name('client.update');
    Route::delete('client/{client}', [ClientController::class, 'destroy'])->name('client.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

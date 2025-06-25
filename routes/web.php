<?php

use App\Http\Controllers\ClientController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('manage-client', [ClientController::class, 'index'])->name('manage-client');

    Route::get('manage-quotation', function () {
        return Inertia::render('quotation/index');
    })->name('manage-quotation');

    Route::get('client', [ClientController::class, 'index'])->name('client');
    Route::post('client', [ClientController::class, 'store'])->name('client.store');
    Route::put('client/{client}', [ClientController::class, 'update'])->name('client.update');
    Route::delete('client/{client}', [ClientController::class, 'destroy'])->name('client.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'supervisor_name',
        'company_phone_number',
        'company_email',
        'company_name',
        'company_address',
        'company_city'
    ];

    public function quotationRequests()
    {
        return $this->hasMany(QuotationRequest::class);
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class);
    }
}

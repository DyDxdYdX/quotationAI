<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    protected $fillable = [
        'client_id',
        'quotation_request_id',
        'quotation_message',
        'quotation_status',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function quotationRequest()
    {
        return $this->belongsTo(QuotationRequest::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuotationRequest extends Model
{
    protected $fillable = [
        'client_id',
        'request_message',
        'service_type',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'request_message' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected $appends = [
        'problem',
        'solution',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function quotation()
    {
        return $this->hasOne(Quotation::class);
    }

    // Accessor methods to extract data from JSON request_message

    public function getProblemAttribute()
    {
        return $this->request_message['problem'] ?? null;
    }

    public function getSolutionAttribute()
    {
        return $this->request_message['solution'] ?? null;
    }

    // Method to update the JSON fields
    public function updateRequestFields($problem, $solution)
    {
        // Ensure we get an array, handle both string and array cases
        $requestMessage = $this->request_message;
        
        if (is_string($requestMessage)) {
            $requestMessage = json_decode($requestMessage, true) ?? [];
        } elseif (!is_array($requestMessage)) {
            $requestMessage = [];
        }

        $requestMessage['problem'] = $problem;
        $requestMessage['solution'] = $solution;
        
        $this->update(['request_message' => $requestMessage]);
    }
}

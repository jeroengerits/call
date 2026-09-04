<?php

namespace Call\Telephony\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeletePhoneNumberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [];
    }
}

<?php

namespace Call\Telephony\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePhoneNumberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'agent_id' => ['required', 'integer', 'exists:agents,id'],
            'number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('phone_numbers', 'number')->ignore($this->route('phone_number')),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

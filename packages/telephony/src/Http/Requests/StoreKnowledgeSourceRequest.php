<?php

namespace Call\Telephony\Http\Requests;

use Call\Telephony\Enums\KnowledgeSourceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKnowledgeSourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(KnowledgeSourceType::class)],
            'title' => ['required', 'string', 'max:255'],
            'url' => ['nullable', 'required_if:type,url', 'url', 'max:2048'],
            'content' => ['nullable', 'required_if:type,text', 'string'],
            'attachment' => [
                'nullable',
                'required_if:type,attachment',
                'file',
                'mimes:txt,md,pdf,csv,json',
                'max:10240',
            ],
        ];
    }
}

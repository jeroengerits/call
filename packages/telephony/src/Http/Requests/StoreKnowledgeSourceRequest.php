<?php

namespace Call\Telephony\Http\Requests;

use Call\Telephony\Enums\KnowledgeSourceType;
use Call\Telephony\Services\UrlSafety;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'content' => [
                'nullable',
                'required_if:type,text',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_string($value) && strlen($value) > (int) config('telephony.knowledge.max_text_bytes')) {
                        $fail('The content exceeds the maximum allowed size.');
                    }
                },
            ],
            'attachment' => [
                'nullable',
                'required_if:type,attachment',
                'file',
                'mimes:txt,md,pdf,csv,json',
                'max:10240',
            ],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->input('type') === KnowledgeSourceType::Url->value && is_string($this->input('url'))) {
                $message = app(UrlSafety::class)->validate($this->input('url'));

                if ($message !== null) {
                    $validator->errors()->add('url', $message);
                }
            }
        });
    }
}

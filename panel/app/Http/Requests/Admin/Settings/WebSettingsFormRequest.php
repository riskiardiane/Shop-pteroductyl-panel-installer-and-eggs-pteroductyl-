<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Closure;
use Illuminate\Validation\Rule;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class WebSettingsFormRequest extends AdminFormRequest
{
    /**
     * Rules for the "Web" settings tab. Keys use the same colon notation as
     * the settings repository, e.g. web:name -> config('web.name').
     */
    public function rules(): array
    {
        $fileValidator = function (string $attribute, $value, Closure $fail) {
            $ext = strtolower($value->getClientOriginalExtension() ?: $value->guessExtension() ?: '');
            if (!in_array($ext, ['ico', 'png', 'jpg', 'jpeg', 'svg', 'webp'], true)) {
                $fail('The :attribute must be an .ico, .png, .jpg, .jpeg, .svg or .webp file.');
            }
        };

        return [
            // Identitas web
            'web:name' => 'nullable|string|max:191',
            'web:title' => 'nullable|string|max:191',
            'web:description' => 'nullable|string|max:500',
            'web:theme_color' => ['nullable', 'string', 'max:32', 'regex:/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/'],
            'web:email' => 'nullable|email|max:191',
            'web:discord' => 'nullable|string|url|max:255',
            'web:footer' => 'nullable|string|max:255',

            // Favicon & logo (file uploads are handled separately in the controller)
            'web:favicon' => 'nullable|string|max:500',
            'web:logo' => 'nullable|string|max:500',
            'web_favicon_file' => ['nullable', 'file', 'max:1024', $fileValidator],
            'web_logo_file' => ['nullable', 'file', 'max:2048', $fileValidator],
            'web_favicon_clear' => 'nullable|boolean',
            'web_logo_clear' => 'nullable|boolean',

            // MustikaPayment & billing
            'billing:mustika:base_url' => 'required|string|url|max:255',
            'billing:mustika:api_key' => 'nullable|string|max:255',
            'billing:mustika:clear_key' => 'nullable|boolean',
            'billing:mustika:timestamp_tolerance' => 'required|integer|between:0,300',
            'billing:checkout:expiry_minutes' => 'required|integer|between:1,1440',
            'billing:checkout:success_url' => 'nullable|string|url|max:500',
            'billing:checkout:cancel_url' => 'nullable|string|url|max:500',
            'billing:invoice_prefix' => 'required|string|max:16',
            'billing:grace_days' => 'required|integer|between:0,90',
        ];
    }

    public function attributes(): array
    {
        return [
            'web:name' => 'Nama Web',
            'web:title' => 'Title Web',
            'web:description' => 'Meta Description',
            'web:theme_color' => 'Theme Color',
            'web:email' => 'Kontak Email',
            'web:discord' => 'URL Discord / Support',
            'web:footer' => 'Footer Text',
            'web:favicon' => 'URL X-icon (favicon)',
            'web:logo' => 'URL Logo',
            'web_favicon_file' => 'File X-icon (favicon)',
            'web_logo_file' => 'File Logo',
            'billing:mustika:base_url' => 'Mustika Base URL',
            'billing:mustika:api_key' => 'Mustika Payment Key',
            'billing:mustika:timestamp_tolerance' => 'Mustika Timestamp Tolerance',
            'billing:checkout:expiry_minutes' => 'Checkout Expiry (menit)',
            'billing:checkout:success_url' => 'Success URL',
            'billing:checkout:cancel_url' => 'Cancel URL',
            'billing:invoice_prefix' => 'Invoice Prefix',
            'billing:grace_days' => 'Grace Period (hari)',
        ];
    }

    /**
     * Keys that should be persisted are the settings::* keys. The Mustika
     * API key is only written when a new value is typed in; an empty field
     * means "keep current key".
     */
    public function normalize(?array $only = null): array
    {
        $keys = array_flip(array_keys($this->rules()));

        if (empty($this->input('billing:mustika:api_key'))) {
            unset($keys['billing:mustika:api_key']);
        }
        // File inputs / clear toggles are not settings keys.
        unset($keys['web_favicon_file'], $keys['web_logo_file'], $keys['web_favicon_clear'], $keys['web_logo_clear'], $keys['billing:mustika:clear_key']);

        return $this->only(array_flip($keys));
    }
}

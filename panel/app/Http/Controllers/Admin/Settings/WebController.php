<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\View\View;
use Illuminate\Support\Str;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Providers\SettingsServiceProvider;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\WebSettingsFormRequest;

class WebController extends Controller
{
    /**
     * WebController constructor.
     */
    public function __construct(
        private AlertsMessageBag $alert,
        private Encrypter $encrypter,
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
    ) {
    }

    /**
     * Render the UI for website identity & billing integration settings.
     */
    public function index(): View
    {
        return view('admin.settings.web', [
            'mustikaKeyIsSet' => !empty(config('billing.mustika.api_key')),
        ]);
    }

    /**
     * Handle settings update, including favicon/logo uploads.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(WebSettingsFormRequest $request): RedirectResponse
    {
        $values = $request->normalize();

        // favicon / logo: upload wins over the URL field; "clear" wins over both.
        foreach (['web:favicon' => ['file' => 'web_favicon_file', 'clear' => 'web_favicon_clear'], 'web:logo' => ['file' => 'web_logo_file', 'clear' => 'web_logo_clear']] as $key => $inputs) {
            if ($request->boolean($inputs['clear'])) {
                $this->deleteStoredAsset(config(str_replace(':', '.', $key)));
                $this->settings->set('settings::' . $key, 'empty');
                unset($values[$key]);
                continue;
            }

            $file = $request->file($inputs['file']);
            if ($file !== null) {
                $ext = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin');
                $name = Str::slug(str_replace(':', '_', $key)) . '_' . now()->format('YmdHis') . '_' . Str::random(6) . '.' . $ext;
                Storage::disk('public')->putFileAs('settings', $file, $name);
                $this->deleteStoredAsset(config(str_replace(':', '.', $key)));
                $this->settings->set('settings::' . $key, '/storage/settings/' . $name);
                unset($values[$key]);
            }
        }

        // Mustika API key: blank = keep current, checkbox = clear, otherwise encrypt + store.
        if ($request->boolean('billing:mustika:clear_key')) {
            $this->settings->set('settings::billing:mustika:api_key', 'empty');
        } elseif (array_key_exists('billing:mustika:api_key', $values)) {
            $values['billing:mustika:api_key'] = $this->encrypter->encrypt($values['billing:mustika:api_key']);
        }

        foreach ($values as $key => $value) {
            if (in_array($key, SettingsServiceProvider::getEncryptedKeys()) && !empty($value) && $key !== 'billing:mustika:api_key') {
                $value = $this->encrypter->encrypt($value);
            }

            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');
        $this->alert->success('Pengaturan web berhasil disimpan dan langsung diterapkan.')->flash();

        return redirect()->route('admin.settings.web');
    }

    /**
     * Remove a previously uploaded file from the public disk, if it is one of ours.
     */
    private function deleteStoredAsset(?string $path): void
    {
        if (!is_string($path) || !str_starts_with($path, '/storage/settings/')) {
            return;
        }

        $name = basename($path);
        if ($name !== '' && Storage::disk('public')->exists('settings/' . $name)) {
            Storage::disk('public')->delete('settings/' . $name);
        }
    }
}

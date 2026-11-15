<?php
/**
 * RizzDevs Panel — egg collection importer.
 *
 * Runs inside `php artisan tinker`:
 *   su -s /bin/bash www-data -c "cd /var/www/pterodactyl && EGG_SOURCE=/path/to/eggs php artisan tinker --execute=\"eval(file_get_contents('/path/to/scripts/import-eggs.php'));\""
 *
 * Behaviour:
 *   - Creates nests (Bots, Databases, Generic, Monitoring, Software,
 *     Storage, Voice Servers) and reuses/creates a "Games" nest for game_eggs/.
 *   - Imports every PTDL_v1/PTDL_v2 egg JSON found recursively in EGG_SOURCE.
 *   - Rewrites egg author to "RizzDevs" and clears meta.update_url so the
 *     panel never fetches upstream updates.
 *   - Skips files that are not eggs (sample/config JSON) and eggs that
 *     already exist (matched by nest + name).
 *   - Legacy PTDL_v2 eggs using the old "images" array are converted to the
 *     "docker_images" map that the importer requires.
 */

use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Egg;

$root = getenv('EGG_SOURCE') ?: '/opt/rizzdevs-eggs';
if (!is_dir($root)) {
    echo "ERROR: EGG_SOURCE '{$root}' is not a directory." . PHP_EOL;
    return;
}

$nestEmail = filter_var(config('mail.from.address'), FILTER_VALIDATE_EMAIL)
    ? config('mail.from.address')
    : 'noreply@' . parse_url((string) env('APP_URL'), PHP_URL_HOST) ?: 'noreply@example.com';

$nestMap = [
    'bots'          => ['name' => 'Bots',          'description' => 'Discord & automation bots. Maintained by RizzDevs.'],
    'database'      => ['name' => 'Databases',     'description' => 'Database server eggs. Maintained by RizzDevs.'],
    'generic'       => ['name' => 'Generic',       'description' => 'Generic applications. Maintained by RizzDevs.'],
    'monitoring'    => ['name' => 'Monitoring',    'description' => 'Monitoring & observability. Maintained by RizzDevs.'],
    'software'      => ['name' => 'Software',      'description' => 'General purpose software. Maintained by RizzDevs.'],
    'storage'       => ['name' => 'Storage',       'description' => 'Storage & sync applications. Maintained by RizzDevs.'],
    'voice_servers' => ['name' => 'Voice Servers', 'description' => 'Voice/chat servers. Maintained by RizzDevs.'],
];

$nestCache = [];
$getNest = function (string $name, string $desc) use (&$nestCache, $nestEmail): Nest {
    if (isset($nestCache[$name])) {
        return $nestCache[$name];
    }
    $nest = Nest::where('name', $name)->first();
    if (!$nest) {
        $nest = new Nest();
        $nest->forceFill([
            'uuid' => Str::uuid()->toString(),
            'name' => $name,
            'description' => $desc,
            'author' => $nestEmail,
        ]);
        $nest->save();
        echo "created nest: {$name} (id {$nest->id})" . PHP_EOL;
    }
    return $nestCache[$name] = $nest;
};

$targets = [];
foreach ($nestMap as $folder => $meta) {
    if (is_dir($root . '/' . $folder)) {
        $targets[] = [$root . '/' . $folder, $getNest($meta['name'], $meta['description'])];
    }
}
if (is_dir($root . '/game_eggs')) {
    $gamesNest = $getNest('Games', 'Game server eggs. Maintained by RizzDevs.');
    $targets[] = [$root . '/game_eggs', $gamesNest];
} elseif (is_dir($root)) {
    // Flat layout: treat the whole tree as games.
    $targets[] = [$root, $getNest('Games', 'Game server eggs. Maintained by RizzDevs.')];
}

$queue = [];
foreach ($targets as [$dir, $nest]) {
    $rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
    foreach ($rii as $file) {
        if (strtolower($file->getExtension()) === 'json') {
            $queue[] = [$file->getPathname(), $nest];
        }
    }
}
echo 'candidates: ' . count($queue) . PHP_EOL;

$importer = app(\Pterodactyl\Services\Eggs\Sharing\EggImporterService::class);
$ok = 0;
$skipped = 0;
$failures = [];
$i = 0;

foreach ($queue as [$path, $nest]) {
    $i++;
    $json = json_decode((string) file_get_contents($path), true);
    $version = data_get($json, 'meta.version');
    if (!in_array($version, ['PTDL_v1', 'PTDL_v2'], true)) {
        $skipped++;
        continue;
    }

    // PTDL_v2 files that still use the legacy "images" array need a docker_images map.
    if (!isset($json['docker_images']) && isset($json['images']) && is_array($json['images'])) {
        $json['docker_images'] = [];
        foreach ($json['images'] as $img) {
            $json['docker_images'][$img] = $img;
        }
        unset($json['images']);
    }

    $json['author'] = 'RizzDevs';
    if (isset($json['meta']) && is_array($json['meta'])) {
        $json['meta']['update_url'] = null;
    }

    $name = $json['name'] ?? basename($path);
    if (Egg::where('nest_id', $nest->id)->where('name', $name)->exists()) {
        $skipped++;
        continue;
    }

    $tmp = sys_get_temp_dir() . '/egg_import_' . $i . '.json';
    file_put_contents($tmp, json_encode($json, JSON_UNESCAPED_SLASHES));
    try {
        $upload = new UploadedFile($tmp, basename($tmp), 'application/json', UPLOAD_ERR_OK, true);
        $egg = $importer->handle($upload, $nest->id);
        $ok++;
        echo "ok [{$nest->name}]: {$egg->name}" . PHP_EOL;
    } catch (\Throwable $e) {
        $failures[] = $path . ' :: ' . $e->getMessage();
        echo "FAIL: " . basename($path) . ' :: ' . $e->getMessage() . PHP_EOL;
    }
    @unlink($tmp);
}

echo PHP_EOL . '===== EGG IMPORT SUMMARY =====' . PHP_EOL;
echo "imported: {$ok}" . PHP_EOL;
echo "skipped : {$skipped}" . PHP_EOL;
echo 'failed  : ' . count($failures) . PHP_EOL;
foreach ($failures as $f) {
    echo 'FAIL: ' . $f . PHP_EOL;
}

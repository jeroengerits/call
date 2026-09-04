<?php

use App\Models\Team;

return [
    'team_model' => Team::class,
    'knowledge' => [
        'max_text_bytes' => 1024 * 1024,
        'max_url_response_bytes' => 5 * 1024 * 1024,
    ],
];

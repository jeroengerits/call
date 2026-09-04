<?php

namespace Call\Telephony\Enums;

enum KnowledgeSourceStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Ready = 'ready';
    case Failed = 'failed';
}

<?php

namespace Call\Telephony\Enums;

enum KnowledgeSourceType: string
{
    case Text = 'text';
    case Url = 'url';
    case Attachment = 'attachment';
}

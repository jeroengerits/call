<?php

namespace Call\Telephony\Services;

use RuntimeException;

class UrlSafety
{
    public function validate(string $url): ?string
    {
        $parts = parse_url($url);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = $parts['host'] ?? null;

        if (! in_array($scheme, ['http', 'https'], true) || ! is_string($host)) {
            return 'The URL must use the HTTP or HTTPS scheme.';
        }

        $addresses = filter_var($host, FILTER_VALIDATE_IP)
            ? [$host]
            : $this->resolveHost($host);

        if ($addresses === []) {
            return 'The URL host could not be resolved.';
        }

        foreach ($addresses as $address) {
            if ($this->isBlockedAddress($address)) {
                return 'The URL host must resolve to a public address.';
            }
        }

        return null;
    }

    public function assertSafe(string $url): void
    {
        $message = $this->validate($url);

        if ($message !== null) {
            throw new RuntimeException($message);
        }
    }

    public function safeAddress(string $url): string
    {
        $parts = parse_url($url);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = $parts['host'] ?? null;

        if (! in_array($scheme, ['http', 'https'], true) || ! is_string($host)) {
            throw new RuntimeException('The URL must use the HTTP or HTTPS scheme.');
        }

        $addresses = filter_var($host, FILTER_VALIDATE_IP)
            ? [$host]
            : $this->resolveHost($host);

        foreach ($addresses as $address) {
            if (! $this->isBlockedAddress($address)) {
                return $address;
            }
        }

        throw new RuntimeException('The URL host must resolve to a public address.');
    }

    /** @return array<int, string> */
    private function resolveHost(string $host): array
    {
        $records = dns_get_record($host, DNS_A | DNS_AAAA);

        if ($records === false) {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn (array $record): ?string => $record['ip'] ?? $record['ipv6'] ?? null,
            $records,
        )));
    }

    private function isBlockedAddress(string $address): bool
    {
        if (filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            return true;
        }

        foreach ($this->blockedNetworks() as [$network, $prefix]) {
            if ($this->isInNetwork($address, $network, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /** @return array<int, array{string, int}> */
    private function blockedNetworks(): array
    {
        return [
            ['0.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
            ['169.254.0.0', 16], ['192.0.0.0', 24], ['192.0.2.0', 24],
            ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
            ['224.0.0.0', 4], ['240.0.0.0', 4], ['::', 128], ['::1', 128],
            ['fc00::', 7], ['fe80::', 10], ['2001:db8::', 32], ['ff00::', 8],
        ];
    }

    private function isInNetwork(string $address, string $network, int $prefix): bool
    {
        $addressBytes = inet_pton($address);
        $networkBytes = inet_pton($network);

        if ($addressBytes === false || $networkBytes === false || strlen($addressBytes) !== strlen($networkBytes)) {
            return false;
        }

        $fullBytes = intdiv($prefix, 8);
        $remainingBits = $prefix % 8;

        if (substr($addressBytes, 0, $fullBytes) !== substr($networkBytes, 0, $fullBytes)) {
            return false;
        }

        if ($remainingBits === 0) {
            return true;
        }

        $mask = 0xFF << (8 - $remainingBits) & 0xFF;

        return (ord($addressBytes[$fullBytes]) & $mask) === (ord($networkBytes[$fullBytes]) & $mask);
    }
}

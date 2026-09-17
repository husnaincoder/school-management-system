export function safeHref(urlOrNull) {
    return (urlOrNull != null && urlOrNull !== '') ? String(urlOrNull) : '/dashboard/redirect';
}

export function hasAnyRole(userRoles, allowedRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return false;
    return allowedRoles.some((r) => userRoles.includes(r));
}

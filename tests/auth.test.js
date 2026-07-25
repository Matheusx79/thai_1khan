import { describe, it, expect } from 'vitest';
import '../js/auth.js';
const { validateLoginInput, shouldPersistAttempt } = globalThis.Auth;

describe('validateLoginInput', () => {
    it('rejects an empty email', () => {
        expect(validateLoginInput({ email: '', password: 'senha123' }))
            .toEqual({ valid: false, error: 'Informe seu email.' });
    });

    it('rejects a whitespace-only email', () => {
        expect(validateLoginInput({ email: '   ', password: 'senha123' }))
            .toEqual({ valid: false, error: 'Informe seu email.' });
    });

    it('rejects an empty password', () => {
        expect(validateLoginInput({ email: 'trainee@example.com', password: '' }))
            .toEqual({ valid: false, error: 'Informe sua senha.' });
    });

    it('rejects a whitespace-only password', () => {
        expect(validateLoginInput({ email: 'trainee@example.com', password: '   ' }))
            .toEqual({ valid: false, error: 'Informe sua senha.' });
    });

    it('rejects an email with no @ symbol', () => {
        expect(validateLoginInput({ email: 'trainee.example.com', password: 'senha123' }))
            .toEqual({ valid: false, error: 'Informe um email válido.' });
    });

    it('accepts a well-formed email and non-empty password', () => {
        expect(validateLoginInput({ email: 'trainee@example.com', password: 'senha123' }))
            .toEqual({ valid: true });
    });
});

describe('shouldPersistAttempt', () => {
    it('persists the attempt when a session is present', () => {
        const session = { user: { id: 'user-1' } };
        expect(shouldPersistAttempt(session)).toBe(true);
    });

    it('does not persist the attempt when there is no session', () => {
        expect(shouldPersistAttempt(null)).toBe(false);
    });
});

import { useState, useCallback } from 'react';

interface PasswordValidationResult {
  isCompromised: boolean;
  occurrences: number;
  error: string | null;
}

export function usePasswordValidation() {
  const [checking, setChecking] = useState(false);

  const sha1Hash = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  };

  const checkPassword = useCallback(async (password: string): Promise<PasswordValidationResult> => {
    setChecking(true);
    
    try {
      const hash = await sha1Hash(password);
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);
      
      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`,
        {
          headers: {
            'Add-Padding': 'true'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al verificar contraseña');
      }
      
      const text = await response.text();
      const lines = text.split('\r\n');
      
      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix === suffix) {
          return {
            isCompromised: true,
            occurrences: parseInt(count, 10),
            error: null
          };
        }
      }
      
      return { isCompromised: false, occurrences: 0, error: null };
      
    } catch (error) {
      console.warn('Password check failed:', error);
      return { isCompromised: false, occurrences: 0, error: 'No se pudo verificar' };
    } finally {
      setChecking(false);
    }
  }, []);

  return { checkPassword, checking };
}

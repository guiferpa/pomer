import { useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para armazenar nosso valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Obter do localStorage
      const item = window.localStorage.getItem(key);

      // Parse JSON armazenado ou se nenhum retornar initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Se erro também retornar initialValue
      console.error(`Error reading localStorage key "${key}":`, error);

      return initialValue;
    }
  });

  // Retornar uma versão wrapped da função setState do useState que persiste o novo valor no localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que value seja uma função para que tenhamos a mesma API que useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Salvar estado
      setStoredValue(valueToStore);
      // Salvar no localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // Uma implementação mais avançada lidaria com o caso de erro
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

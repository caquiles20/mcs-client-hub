

## Corrección: Puntero lento al editar subservicios

### Problema
Cada tecla que se presiona en los campos de nombre o URL de un subservicio dispara una cadena de operaciones pesadas:
1. Llamada a la base de datos (Supabase UPDATE)
2. Recarga completa de todos los clientes (SELECT con joins)
3. Re-render completo del modal

Esto genera un cuello de botella que hace que la interfaz se congele entre cada tecla.

### Solucion

Cambiar la estrategia de edicion: en lugar de guardar en la base de datos con cada tecla, se editara en estado local y se guardara solo cuando el usuario termine de escribir (al salir del campo).

### Cambios tecnicos

**Archivo: `src/components/ClientEditModal.tsx`**

1. Agregar estado local para los valores de los subservicios que se estan editando (`localSubServiceValues`), un objeto `Record<number, { name: string; url: string }>`.

2. Inicializar ese estado local cada vez que cambien los datos del cliente.

3. Los inputs de nombre y URL usaran el estado local en lugar del valor directo de `subService.name` / `subService.url`.

4. El `onChange` de los inputs solo actualizara el estado local (instantaneo, sin llamadas a la base de datos).

5. Agregar un `onBlur` en cada input que llame a `handleUpdateSubService` para guardar en la base de datos solo cuando el usuario salga del campo.

**Archivo: `src/hooks/useSupabaseData.ts`**

6. En la funcion `updateSubService`, eliminar la llamada a `fetchClients()` al final, ya que el refresco completo no es necesario para una actualizacion puntual. En su lugar, actualizar el estado local de `clients` directamente.

### Resultado esperado
- Escritura fluida e inmediata en los campos de subservicios
- Los datos se guardan automaticamente al salir del campo (onBlur)
- Sin llamadas innecesarias a la base de datos mientras se escribe


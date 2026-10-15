# Guía para armar helpers en `e2e/`

Cómo decidir, diseñar y escribir un helper para los tests de Playwright + TypeScript.
Sirve para cualquier helper; al final se aplica al carrito (`e2e/helpers/cart.ts`).

Convenciones del repo: [`AGENTS.md`](../AGENTS.md). Ejemplo real ya hecho: [`e2e/helpers/auth.ts`](../e2e/helpers/auth.ts).

---

## 1. Qué es un helper (y qué no)

Un **helper** es una función reutilizable que resuelve un paso repetido de los tests, casi siempre de la **preparación** (Arrange): conseguir un token, elegir un producto, dejar un ítem en el carrito.

| Pieza | Para qué | Dónde |
|-------|----------|-------|
| **Helper** | Acciones repetidas (llamar a la API, buscar datos) | `e2e/helpers/<dominio>.ts` |
| **Datos de prueba** | Valores fijos: credenciales, payloads | `e2e/data/*.ts` |
| **Page Object** | Cómo se maneja una pantalla de la UI | `e2e/pages/<pantalla>Page.ts` |
| **Spec** | El caso de prueba: Act + Assert | `e2e/tests/...` |

> **Idea clave:** el helper **prepara**; el test **prueba**. Si el helper hace la acción que el test quiere verificar, el test deja de mostrar qué está probando.

---

## 2. Cuándo crear un helper

**Sí, cuando:**

- El mismo bloque aparece en **2 o más tests** (regla de `AGENTS.md`).
- El Arrange es tan largo que tapa lo que el test prueba.
- Si cambia algo (una URL, la forma de una respuesta), habría que corregirlo en muchos lugares.

**No, cuando:**

- Se usa una sola vez: primero escribilo en el test; si se repite, se extrae.
- Es la **acción bajo prueba** (el Act) o sus **asserts**. Eso se queda a la vista en el test.
- Solo "ahorra" una línea y obliga a abrir otro archivo para entender el test.

> **Para entrevistas:** "extraigo a helpers lo repetido del Arrange, nunca el Act ni los asserts del caso. Así los tests son cortos pero siguen leyéndose como una especificación".

---

## 3. Anatomía de un buen helper

```ts
/** Una línea: qué hace y qué devuelve. */
export async function verboQue(request: APIRequestContext, dato: Tipo): Promise<TipoDeRetorno> {
  // 1. Llamar a la API
  // 2. Verificar que la llamada salió bien (fallar temprano, con mensaje)
  // 3. Devolver SOLO lo que el test necesita después
}
```

| Parte | Regla | Por qué |
|-------|-------|---------|
| `export` | Siempre | Si no, el spec no lo puede importar. |
| Nombre | **verbo + qué**: `getToken`, `addCartItem`, `getProductWithStock` | Se lee como una acción en el test. |
| `async` / `Promise<...>` | Si llama a la API | Cada request es asíncrona; el test hace `await`. |
| `request` como **primer** parámetro | Se lo pasa el test | El helper no crea su propio cliente: usa el del test (misma `baseURL`, mismo contexto). |
| Parámetros | Solo lo que **cambia** entre usos | Lo que es siempre igual va adentro del helper. |
| Tipo de retorno | Explícito (`Promise<Product>`) | El test sabe qué recibe y el editor autocompleta. |
| Precondiciones | `expect(status, "mensaje")` o `throw new Error("mensaje")` | Si el setup falla, el test se corta acá con un mensaje claro. |
| Comentario | Una línea `/** ... */` arriba | Aparece al pasar el mouse sobre el helper en el editor. |

### `expect` o `throw` adentro del helper

- **`expect(response.status(), "mensaje").toBe(200)`** → para verificar que una llamada de preparación salió bien. Es lo que hace `getToken`.
- **`throw new Error("mensaje")`** → cuando algo puede no existir (`find` que devuelve `undefined`). Además de cortar el test, le avisa a TypeScript que de ahí en adelante el valor existe, así el helper puede prometer `Promise<Product>` en vez de `Promise<Product | undefined>`.

> Estos `expect` verifican **precondiciones** ("pude preparar el escenario"), no el comportamiento que el test prueba.

---

## 4. Paso a paso para extraer un helper

1. **Marcá las líneas repetidas** en los tests. Ejemplo: `GET /products` → status 200 → `find` → `if (!producto) throw`.
2. **Separá lo que cambia de lo que es igual.** Lo que cambia entre tests se vuelve **parámetro** (ej. el stock mínimo). Lo que es igual queda **adentro**.
3. **Mirá qué usa el test después.** Eso es lo que el helper **devuelve** (ej. el producto entero, porque el test usa `id` y `price`).
4. **Escribí la firma** antes del cuerpo: nombre, parámetros con tipo, tipo de retorno y el comentario de una línea.
5. **Mové el cuerpo** desde el test al helper, cambiando los valores fijos por los parámetros.
6. **Reemplazá en los tests** el bloque repetido por `await elHelper(request, ...)` y agregá el `import`.
7. **Corré la suite completa** (`npm run test:api`). Un refactor no cambia el comportamiento: si antes pasaba, ahora tiene que pasar igual.
8. **Commit separado** con prefijo `refactor`: `refactor(e2e): extract getProductWithStock helper`. No se mezcla con tests nuevos.

---

## 5. Ejemplo completo en otro dominio (biblioteca)

API inventada, solo para ver el patrón. No copiar al carrito: traducirlo.

**Antes** (repetido en varios tests):

```ts
const booksResponse = await request.get("/books");
expect(booksResponse.status()).toBe(200);
const books: Book[] = (await booksResponse.json()).items;
const book = books.find((candidate) => candidate.copies >= 2);
if (!book) {
  throw new Error("No book with copies >= 2");
}
```

**El helper** (`helpers/library.ts`):

```ts
import { type APIRequestContext, expect } from "@playwright/test";

export type Book = { id: number; title: string; copies: number };

/** Devuelve el primer libro del catálogo con al menos `minCopies` ejemplares. */
export async function getBookWithCopies(request: APIRequestContext, minCopies: number): Promise<Book> {
  const response = await request.get("/books");
  expect(response.status(), "GET /books en getBookWithCopies").toBe(200);

  const books: Book[] = (await response.json()).items;
  const book = books.find((candidate) => candidate.copies >= minCopies);
  if (!book) {
    throw new Error(`No book with copies >= ${minCopies}`);
  }
  return book;
}
```

**Después**, en el test:

```ts
const book = await getBookWithCopies(request, 2);
```

Qué cambió:

- El `2` fijo pasó a ser el parámetro `minCopies`.
- El mensaje del `expect` dice en qué helper falló, para encontrarlo rápido en el reporte.
- El tipo `Book` se exporta desde el helper, así el spec lo puede importar.
- Las seis líneas del Arrange quedaron en una, y se lee qué se necesita: "un libro con 2 ejemplares".

---

## 6. Aplicación al carrito (`e2e/helpers/cart.ts`)

Helpers que va a necesitar el bloque de tests del carrito, en el orden en que conviene hacerlos:

| Helper | Recibe | Devuelve | Se usa en |
|--------|--------|----------|-----------|
| `getProductWithStock` | `request`, `minStock` | `Promise<Product>` | Todos los tests que agregan productos |
| `addCartItem` | `request`, `token`, `productId`, `quantity` | `Promise<CartItem>` | Arrange de los tests de PATCH, DELETE, sumar cantidades y stock |

- **`getProductWithStock`**: es el bloque de "elegir producto" del test que suma cantidades (`GET /products` → status → `find` → `throw`), con `minStock` como parámetro.
- **`addCartItem`**: hace `POST /cart/items` con `authHeader(token)`, verifica el 200 con mensaje y devuelve el body tipado. Es para **dejar un ítem en el carrito antes** del caso. En los tests donde el `POST` **es** lo que se prueba (agregar, errores de stock al agregar), el `POST` se escribe en el test, no con el helper: tiene que verse la request y su respuesta.

### Dónde van los tipos `Product` y `CartItem`

Hoy están en el spec, pero el helper también los necesita y no puede importarlos de un spec.

| Opción | A favor | En contra |
|--------|---------|-----------|
| **A. Exportarlos desde `helpers/cart.ts`** (recomendada por ahora) | Un solo archivo nuevo; el spec los importa junto con los helpers | Si otro dominio (pedidos) los necesita, importaría tipos desde "cart" |
| B. Archivo propio, ej. `e2e/types/api.ts` | Separación clara; sirve para cualquier spec | Una carpeta más para pocos tipos |

Arrancar con **A** y pasar a **B** cuando el spec de pedidos (`/orders`) necesite los mismos tipos.

---

## 7. Checklist de revisión

- [ ] Se repite en 2 o más tests (o lo va a hacer en el siguiente paso).
- [ ] Nombre con verbo + qué; comentario de una línea arriba.
- [ ] `export`, `async` y tipo de retorno explícito.
- [ ] `request` como primer parámetro; nada de valores fijos que deberían ser parámetros.
- [ ] Verifica sus llamadas con `expect(..., "mensaje")` o `throw` con mensaje.
- [ ] Devuelve solo lo que el test usa.
- [ ] No contiene el Act ni los asserts del caso.
- [ ] No guarda estado entre llamadas (nada de variables globales): cada test que lo usa queda independiente.
- [ ] La suite completa pasa igual que antes del refactor.
- [ ] Commit propio: `refactor(e2e): ...`.

---

## 8. Errores comunes

| Error | Qué pasa | Cómo evitarlo |
|-------|----------|---------------|
| Olvidar el `export` | `Module has no exported member` al importar | Exportar cada helper y tipo que use un spec. |
| Olvidar el `await` al llamarlo | Llega una `Promise` en vez del dato: `product.id` da `undefined` | `const x = await helper(...)`. |
| Devolver `undefined` en vez de cortar | El test falla más abajo con `Cannot read properties of undefined` | `throw` con mensaje adentro del helper. |
| Meter los asserts del caso en el helper | El test pasa sin mostrar qué verifica | El helper solo verifica que la preparación salió bien. |
| Un helper que hace demasiado (`setupCartWithThreeItemsAndCheckout`) | Nadie sabe qué hace sin abrirlo; no se reutiliza | Una responsabilidad por helper; se combinan en el test. |
| Usar el usuario demo adentro del helper | Los tests comparten carrito y dejan de ser independientes | El token lo recibe por parámetro; el test lo crea con `newUserToken`. |

---

## 9. Cómo explicarlo en una entrevista

> "Cuando un paso de preparación se repite en dos o más tests, lo extraigo a un helper tipado: recibe el cliente de Playwright y solo los datos que cambian, verifica sus propias llamadas con mensajes claros y devuelve lo que el test necesita. Los helpers nunca contienen la acción bajo prueba ni sus asserts, así cada test sigue mostrando qué verifica. Cada extracción es un commit de refactor aparte, y la suite tiene que pasar igual que antes."

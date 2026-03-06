# Wialon Drivers App

Aplicacion estatica para Wialon publicada en GitHub Pages usando el SDK oficial `wialon.js`.

## Parametros soportados

- `authHash` obligatorio para la version publicada
- `baseUrl` opcional, por defecto `https://hst-api.wialon.com`
- `user`
- `lang`
- `b`
- `v`
- `sid` solo informativo en esta version

## URL recomendada

```text
https://dsanchodigittecnic.github.io/iberotrack-wialon-control/index.html?authHash=AUTH_HASH_RECIENTE&user=davidsancho4%40gmail.com&b=stable&v=1.51&baseUrl=https%3A%2F%2Fhst-api.wialon.com&lang=es
```

## Notas importantes

1. `authHash` caduca rapido en Wialon. Debes abrir la app poco despues de generarlo.
2. Esta version evita `fetch` directo al Remote API y usa el SDK oficial para funcionar mejor en navegador.
3. Si el hash ha caducado, la app muestra un error claro y no intentara usar solo `sid`.

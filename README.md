# Wialon Drivers App

Aplicacion estatica para Wialon publicada en GitHub Pages usando el SDK oficial `wialon.js`.

## Parametros soportados

- `sid` recomendado cuando ya vienes desde Wialon
- `authHash` como fallback si no hay `sid`
- `baseUrl` opcional, por defecto `https://hst-api.wialon.com`
- `user`
- `lang`
- `b`
- `v`

## URL recomendada

```text
https://dsanchodigittecnic.github.io/iberotrack-wialon-control/index.html?sid=SID_RECIEN_GENERADO&user=davidsancho4%40gmail.com&b=stable&v=1.51&baseUrl=https%3A%2F%2Fhst-api.wialon.com&lang=es
```

## Notas importantes

1. Si envias `sid`, la app consulta directamente con ese `sid`.
2. Si no hay `sid`, la app intenta autenticar con `authHash`.
3. `authHash` caduca rapido en Wialon. Debes abrir la app poco despues de generarlo.

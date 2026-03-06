# Wialon Drivers App

Aplicacion estatica para Wialon que lee los parametros de la URL y muestra los conductores disponibles en cards.

## Parametros soportados

- `sid`
- `authHash`
- `baseUrl`
- `hostUrl`
- `user`
- `lang`
- `b`
- `v`

## Ejemplo de uso

```text
index.html?sid=026085dce21dcf6120bcfa1d922fda20&b=stable&authHash=0135c58bd6702db42c962e0126f00ebd&hostUrl=https%3A%2F%2Fcms.wialon.com&user=AliceNorris&v=1.51&baseUrl=https%3A%2F%2Fhst-api.wialon.com&lang=en
```

## Que hace

1. Toma la sesion desde `sid` o, si no existe, intenta autenticarse con `authHash`.
2. Consulta los recursos `avl_resource` que tienen conductores (`drvrs`).
3. Consulta las unidades para mostrar el nombre de la unidad asignada a cada conductor.
4. Renderiza cada conductor en una card responsive.

## Archivos

- `index.html`
- `styles.css`
- `app.js`

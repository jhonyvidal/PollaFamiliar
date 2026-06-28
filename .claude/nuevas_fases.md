# Nuevo requerimiento - Sistema de Polla Mundial

## Contexto

Actualmente el sistema de polla permite crear partidos y los usuarios realizan pronósticos sobre ellos. Todos los partidos otorgan la misma cantidad de puntos cuando un usuario acierta el resultado.

Se requiere implementar una nueva funcionalidad para que el puntaje dependa de la fase del torneo.

---

## Objetivo

Modificar el sistema para que cada partido tenga asociado un **tipo de fase** (etapa del torneo) y que el puntaje otorgado por acertar el resultado dependa de dicha fase.

---

## Cambios funcionales

### 1. Agregar el tipo de partido

Al momento de crear o editar un partido, el administrador deberá poder seleccionar la fase a la que pertenece.

Las opciones serán:

* Fase de grupos
* Dieciseisavos de final
* Octavos de final
* Cuartos de final
* Semifinal
* Tercer puesto
* Final

Este valor debe almacenarse en la base de datos.

---

### 2. Configuración de puntos

Los puntos **NO deben quedar fijos en el código**.

Cada tipo de fase tendrá una configuración de puntaje que podrá modificarse desde la configuración de la serie o torneo.

Ejemplo:

| Tipo de partido | Puntos |
| --------------- | ------ |
| Fase de grupos  | 3      |
| Dieciseisavos   | 5      |
| Octavos         | 5      |
| Cuartos         | 10     |
| Semifinal       | 15     |
| Tercer puesto   | 15     |
| Final           | 20     |

Estos valores son únicamente un ejemplo.

La idea es que un administrador pueda configurar cuántos puntos vale cada fase sin necesidad de modificar el código.

---

### 3. Cálculo de puntajes

Cuando se calculen los resultados de la polla:

* El sistema deberá consultar el tipo del partido.
* Obtener el puntaje configurado para esa fase.
* Asignar dicho puntaje al usuario si acertó el pronóstico.

No debe existir ninguna lógica con valores fijos (3, 5, 10, etc.) dentro del código.

---

### 4. Cambios en la interfaz

En la pantalla de creación y edición de partidos:

* Agregar un nuevo campo llamado **Fase del partido**.
* Mostrar un selector (Combo/Select) con las fases disponibles.
* Debe ser obligatorio.

---

### 5. Base de datos

Realizar los cambios necesarios para:

* Agregar el campo `matchStage` (o el nombre que se considere apropiado) en la tabla de partidos.
* Crear la estructura donde se almacene la configuración de puntajes por fase (si aún no existe).

La solución debe permitir agregar nuevas fases en el futuro sin modificar la lógica del sistema.

---

## Requisitos técnicos

* Evitar valores quemados (Hardcoded).
* Utilizar enums para las fases del torneo.
* Centralizar la lógica del cálculo de puntos.
* Mantener compatibilidad con el funcionamiento actual.
* Implementar migraciones para la base de datos.
* Actualizar DTOs, entidades, validaciones y APIs necesarias.
* Actualizar el frontend para soportar el nuevo campo.

---

## Criterios de aceptación

* El administrador puede seleccionar la fase del partido.
* El tipo de partido queda almacenado correctamente.
* Los puntos otorgados dependen de la configuración de la fase.
* Cambiar la configuración modifica automáticamente los puntos de futuros cálculos sin cambiar el código.
* El ranking de la polla refleja correctamente el puntaje según la fase del partido.
* La solución es escalable para futuras fases del torneo.

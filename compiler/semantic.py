
from compiler.lexer import analizar_lexico
from compiler.parser import analizar_sintaxis


def analizar_semantica(codigo):
    resultado_sintactico = analizar_sintaxis(codigo)

    if not resultado_sintactico["correcto"]:
        return {
            "correcto": False,
            "errores": [{
                "mensaje": (
                    "No se puede realizar el análisis semántico "
                    "porque existen errores léxicos o sintácticos."
                )
            }],
            "reglas": [],
        }

    tokens, _ = analizar_lexico(codigo)

    errores = []
    reglas = []
    reglas_vistas = set()

    # Cada regla válida contiene exactamente 9 tokens.
    for i in range(0, len(tokens), 9):
        grupo = tokens[i:i + 9]

        edad = int(grupo[1].valor)
        vacuna = grupo[4].valor
        dosis = int(grupo[7].valor)

        regla = {
            "edad_meses": edad,
            "vacuna": vacuna,
            "dosis": dosis,
            "linea": grupo[0].linea,
        }

        if edad <= 0:
            errores.append({
                "mensaje": "La edad debe ser mayor que cero.",
                "linea": grupo[1].linea,
            })

        if dosis <= 0:
            errores.append({
                "mensaje": "El número de dosis debe ser mayor que cero.",
                "linea": grupo[7].linea,
            })

        clave = (edad, vacuna, dosis)

        if clave in reglas_vistas:
            errores.append({
                "mensaje": (
                    f"Regla duplicada: edad {edad} meses, "
                    f"vacuna {vacuna}, dosis {dosis}."
                ),
                "linea": grupo[0].linea,
            })
        else:
            reglas_vistas.add(clave)

        reglas.append(regla)

    return {
        "correcto": len(errores) == 0,
        "errores": errores,
        "reglas": reglas,
    }

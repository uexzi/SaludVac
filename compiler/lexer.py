
import re
from dataclasses import dataclass


@dataclass
class Token:
    tipo: str
    valor: str
    linea: int
    columna: int

    def to_dict(self):
        return {
            "tipo": self.tipo,
            "valor": self.valor,
            "linea": self.linea,
            "columna": self.columna,
        }


PATRON_TOKEN = re.compile(
    r"(?P<ESPACIO>\s+)"
    r"|(?P<NUMERO>\d+)"
    r"|(?P<IDENTIFICADOR>[A-Z][A-Z0-9_]*)"
    r"|(?P<DOS_PUNTOS>:)"
    r"|(?P<COMA>,)"
    r"|(?P<PUNTO_COMA>;)"
)

PALABRAS_RESERVADAS = {
    "A_LOS": "A_LOS",
    "MESES": "MESES",
    "DOSIS": "DOSIS",
}


def analizar_lexico(codigo):
    tokens = []
    errores = []

    linea = 1
    columna = 1
    posicion = 0

    while posicion < len(codigo):
        coincidencia = PATRON_TOKEN.match(codigo, posicion)

        if coincidencia is None:
            caracter = codigo[posicion]

            errores.append({
                "mensaje": f"Carácter no permitido: {caracter!r}",
                "linea": linea,
                "columna": columna,
            })

            posicion += 1

            if caracter == "\n":
                linea += 1
                columna = 1
            else:
                columna += 1

            continue

        tipo = coincidencia.lastgroup
        valor = coincidencia.group()
        token_linea = linea
        token_columna = columna

        posicion = coincidencia.end()

        if tipo == "ESPACIO":
            saltos = valor.count("\n")

            if saltos:
                linea += saltos
                columna = len(valor) - valor.rfind("\n")
            else:
                columna += len(valor)

            continue

        if tipo == "IDENTIFICADOR":
            tipo = PALABRAS_RESERVADAS.get(
                valor, "IDENTIFICADOR"
            )

        tokens.append(
            Token(
                tipo=tipo,
                valor=valor,
                linea=token_linea,
                columna=token_columna,
            )
        )

        columna += len(valor)

    return tokens, errores

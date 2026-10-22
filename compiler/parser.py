
from compiler.lexer import analizar_lexico


class ErrorSintactico(Exception):
    pass


class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.posicion = 0

    def actual(self):
        if self.posicion < len(self.tokens):
            return self.tokens[self.posicion]
        return None

    def consumir(self, tipo):
        token = self.actual()

        if token is None or token.tipo != tipo:
            encontrado = (
                f"{token.tipo} ({token.valor!r})"
                if token else "fin del programa"
            )
            raise ErrorSintactico(
                f"Se esperaba {tipo}, pero se encontró {encontrado}."
            )

        self.posicion += 1
        return token

    def analizar(self):
        if not self.tokens:
            raise ErrorSintactico("El programa está vacío.")

        while self.actual() is not None:
            self.regla_vacunacion()

        return True

    def regla_vacunacion(self):
        self.consumir("A_LOS")
        self.consumir("NUMERO")
        self.consumir("MESES")
        self.consumir("DOS_PUNTOS")
        self.consumir("IDENTIFICADOR")
        self.consumir("COMA")
        self.consumir("DOSIS")
        self.consumir("NUMERO")
        self.consumir("PUNTO_COMA")


def analizar_sintaxis(codigo):
    tokens, errores_lexicos = analizar_lexico(codigo)

    if errores_lexicos:
        return {
            "correcto": False,
            "errores": [
                {
                    "mensaje": error["mensaje"],
                    "linea": error["linea"],
                    "columna": error["columna"],
                }
                for error in errores_lexicos
            ],
        }

    try:
        parser = Parser(tokens)
        parser.analizar()

        return {
            "correcto": True,
            "errores": [],
        }

    except ErrorSintactico as error:
        token = (
            parser.actual()
            if parser.actual() is not None
            else None
        )

        return {
            "correcto": False,
            "errores": [{
                "mensaje": str(error),
                "linea": token.linea if token else None,
                "columna": token.columna if token else None,
            }],
        }

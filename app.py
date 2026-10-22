
from flask import Flask, render_template, request, jsonify

from compiler.lexer import analizar_lexico
from compiler.parser import analizar_sintaxis
from compiler.semantic import analizar_semantica

app = Flask(__name__)


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/api/analizar", methods=["POST"])
def analizar():
    datos = request.get_json(silent=True) or {}
    codigo = datos.get("codigo", "")

    if not isinstance(codigo, str):
        return jsonify({
            "error": "El código debe ser texto."
        }), 400

    tokens, errores = analizar_lexico(codigo)

    return jsonify({
        "tokens": [token.to_dict() for token in tokens],
        "errores_lexicos": errores,
        "cantidad_tokens": len(tokens),
        "analisis_lexico_correcto": len(errores) == 0,
    })

@app.route("/api/sintaxis", methods=["POST"])
def analizar_sintaxis_api():
    datos = request.get_json(silent=True) or {}
    codigo = datos.get("codigo", "")

    if not isinstance(codigo, str):
        return jsonify({
            "error": "El código debe ser texto."
        }), 400

    resultado = analizar_sintaxis(codigo)

    return jsonify(resultado)


@app.route("/api/semantica", methods=["POST"])
def analizar_semantica_api():
    datos = request.get_json(silent=True) or {}
    codigo = datos.get("codigo", "")

    if not isinstance(codigo, str):
        return jsonify({
            "error": "El código debe ser texto."
        }), 400

    resultado = analizar_semantica(codigo)

    return jsonify(resultado)


if __name__ == "__main__":
    app.run(debug=True)

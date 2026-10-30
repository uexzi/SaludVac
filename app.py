
from flask import Flask, render_template, request, jsonify

from compiler.lexer import analizar_lexico
from compiler.parser import analizar_sintaxis
from compiler.semantic import analizar_semantica

app = Flask(__name__)

USUARIOS = [
    {
        "id": 1,
        "nombre": "Dra. Andrea López",
        "correo": "andrea.lopez@saludvac.demo",
        "rol": "ADMINISTRADOR",
        "estado": "ACTIVO",
    },
    {
        "id": 2,
        "nombre": "Carlos Ramírez",
        "correo": "carlos.ramirez@saludvac.demo",
        "rol": "PERSONAL_DE_SALUD",
        "estado": "ACTIVO",
    },
    {
        "id": 3,
        "nombre": "Lucía Torres",
        "correo": "lucia.torres@saludvac.demo",
        "rol": "PERSONAL_DE_SALUD",
        "estado": "INACTIVO",
    },
]
SIGUIENTE_USUARIO_ID = 4


def validar_usuario(datos):
    nombre = datos.get("nombre", "").strip()
    correo = datos.get("correo", "").strip().lower()
    rol = datos.get("rol", "")
    estado = datos.get("estado", "")

    if not nombre or not correo or "@" not in correo:
        return None, "Ingresa un nombre y correo válidos."

    if rol not in {"ADMINISTRADOR", "PERSONAL_DE_SALUD"}:
        return None, "Selecciona un rol válido."

    if estado not in {"ACTIVO", "INACTIVO"}:
        return None, "Selecciona un estado válido."

    return {
        "nombre": nombre,
        "correo": correo,
        "rol": rol,
        "estado": estado,
    }, None


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/administracion")
def administracion():
    return render_template("admin.html")


@app.route("/api/usuarios", methods=["GET", "POST"])
def gestionar_usuarios():
    global SIGUIENTE_USUARIO_ID

    if request.method == "GET":
        return jsonify({"usuarios": USUARIOS})

    usuario, error = validar_usuario(request.get_json(silent=True) or {})

    if error:
        return jsonify({"error": error}), 400

    if any(actual["correo"] == usuario["correo"] for actual in USUARIOS):
        return jsonify({"error": "Ya existe un usuario con ese correo."}), 409

    usuario["id"] = SIGUIENTE_USUARIO_ID
    SIGUIENTE_USUARIO_ID += 1
    USUARIOS.append(usuario)

    return jsonify({"usuario": usuario}), 201


@app.route("/api/usuarios/<int:usuario_id>", methods=["PUT", "DELETE"])
def gestionar_usuario(usuario_id):
    usuario_actual = next(
        (usuario for usuario in USUARIOS if usuario["id"] == usuario_id),
        None,
    )

    if usuario_actual is None:
        return jsonify({"error": "Usuario no encontrado."}), 404

    if request.method == "DELETE":
        USUARIOS.remove(usuario_actual)
        return jsonify({"mensaje": "Usuario eliminado correctamente."})

    usuario, error = validar_usuario(request.get_json(silent=True) or {})

    if error:
        return jsonify({"error": error}), 400

    if any(
        actual["correo"] == usuario["correo"] and actual["id"] != usuario_id
        for actual in USUARIOS
    ):
        return jsonify({"error": "Ya existe un usuario con ese correo."}), 409

    usuario_actual.update(usuario)
    return jsonify({"usuario": usuario_actual})


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

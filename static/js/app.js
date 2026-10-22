
const editor = document.getElementById("source-code");
const analyzeButton = document.getElementById("analyze-button");
const clearButton = document.getElementById("clear-button");
const message = document.getElementById("analysis-message");
const lineCount = document.getElementById("line-count");

const lexicalResults = document.getElementById("lexical-results");
const syntaxResults = document.getElementById("syntax-results");
const semanticResults = document.getElementById("semantic-results");

function updateLineCount() {
    const lines = editor.value.split("\n").length;
    lineCount.textContent = `Líneas: ${lines}`;
}

function showLexicalResults(data) {
    lexicalResults.replaceChildren();

    if (data.tokens.length === 0) {
        lexicalResults.textContent = "No se reconocieron tokens.";
    } else {
        const table = document.createElement("table");
        table.className = "token-table";

        const header = document.createElement("tr");

        ["Tipo", "Valor", "Línea", "Columna"].forEach(text => {
            const th = document.createElement("th");
            th.textContent = text;
            header.appendChild(th);
        });

        table.appendChild(header);

        data.tokens.forEach(token => {
            const row = document.createElement("tr");

            [
                token.tipo,
                token.valor,
                token.linea,
                token.columna
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            table.appendChild(row);
        });

        lexicalResults.appendChild(table);
    }

    if (data.errores_lexicos.length > 0) {
        const list = document.createElement("ul");

        data.errores_lexicos.forEach(error => {
            const item = document.createElement("li");

            item.textContent =
                `${error.mensaje} ` +
                `(línea ${error.linea}, columna ${error.columna})`;

            list.appendChild(item);
        });

        lexicalResults.appendChild(list);
    }
}

analyzeButton.addEventListener("click", async () => {
    const codigo = editor.value;

    if (!codigo.trim()) {
        message.textContent = "Escribe una regla antes de analizar.";
        return;
    }

    analyzeButton.disabled = true;
    message.textContent = "Ejecutando análisis léxico...";

    try {
        const response = await fetch("/api/analizar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ codigo })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "No se pudo analizar el código.");
        }

        showLexicalResults(data);

        const syntaxResponse = await fetch("/api/sintaxis", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ codigo })
        });
        
        const syntaxData = await syntaxResponse.json();
        
        if (!syntaxResponse.ok) {
            throw new Error(
                syntaxData.error || "Error en el análisis sintáctico."
            );
        }
        
        syntaxResults.replaceChildren();
        
        const syntaxMessage = document.createElement("p");
        syntaxMessage.textContent = syntaxData.correcto
            ? "Sintaxis correcta."
            : "Se encontraron errores sintácticos.";
        
        syntaxResults.appendChild(syntaxMessage);

        syntaxData.errores.forEach(error => {
            const item = document.createElement("p");
            item.textContent =
                `${error.mensaje} (línea ${error.linea ?? "?"}, ` +
                `columna ${error.columna ?? "?"})`;
        
            syntaxResults.appendChild(item);
        });
        
        const semanticResponse = await fetch("/api/semantica", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ codigo })
        });

        const semanticData = await semanticResponse.json();

        if (!semanticResponse.ok) {
            throw new Error(
                semanticData.error || "Error en el análisis semántico."
            );
        }

        semanticResults.replaceChildren();

        const semanticMessage = document.createElement("p");
        semanticMessage.textContent = semanticData.correcto
            ? `Análisis semántico correcto. ${semanticData.reglas.length} reglas procesadas.`
            : "Se encontraron errores semánticos.";

        semanticResults.appendChild(semanticMessage);

        semanticData.errores.forEach(error => {
            const item = document.createElement("p");
        
            item.textContent = error.linea
                ? `${error.mensaje} (línea ${error.linea})`
                : error.mensaje;
        
            semanticResults.appendChild(item);
        });
        
        if (data.errores_lexicos.length > 0) {
            message.textContent =
                `Análisis léxico fallido: ${data.errores_lexicos.length} errores.`;
        } else if (!syntaxData.correcto) {
            message.textContent = "Análisis sintáctico fallido.";
        } else if (!semanticData.correcto) {
            message.textContent = "Análisis semántico fallido.";
        } else {
            message.textContent =
                `Compilación correcta: ${data.cantidad_tokens} tokens reconocidos.`;
        }

            } catch (error) {
                message.textContent = `Error: ${error.message}`;
            } finally {
                analyzeButton.disabled = false;
            }
        });

clearButton.addEventListener("click", () => {
    editor.value = "";
    updateLineCount();

    lexicalResults.textContent = "Pendiente de ejecución";
    syntaxResults.textContent = "Pendiente de ejecución";
    semanticResults.textContent = "Pendiente de ejecución";

    message.textContent = "Editor limpiado.";
    editor.focus();
});

updateLineCount();

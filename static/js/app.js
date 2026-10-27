const editor = document.getElementById("source-code");
const analyzeButton = document.getElementById("analyze-button");
const clearButton = document.getElementById("clear-button");
const loadExampleButton = document.getElementById("load-example-button");
const message = document.getElementById("analysis-message-text");
const lineCount = document.getElementById("line-count");
const resultsState = document.getElementById("results-state");

const lexicalResults = document.getElementById("lexical-results");
const syntaxResults = document.getElementById("syntax-results");
const semanticResults = document.getElementById("semantic-results");
const resultTabs = [...document.querySelectorAll("[data-result-tab]")];
const resultPanels = [...document.querySelectorAll("[data-result-panel]")];
const exampleProgram = editor.value.trim();

function updateLineCount() {
    const lines = editor.value.split("\n").length;
    lineCount.textContent = `Líneas: ${lines}`;
}

function selectResultTab(phase) {
    resultTabs.forEach(tab => {
        const isActive = tab.dataset.resultTab === phase;

        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
    });

    resultPanels.forEach(panel => {
        const isActive = panel.dataset.resultPanel === phase;

        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
    });
}

function setResultsState(label, state = "") {
    resultsState.className = "results-state";

    if (state) {
        resultsState.classList.add(state);
    }

    const indicator = document.createElement("i");
    resultsState.replaceChildren(indicator, document.createTextNode(` ${label}`));
}

function setTabStatus(phase, state = "") {
    const tab = resultTabs.find(item => item.dataset.resultTab === phase);
    const indicator = tab?.querySelector(".tab-status");

    if (!indicator) {
        return;
    }

    indicator.classList.remove("is-success", "is-error");

    if (state) {
        indicator.classList.add(state);
    }
}

function resetResults() {
    lexicalResults.textContent = "Esperando el análisis léxico...";
    syntaxResults.textContent = "Esperando la validación sintáctica...";
    semanticResults.textContent = "Esperando la validación semántica...";

    ["lexical", "syntax", "semantic"].forEach(phase => {
        setTabStatus(phase);
    });

    selectResultTab("lexical");
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
                `${error.mensaje} (línea ${error.linea}, columna ${error.columna})`;
            list.appendChild(item);
        });

        lexicalResults.appendChild(list);
    }
}

function showSyntaxResults(data) {
    syntaxResults.replaceChildren();

    const messageElement = document.createElement("p");
    messageElement.textContent = data.correcto
        ? "Sintaxis correcta. La estructura de las reglas es válida."
        : "Se encontraron errores sintácticos.";
    syntaxResults.appendChild(messageElement);

    data.errores.forEach(error => {
        const item = document.createElement("p");
        item.textContent =
            `${error.mensaje} (línea ${error.linea ?? "?"}, columna ${error.columna ?? "?"})`;
        syntaxResults.appendChild(item);
    });
}

function showSemanticResults(data) {
    semanticResults.replaceChildren();

    const messageElement = document.createElement("p");
    messageElement.textContent = data.correcto
        ? `Análisis semántico correcto. ${data.reglas.length} reglas procesadas.`
        : "Se encontraron errores semánticos.";
    semanticResults.appendChild(messageElement);

    data.errores.forEach(error => {
        const item = document.createElement("p");
        item.textContent = error.linea
            ? `${error.mensaje} (línea ${error.linea})`
            : error.mensaje;
        semanticResults.appendChild(item);
    });
}

resultTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        selectResultTab(tab.dataset.resultTab);
    });
});

analyzeButton.addEventListener("click", async () => {
    const codigo = editor.value;

    if (!codigo.trim()) {
        message.textContent = "Escribe una regla antes de analizar.";
        setResultsState("Sin código", "is-error");
        selectResultTab("lexical");
        return;
    }

    analyzeButton.disabled = true;
    message.textContent = "Analizando el programa en sus tres fases...";
    resetResults();
    setResultsState("Analizando...", "is-running");

    try {
        const response = await fetch("/api/analizar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ codigo })
        });

        const lexicalData = await response.json();

        if (!response.ok) {
            throw new Error(lexicalData.error || "No se pudo analizar el código.");
        }

        showLexicalResults(lexicalData);
        const lexicalIsCorrect = lexicalData.errores_lexicos.length === 0;
        setTabStatus("lexical", lexicalIsCorrect ? "is-success" : "is-error");

        const syntaxResponse = await fetch("/api/sintaxis", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ codigo })
        });

        const syntaxData = await syntaxResponse.json();

        if (!syntaxResponse.ok) {
            throw new Error(syntaxData.error || "Error en el análisis sintáctico.");
        }

        showSyntaxResults(syntaxData);
        setTabStatus("syntax", syntaxData.correcto ? "is-success" : "is-error");

        const semanticResponse = await fetch("/api/semantica", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ codigo })
        });

        const semanticData = await semanticResponse.json();

        if (!semanticResponse.ok) {
            throw new Error(semanticData.error || "Error en el análisis semántico.");
        }

        showSemanticResults(semanticData);
        setTabStatus("semantic", semanticData.correcto ? "is-success" : "is-error");

        if (!lexicalIsCorrect) {
            message.textContent =
                `Análisis léxico fallido: ${lexicalData.errores_lexicos.length} errores.`;
            setResultsState("Error léxico", "is-error");
            selectResultTab("lexical");
        } else if (!syntaxData.correcto) {
            message.textContent = "Análisis sintáctico fallido. Revisa la segunda fase.";
            setResultsState("Error de sintaxis", "is-error");
            selectResultTab("syntax");
        } else if (!semanticData.correcto) {
            message.textContent = "Análisis semántico fallido. Revisa la tercera fase.";
            setResultsState("Reglas por revisar", "is-error");
            selectResultTab("semantic");
        } else {
            message.textContent =
                `Compilación correcta: ${lexicalData.cantidad_tokens} tokens reconocidos.`;
            setResultsState("Análisis completo", "is-success");
            selectResultTab("semantic");
        }
    } catch (error) {
        message.textContent = `Error: ${error.message}`;
        setResultsState("Error de ejecución", "is-error");
    } finally {
        analyzeButton.disabled = false;
    }
});

clearButton.addEventListener("click", () => {
    editor.value = "";
    updateLineCount();
    resetResults();
    setResultsState("Listo", "");
    message.textContent = "Editor limpiado. Escribe una nueva regla para analizar.";
    editor.focus();
});

loadExampleButton.addEventListener("click", () => {
    editor.value = exampleProgram;
    updateLineCount();
    resetResults();
    setResultsState("Ejemplo cargado", "");
    message.textContent =
        "Se cargó el esquema académico de demostración con 10 reglas.";
    editor.focus();
});

editor.addEventListener("input", updateLineCount);
updateLineCount();

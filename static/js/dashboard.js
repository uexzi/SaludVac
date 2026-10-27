const defaultRules = [
    { age: 2, vaccine: "PENTAVALENTE", dose: 1 },
    { age: 2, vaccine: "ROTAVIRUS", dose: 1 },
    { age: 2, vaccine: "NEUMOCOCO", dose: 1 },
    { age: 4, vaccine: "PENTAVALENTE", dose: 2 },
    { age: 4, vaccine: "ROTAVIRUS", dose: 2 },
    { age: 4, vaccine: "NEUMOCOCO", dose: 2 },
    { age: 6, vaccine: "PENTAVALENTE", dose: 3 },
    { age: 6, vaccine: "INFLUENZA", dose: 1 },
    { age: 12, vaccine: "SRP", dose: 1 },
    { age: 18, vaccine: "REFUERZO_DPT", dose: 1 }
];

const vaccineLabels = {
    PENTAVALENTE: "Pentavalente",
    ROTAVIRUS: "Rotavirus",
    NEUMOCOCO: "Neumococo",
    INFLUENZA: "Influenza",
    SRP: "SRP",
    REFUERZO_DPT: "Refuerzo DPT"
};

const ruleForm = document.getElementById("rule-form");
const ageInput = document.getElementById("age-input");
const vaccineInput = document.getElementById("vaccine-input");
const doseInput = document.getElementById("dose-input");
const scheduleList = document.getElementById("schedule-list");
const restoreSchemeButton = document.getElementById("restore-scheme-button");
const validateSchemeButton = document.getElementById("validate-scheme-button");
const validationResult = document.getElementById("validation-result");
const formFeedback = document.getElementById("form-feedback");
const summaryRuleCount = document.getElementById("summary-rule-count");
const summaryNextAge = document.getElementById("summary-next-age");
const summaryNextVaccine = document.getElementById("summary-next-vaccine");
const summaryValidation = document.getElementById("summary-validation");
const heroRuleCount = document.getElementById("hero-rule-count");
const schemeCountBadge = document.getElementById("scheme-count-badge");

let nextRuleId = 1;
let rules = createDefaultRules();

function createDefaultRules() {
    return defaultRules.map(rule => ({ ...rule, id: nextRuleId++ }));
}

function getVaccineLabel(vaccine) {
    return vaccineLabels[vaccine] || vaccine.replaceAll("_", " ");
}

function formatDose(dose) {
    const names = ["", "Primera dosis", "Segunda dosis", "Tercera dosis", "Cuarta dosis"];
    return names[dose] || `Dosis ${dose}`;
}

function updateSummary() {
    const total = rules.length;

    summaryRuleCount.textContent = total;
    heroRuleCount.textContent = total;
    schemeCountBadge.textContent = `${total} ${total === 1 ? "dosis" : "dosis"}`;

    if (total === 0) {
        summaryNextAge.textContent = "Sin dosis";
        summaryNextVaccine.textContent = "Agrega una dosis al esquema";
        return;
    }

    const nextAge = Math.min(...rules.map(rule => rule.age));
    const nextAgeRules = rules.filter(rule => rule.age === nextAge);

    summaryNextAge.textContent = `${nextAge} ${nextAge === 1 ? "mes" : "meses"}`;
    summaryNextVaccine.textContent =
        `${nextAgeRules.length} ${nextAgeRules.length === 1 ? "vacuna programada" : "vacunas programadas"}`;
}

function renderSchedule() {
    scheduleList.replaceChildren();

    if (rules.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "care-empty-scheme";
        emptyMessage.textContent = "Aún no hay dosis en el esquema. Agrega una desde el formulario.";
        scheduleList.appendChild(emptyMessage);
        updateSummary();
        return;
    }

    const groups = new Map();

    [...rules]
        .sort((first, second) => first.age - second.age || first.vaccine.localeCompare(second.vaccine))
        .forEach(rule => {
            const ageRules = groups.get(rule.age) || [];
            ageRules.push(rule);
            groups.set(rule.age, ageRules);
        });

    groups.forEach((ageRules, age) => {
        const group = document.createElement("article");
        group.className = "care-age-group";

        const heading = document.createElement("header");
        const ageMark = document.createElement("span");
        ageMark.className = "care-age-mark";
        ageMark.textContent = age;

        const headingCopy = document.createElement("div");
        const title = document.createElement("h4");
        title.textContent = `A los ${age} ${age === 1 ? "mes" : "meses"}`;
        const subtitle = document.createElement("p");
        subtitle.textContent =
            `${ageRules.length} ${ageRules.length === 1 ? "dosis programada" : "dosis programadas"}`;
        headingCopy.append(title, subtitle);
        heading.append(ageMark, headingCopy);

        const doses = document.createElement("div");
        doses.className = "care-dose-list";

        ageRules.forEach(rule => {
            const dose = document.createElement("div");
            dose.className = "care-dose-item";

            const icon = document.createElement("span");
            icon.className = "care-dose-icon";
            icon.textContent = "✚";

            const copy = document.createElement("div");
            const vaccine = document.createElement("strong");
            vaccine.textContent = getVaccineLabel(rule.vaccine);
            const doseLabel = document.createElement("span");
            doseLabel.textContent = formatDose(rule.dose);
            copy.append(vaccine, doseLabel);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "care-remove-rule";
            removeButton.dataset.removeRule = rule.id;
            removeButton.setAttribute("aria-label", `Quitar ${getVaccineLabel(rule.vaccine)}`);
            removeButton.textContent = "×";

            dose.append(icon, copy, removeButton);
            doses.appendChild(dose);
        });

        group.append(heading, doses);
        scheduleList.appendChild(group);
    });

    updateSummary();
}

function setFormFeedback(message, state = "") {
    formFeedback.className = "care-form-note";
    formFeedback.textContent = "";

    const icon = document.createElement("span");
    icon.textContent = state === "error" ? "!" : "i";
    formFeedback.append(icon, document.createTextNode(` ${message}`));

    if (state) {
        formFeedback.classList.add(`is-${state}`);
    }
}

function setValidationResult(title, detail, state = "") {
    validationResult.className = "care-validation-result";
    validationResult.replaceChildren();

    const icon = document.createElement("span");
    icon.className = "care-result-icon";
    icon.textContent = state === "success" ? "✓" : state === "error" ? "!" : "i";

    const copy = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = title;
    const description = document.createElement("p");
    description.textContent = detail;
    copy.append(heading, description);

    validationResult.append(icon, copy);

    if (state) {
        validationResult.classList.add(`is-${state}`);
    }

    summaryValidation.textContent = state === "success" ? "Validado" : state === "error" ? "Por revisar" : "Pendiente";
}

function markAsPending() {
    setValidationResult(
        "Revisión pendiente",
        "El esquema cambió. Valídalo nuevamente antes de utilizarlo.",
        ""
    );
}

function buildProgram() {
    return rules
        .map(rule => `A_LOS ${rule.age} MESES: ${rule.vaccine}, DOSIS ${rule.dose};`)
        .join("\n");
}

ruleForm.addEventListener("submit", event => {
    event.preventDefault();

    const age = Number(ageInput.value);
    const vaccine = vaccineInput.value;
    const dose = Number(doseInput.value);

    if (!Number.isInteger(age) || age <= 0) {
        setFormFeedback("Indica una edad válida en meses.", "error");
        ageInput.focus();
        return;
    }

    const exists = rules.some(rule =>
        rule.age === age && rule.vaccine === vaccine && rule.dose === dose
    );

    if (exists) {
        setFormFeedback("Esta misma dosis ya se encuentra en el esquema.", "error");
        return;
    }

    rules.push({ id: nextRuleId++, age, vaccine, dose });
    renderSchedule();
    markAsPending();
    setFormFeedback(`${getVaccineLabel(vaccine)} se agregó correctamente al esquema.`, "success");
});

scheduleList.addEventListener("click", event => {
    const removeButton = event.target.closest("[data-remove-rule]");

    if (!removeButton) {
        return;
    }

    const ruleId = Number(removeButton.dataset.removeRule);
    const removedRule = rules.find(rule => rule.id === ruleId);
    rules = rules.filter(rule => rule.id !== ruleId);

    renderSchedule();
    markAsPending();
    setFormFeedback(`${getVaccineLabel(removedRule.vaccine)} se quitó del esquema.`, "success");
});

restoreSchemeButton.addEventListener("click", () => {
    nextRuleId = 1;
    rules = createDefaultRules();
    renderSchedule();
    markAsPending();
    setFormFeedback("Se restauró el esquema académico de demostración.", "success");
});

validateSchemeButton.addEventListener("click", async () => {
    const program = buildProgram();

    validateSchemeButton.disabled = true;
    validateSchemeButton.innerHTML = "<span>◌</span> Validando esquema...";
    setValidationResult("Validando el esquema", "Revisando las dosis registradas.", "");

    try {
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigo: program })
        };
        const [lexicalResponse, syntaxResponse, semanticResponse] = await Promise.all([
            fetch("/api/analizar", requestOptions),
            fetch("/api/sintaxis", requestOptions),
            fetch("/api/semantica", requestOptions)
        ]);
        const [lexicalData, syntaxData, semanticData] = await Promise.all([
            lexicalResponse.json(),
            syntaxResponse.json(),
            semanticResponse.json()
        ]);

        if (!lexicalResponse.ok || !syntaxResponse.ok || !semanticResponse.ok) {
            throw new Error("No fue posible completar la revisión.");
        }

        if (lexicalData.errores_lexicos.length > 0) {
            setValidationResult("Hay datos por revisar", "Se detectaron caracteres no válidos en el esquema.", "error");
        } else if (!syntaxData.correcto) {
            setValidationResult("Hay datos por revisar", "Una de las dosis no tiene una estructura válida.", "error");
        } else if (!semanticData.correcto) {
            const firstError = semanticData.errores[0]?.mensaje || "Revisa las dosis registradas.";
            setValidationResult("Hay datos por revisar", firstError, "error");
        } else {
            setValidationResult(
                "Esquema validado correctamente",
                `${semanticData.reglas.length} dosis revisadas sin inconsistencias detectadas.`,
                "success"
            );
        }
    } catch (error) {
        setValidationResult("No se pudo validar", error.message, "error");
    } finally {
        validateSchemeButton.disabled = false;
        validateSchemeButton.innerHTML = "<span>✓</span> Validar esquema ahora";
    }
});

renderSchedule();

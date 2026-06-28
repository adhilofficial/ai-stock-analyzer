export const CUSTOM_ALERT_RULES_STORAGE_KEY =
  "exa-custom-alert-rules-v1";

export const CUSTOM_ALERT_RULES_UPDATED_EVENT =
  "exa:custom-alert-rules-updated";

export const CUSTOM_ALERT_RULE_LIMIT = 30;

export const CUSTOM_ALERT_CONDITIONS = [
  {
    value: "price_above",
    label: "Price rises above",
    shortLabel: "Price above",
    unit: "₹",
    defaultValue: 1500,
    min: 0.01,
    step: 0.05,
    category: "price",
  },
  {
    value: "price_below",
    label: "Price falls below",
    shortLabel: "Price below",
    unit: "₹",
    defaultValue: 1000,
    min: 0.01,
    step: 0.05,
    category: "price",
  },
  {
    value: "change_above",
    label: "Daily change rises above",
    shortLabel: "Daily change above",
    unit: "%",
    defaultValue: 3,
    min: 0.1,
    step: 0.1,
    category: "change",
  },
  {
    value: "change_below",
    label: "Daily change falls below",
    shortLabel: "Daily change below",
    unit: "%",
    defaultValue: -3,
    max: -0.1,
    step: 0.1,
    category: "change",
  },
  {
    value: "rsi_above",
    label: "RSI rises above",
    shortLabel: "RSI above",
    unit: "",
    defaultValue: 70,
    min: 1,
    max: 100,
    step: 1,
    category: "technical",
  },
  {
    value: "rsi_below",
    label: "RSI falls below",
    shortLabel: "RSI below",
    unit: "",
    defaultValue: 30,
    min: 1,
    max: 100,
    step: 1,
    category: "technical",
  },
  {
    value: "volume_spike",
    label: "Volume exceeds average by",
    shortLabel: "Volume spike",
    unit: "×",
    defaultValue: 2,
    min: 1,
    max: 20,
    step: 0.1,
    category: "volume",
  },
  {
    value: "near_52w_high",
    label: "Within this distance of 52-week high",
    shortLabel: "Near 52-week high",
    unit: "%",
    defaultValue: 2,
    min: 0.1,
    max: 25,
    step: 0.1,
    category: "range",
  },
  {
    value: "near_52w_low",
    label: "Within this distance of 52-week low",
    shortLabel: "Near 52-week low",
    unit: "%",
    defaultValue: 2,
    min: 0.1,
    max: 25,
    step: 0.1,
    category: "range",
  },
];

function hasBrowserStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function safeNumber(value, fallback = null) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function normalizeSymbol(value) {
  return cleanText(value).toUpperCase();
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `rule-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function dispatchRulesUpdate(detail = {}) {
  if (
    typeof window === "undefined" ||
    typeof window.dispatchEvent !== "function"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CUSTOM_ALERT_RULES_UPDATED_EVENT, {
      detail,
    }),
  );
}

export function getCustomAlertCondition(value) {
  return (
    CUSTOM_ALERT_CONDITIONS.find(
      (condition) => condition.value === value,
    ) || CUSTOM_ALERT_CONDITIONS[0]
  );
}

export function normalizeCustomAlertRule(rule) {
  if (!rule || typeof rule !== "object") {
    return null;
  }

  const condition = getCustomAlertCondition(rule.condition);
  const symbol = normalizeSymbol(rule.symbol);
  const targetValue = safeNumber(
    rule.targetValue,
    condition.defaultValue,
  );

  if (!symbol || targetValue === null) {
    return null;
  }

  const status = ["active", "paused", "triggered"].includes(
    rule.status,
  )
    ? rule.status
    : "active";

  const now = new Date().toISOString();

  return {
    id: cleanText(rule.id) || createId(),
    symbol,
    companyName:
      cleanText(rule.companyName || rule.name) || symbol,
    exchange: cleanText(rule.exchange) || "NSE",
    condition: condition.value,
    targetValue,
    status,
    createdAt: cleanText(rule.createdAt) || now,
    updatedAt: cleanText(rule.updatedAt) || now,
    lastEvaluatedAt: cleanText(rule.lastEvaluatedAt) || null,
    lastTriggeredAt: cleanText(rule.lastTriggeredAt) || null,
    triggerCount: Math.max(0, safeNumber(rule.triggerCount, 0)),
    lastValue: safeNumber(rule.lastValue),
    lastMetrics:
      rule.lastMetrics && typeof rule.lastMetrics === "object"
        ? rule.lastMetrics
        : {},
  };
}

export function readCustomAlertRules() {
  if (!hasBrowserStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(
      CUSTOM_ALERT_RULES_STORAGE_KEY,
    );

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);

    return (Array.isArray(parsed) ? parsed : [])
      .map(normalizeCustomAlertRule)
      .filter(Boolean)
      .slice(0, CUSTOM_ALERT_RULE_LIMIT);
  } catch (error) {
    console.error("Unable to read custom alert rules:", error);
    return [];
  }
}

export function writeCustomAlertRules(
  rules,
  { reason = "update", silent = false } = {},
) {
  const normalized = (Array.isArray(rules) ? rules : [])
    .map(normalizeCustomAlertRule)
    .filter(Boolean)
    .slice(0, CUSTOM_ALERT_RULE_LIMIT);

  if (hasBrowserStorage()) {
    try {
      window.localStorage.setItem(
        CUSTOM_ALERT_RULES_STORAGE_KEY,
        JSON.stringify(normalized),
      );
    } catch (error) {
      console.error("Unable to save custom alert rules:", error);
    }
  }

  if (!silent) {
    dispatchRulesUpdate({
      reason,
      rules: normalized,
    });
  }

  return normalized;
}

export function upsertCustomAlertRule(rule) {
  const currentRules = readCustomAlertRules();
  const existing = currentRules.find(
    (item) => item.id === rule?.id,
  );
  const normalized = normalizeCustomAlertRule({
    ...existing,
    ...rule,
    id: existing?.id || rule?.id || createId(),
    status:
      rule?.status ||
      (existing?.status === "paused" ? "paused" : "active"),
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || rule?.createdAt,
  });

  if (!normalized) {
    throw new Error("Enter a valid stock, condition and target value.");
  }

  const nextRules = existing
    ? currentRules.map((item) =>
        item.id === normalized.id ? normalized : item,
      )
    : [normalized, ...currentRules];

  return writeCustomAlertRules(nextRules, {
    reason: existing ? "edit" : "create",
  });
}

export function deleteCustomAlertRule(ruleId) {
  const id = cleanText(ruleId);
  const nextRules = readCustomAlertRules().filter(
    (rule) => rule.id !== id,
  );

  return writeCustomAlertRules(nextRules, {
    reason: "delete",
  });
}

export function setCustomAlertRuleStatus(ruleId, status) {
  const id = cleanText(ruleId);
  const nextStatus = ["active", "paused", "triggered"].includes(
    status,
  )
    ? status
    : "active";

  const nextRules = readCustomAlertRules().map((rule) => {
    if (rule.id !== id) {
      return rule;
    }

    return {
      ...rule,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      lastTriggeredAt:
        nextStatus === "active" ? null : rule.lastTriggeredAt,
    };
  });

  return writeCustomAlertRules(nextRules, {
    reason: "status",
  });
}

export function applyCustomAlertEvaluations(evaluations) {
  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    return readCustomAlertRules();
  }

  const updates = new Map(
    evaluations
      .filter((item) => item?.id)
      .map((item) => [item.id, item]),
  );

  const nextRules = readCustomAlertRules().map((rule) => {
    const evaluation = updates.get(rule.id);

    if (!evaluation) {
      return rule;
    }

    return normalizeCustomAlertRule({
      ...rule,
      ...evaluation,
      updatedAt: new Date().toISOString(),
    });
  });

  return writeCustomAlertRules(nextRules, {
    reason: "evaluation",
  });
}

export function formatCustomAlertTarget(rule) {
  const condition = getCustomAlertCondition(rule?.condition);
  const value = safeNumber(rule?.targetValue, condition.defaultValue);

  if (condition.category === "price") {
    return `₹${value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  if (condition.value === "volume_spike") {
    return `${value.toFixed(value % 1 === 0 ? 0 : 1)}×`;
  }

  if (
    condition.category === "change" ||
    condition.category === "range"
  ) {
    return `${value > 0 && condition.category === "change" ? "+" : ""}${value.toFixed(
      value % 1 === 0 ? 0 : 1,
    )}%`;
  }

  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

export function formatCustomAlertRule(rule) {
  const condition = getCustomAlertCondition(rule?.condition);
  return `${condition.shortLabel} ${formatCustomAlertTarget(rule)}`;
}
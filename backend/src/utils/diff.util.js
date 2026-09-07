function comparable(value) {
  if (value instanceof Date) return value.toISOString();
  if (value === undefined) return null;
  if (value && typeof value === 'object') return JSON.stringify(value);
  return value;
}

function diffValues(before = {}, after = {}, fields = null) {
  const keys = fields || Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  const oldValues = {};
  const newValues = {};

  for (const key of keys) {
    const oldValue = before?.[key] ?? null;
    const newValue = after?.[key] ?? null;
    if (String(comparable(oldValue)) === String(comparable(newValue))) continue;
    oldValues[key] = oldValue;
    newValues[key] = newValue;
  }

  return {
    changed: Object.keys(newValues).length > 0,
    old_values: oldValues,
    new_values: newValues,
  };
}

module.exports = { diffValues };

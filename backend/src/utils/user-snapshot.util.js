function pick(obj, keys) {
  for (const key of keys) if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  return null;
}
function userSnapshot(user = {}) {
  return {
    user_id: user.id || null,
    username_snapshot: pick(user, ['username', 'email']),
    user_name_snapshot: pick(user, ['name', 'full_name', 'display_name', 'username']),
    department_id_snapshot: pick(user, ['department_id', 'primary_department_id']),
    department_name_snapshot: pick(user, ['department_name', 'primary_department_name']),
    company_id_snapshot: pick(user, ['company_id', 'primary_company_id']),
    company_name_snapshot: pick(user, ['company_name', 'primary_company_name']),
  };
}
module.exports = { userSnapshot };

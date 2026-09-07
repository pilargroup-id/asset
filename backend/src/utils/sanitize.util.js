const SENSITIVE_KEYS=/^(password|password_confirmation|jwt|token|access_token|refresh_token|authorization|cookie|internal_sync_secret|internal_secret|api_key|database_password|db_password)$/i;
function sanitize(value,depth=0){if(depth>8)return '[TRUNCATED]';if(Array.isArray(value))return value.map((v)=>sanitize(v,depth+1));if(value&&typeof value==='object'){const out={};for(const [k,v] of Object.entries(value)){out[k]=SENSITIVE_KEYS.test(k)?'[REDACTED]':sanitize(v,depth+1);}return out;}return value;}
module.exports={sanitize};

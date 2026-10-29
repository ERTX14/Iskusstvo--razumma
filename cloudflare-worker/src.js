const corsHeaders = (origin, env) => {
  const allowed = env.SITE_ORIGIN || 'https://ertx14.github.io';
  return {
    'Access-Control-Allow-Origin': origin === allowed ? origin : allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
};
const json = (data, status=200, headers={}) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json; charset=utf-8', ...headers}});
const sha256 = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const safe = value => String(value ?? '').trim().slice(0, 3000);
async function authorized(request, env) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const hash = await sha256(token);
  const row = await env.DB.prepare('SELECT token_hash FROM admin_sessions WHERE token_hash=? AND expires_at > ?').bind(hash, Date.now()).first();
  return !!row;
}
async function getState(env) {
  const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key='site_state'").first();
  if (!row) return {content:{},services:[]};
  try { return JSON.parse(row.value); } catch { return {content:{},services:[]}; }
}
async function handle(request, env) {
  const origin = request.headers.get('Origin') || '';
  const headers = corsHeaders(origin, env);
  if (request.method === 'OPTIONS') return new Response(null, {status:204,headers});
  if (request.method !== 'POST') return json({success:false,message:'Используйте POST.'},405,headers);
  if (origin && origin !== (env.SITE_ORIGIN || 'https://ertx14.github.io')) return json({success:false,message:'Источник запроса не разрешён.'},403,headers);
  let body;
  try { body = await request.json(); } catch { return json({success:false,message:'Некорректный JSON.'},400,headers); }
  const action = body.action || '';
  try {
    if (action === 'public_state') return json({success:true,state:await getState(env)},200,headers);
    if (action === 'submit_application') {
      const parent = safe(body.parent_name), phone = safe(body.phone), child = safe(body.child_name), birth = safe(body.child_birth_date), course = safe(body.course), additional = safe(body.additional_info);
      if (!parent || !phone || !child || !birth || !course || body.personal_data_consent !== '1') return json({success:false,message:'Заполните обязательные поля и подтвердите согласие.'},400,headers);
      const state = await getState(env);
      const services = state.services || [];
      const matched = services.find((s,i)=>String(s.key || ('custom-'+i))===course);
      const defaultNames = {diagnostic:'Онлайн-диагностика',individual:'Индивидуальный разбор возможностей ребёнка','school-ready':'Социально-эмоциональная готовность к школе (6–8 лет)',neuro:'НейроСказки — поддержка ребёнка перед школой и в начале обучения',intelligence:'Эмоциональный и стратегический интеллект (8–16 лет)',rhetoric:'Риторика и Деньги (10–17 лет)'};
      const courseName = matched?.name || defaultNames[course] || course;
      const result = await env.DB.prepare('INSERT INTO applications (parent_name, phone, child_name, child_birth_date, course_key, course_name, additional_info, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(parent,phone,child,birth,course,courseName,additional,new Date().toISOString()).run();
      return json({success:true,id:result.meta.last_row_id},200,headers);
    }
    if (action === 'login') {
      if (!env.ADMIN_PASSWORD || body.password !== env.ADMIN_PASSWORD) return json({success:false,message:'Неверный пароль администратора.'},401,headers);
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const token = Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
      const expires = Date.now() + 8*60*60*1000;
      await env.DB.prepare('INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)').bind(await sha256(token),expires).run();
      return json({success:true,token,expires_at:expires},200,headers);
    }
    if (action === 'status') return json({success:true,authenticated:await authorized(request,env)},200,headers);
    if (!(await authorized(request,env))) return json({success:false,message:'Требуется вход администратора'},401,headers);
    if (action === 'logout') {
      const token=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
      if(token) await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await sha256(token)).run();
      return json({success:true},200,headers);
    }
    if (action === 'get_state') return json({success:true,state:await getState(env)},200,headers);
    if (action === 'save_state') {
      const value=JSON.stringify(body.state || {content:{},services:[]});
      if(value.length>1800000) return json({success:false,message:'Слишком большой объём данных. Уменьшите размер фотографий.'},413,headers);
      await env.DB.prepare("INSERT INTO app_settings (key,value) VALUES ('site_state', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(value).run();
      return json({success:true},200,headers);
    }
    if (action === 'applications') {
      const result=await env.DB.prepare('SELECT id,parent_name,phone,child_name,child_birth_date,course_name,additional_info,created_at FROM applications ORDER BY id DESC LIMIT 500').all();
      return json({success:true,applications:result.results||[]},200,headers);
    }
    if (action === 'delete_application') { await env.DB.prepare('DELETE FROM applications WHERE id=?').bind(Number(body.id)).run(); return json({success:true},200,headers); }
    if (action === 'clear_applications') { await env.DB.prepare('DELETE FROM applications').run(); return json({success:true},200,headers); }
    return json({success:false,message:'Неизвестное действие API.'},400,headers);
  } catch (error) {
    return json({success:false,message:'Ошибка сервера. Проверьте настройку базы Cloudflare D1.'},500,headers);
  }
}
export default { async fetch(request, env) { return handle(request,env); } };

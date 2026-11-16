const projectUrl = "https://uqynozssqshyfhqfyjpg.supabase.co";
const publishableKey = "sb_publishable_4WV8l9zWnapotft2iuyD4A_8RtYNrWc";
const sdkUrl = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.89.0/dist/umd/supabase.js';
const table = 'player_saves';
const keys = ['xiangqi-v1', 'xiangqi-history', 'xiangqi-design', 'xiangqi-lessons'];
const linkKey = 'xiangqi-cloud-link';
const $ = id => document.getElementById(id);
const status = message => { $('account-status').textContent = message; };

let client, user, link, timer, loading;
let currentOperation = Promise.resolve();

function snapshot() {
  const data = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
  return { version: 1, data };
}

function restore(save) {
  if (save?.version !== 1 || !keys.every(key => {
    const value = save.data?.[key];
    if (value === null) return true;
    if (typeof value !== 'string') return false;
    try {
      const parsed = JSON.parse(value);
      if (key === 'xiangqi-v1') return Array.isArray(parsed?.log);
      if (key === 'xiangqi-design') return typeof parsed?.theme === 'string' && typeof parsed?.pieceStyle === 'string';
      return Array.isArray(parsed);
    } catch { return false; }
  })) throw new Error('Der Cloud-Spielstand hat ein unbekanntes Format.');
  for (const key of keys) {
    if (save.data[key] === null) localStorage.removeItem(key);
    else localStorage.setItem(key, save.data[key]);
  }
}

function updateAccount() {
  $('account-form').hidden = Boolean(user);
  $('account-sync').hidden = !user;
  $('account-user').textContent = user?.email ?? '';
  $('account').textContent = link ? 'Konto ✓' : 'Konto';
  $('sync-start').hidden = Boolean(link);
}

function bind(revision) {
  link = { user: user.id, revision };
  localStorage.setItem(linkKey, JSON.stringify(link));
  updateAccount();
}

function unbind() {
  link = undefined;
  localStorage.removeItem(linkKey);
  clearTimeout(timer);
  updateAccount();
}

function run(action) {
  const operation = currentOperation.then(action);
  currentOperation = operation.catch(error => status(
    navigator.onLine ? error?.message || 'Synchronisierung fehlgeschlagen.' : 'Offline. Änderungen bleiben in diesem Browser.',
  ));
  return currentOperation;
}

async function readSave() {
  const { data, error } = await client.from(table).select('revision,snapshot').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data;
}

function sameSave(left, right) {
  return left?.version === 1 && keys.every(key => left.data?.[key] === right.data[key]);
}

async function sync() {
  if (!user || !link) return;
  const userId = user.id;
  const revision = link.revision;
  const data = snapshot();
  const remote = await readSave();
  if (user?.id !== userId || link?.revision !== revision) return;
  if (remote && sameSave(remote.snapshot, data)) {
    bind(remote.revision);
    status('Spielstand synchronisiert.');
    return;
  }
  if (!remote || remote.revision !== revision) {
    unbind();
    status('Der Cloud-Spielstand wurde anderswo geändert. Deine lokalen Daten wurden beibehalten. Lade den Cloud-Spielstand, um weiter zu synchronisieren.');
    return;
  }
  const { data: saved, error } = await client.from(table)
    .update({ snapshot: data, revision: revision + 1 })
    .eq('user_id', userId).eq('revision', revision).select('revision').maybeSingle();
  if (error) throw error;
  if (user?.id !== userId || link?.revision !== revision) return;
  if (!saved) {
    unbind();
    status('Ein anderes Gerät hat zuerst gespeichert. Deine lokalen Daten wurden beibehalten.');
    return;
  }
  bind(saved.revision);
  status('Spielstand synchronisiert.');
  if (!sameSave(data, snapshot())) schedule();
}

function schedule() {
  if (!link) return;
  clearTimeout(timer);
  timer = setTimeout(() => run(sync), 400);
}

function loadSdk() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = sdkUrl;
    script.onload = () => resolve(window.supabase.createClient(projectUrl, publishableKey));
    script.onerror = () => reject(new Error('Die Kontoanbindung ist gerade nicht erreichbar.'));
    document.head.append(script);
  });
}

function connect() {
  loading ??= loadSdk().then(loaded => {
    client = loaded;
    client.auth.onAuthStateChange((event, session) => {
      user = session?.user;
      try {
        const stored = JSON.parse(localStorage.getItem(linkKey));
        link = user && stored?.user === user.id ? stored : undefined;
      } catch { link = undefined; }
      if (event === 'SIGNED_OUT') unbind();
      updateAccount();
      if (link) schedule();
      if (event === 'INITIAL_SESSION') status(user ? 'Angemeldet.' : '');
    });
  }).catch(error => {
    loading = undefined;
    throw error;
  });
  return loading;
}

$('account').hidden = false;
$('account').onclick = () => {
  $('account-dialog').showModal();
  run(async () => {
    if (client) return;
    status('Konto wird geladen …');
    await connect();
  });
};

$('account-form').onsubmit = event => {
  event.preventDefault();
  const signup = event.submitter?.value === 'signup';
  const email = $('account-email').value.trim();
  const password = $('account-password').value;
  $('account-password').value = '';
  run(async () => {
    if (!client) throw new Error('Die Kontoanbindung ist gerade nicht erreichbar.');
    const { data, error } = signup
      ? await client.auth.signUp({ email, password, options: { emailRedirectTo: location.origin } })
      : await client.auth.signInWithPassword({ email, password });
    if (error) {
      if (!signup) throw new Error('Anmeldung fehlgeschlagen. Prüfe E-Mail, Passwort und E-Mail-Bestätigung.');
      throw error;
    }
    status(signup && !data.session ? 'Öffne den Bestätigungslink in deiner E-Mail.' : 'Angemeldet.');
  });
};

$('sync-start').onclick = () => run(async () => {
  if (!user || link) return;
  if (await readSave()) {
    status('Es gibt bereits einen Cloud-Spielstand. Mit „Cloud-Spielstand laden“ übernimmst du ihn.');
    return;
  }
  const userId = user.id;
  const { data, error } = await client.from(table).insert({ user_id: userId, snapshot: snapshot() })
    .select('revision').single();
  if (error) throw error;
  if (user?.id !== userId) return;
  bind(data.revision);
  status('Dieser Browser wird jetzt automatisch synchronisiert.');
  schedule();
});

$('sync-load').onclick = () => run(async () => {
  if (!user) return;
  const save = await readSave();
  if (!save) { status('Es gibt noch keinen Cloud-Spielstand.'); return; }
  if (!sameSave(save.snapshot, snapshot())
    && !confirm('Cloud-Spielstand laden? Die Partie, der Trainingsfortschritt und die Einstellungen in diesem Browser werden ersetzt.')) return;
  restore(save.snapshot);
  bind(save.revision);
  location.reload();
});

$('sync-logout').onclick = () => run(async () => {
  if (!client) return;
  if (link && navigator.onLine) await sync();
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
  unbind();
  status('Abgemeldet.');
});

window.addEventListener('xiangqi-save', schedule);
window.addEventListener('online', schedule);
try {
  if (localStorage.getItem(linkKey) || location.hash.includes('access_token=')) {
    connect().catch(() => status('Cloud-Speicherung derzeit nicht erreichbar.'));
  }
} catch {}

const projectUrl = "https://uqynozssqshyfhqfyjpg.supabase.co";
const publishableKey = "sb_publishable_4WV8l9zWnapotft2iuyD4A_8RtYNrWc";
const sdkUrl = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.89.0/dist/umd/supabase.js';
const table = 'player_saves';
const authRedirect = 'https://lixiangqi-play.vercel.app/';
const callback = new URLSearchParams(location.hash.slice(1));
const keys = ['xiangqi-v1', 'xiangqi-history', 'xiangqi-design', 'xiangqi-lessons'];
const linkKey = 'xiangqi-cloud-link';
const $ = id => document.getElementById(id);
const status = message => { $('account-status').textContent = message; };

let client, user, link, timer, loading;
let guest = false;
let profileUser;
let accountMode = 'login';
let callbackHandled = false;
let recoveryAccount;
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
  const notice = accountMode === 'notice';
  $('account-notice').hidden = !notice;
  $('account-form').hidden = notice || Boolean(user && accountMode !== 'recover');
  $('account-sync').hidden = !user || notice || accountMode === 'recover';
  const metadata = user?.user_metadata;
  const name = typeof metadata?.display_name === 'string' ? metadata.display_name : '';
  $('account-user').textContent = name || user?.email || '';
  $('account').textContent = link ? 'Konto ✓' : 'Konto';
  $('sync-start').hidden = Boolean(link);
  $('profile-form').hidden = !user;
  $('profile-guest').hidden = $('profile-login').hidden = Boolean(user);
  $('profile-email').textContent = user?.email ?? '';
  if (profileUser !== user?.id) {
    profileUser = user?.id;
    $('profile-name').value = name;
    $('profile-bio').value = typeof metadata?.bio === 'string' ? metadata.bio : '';
    $('profile-status').textContent = '';
  }
  const welcome = !guest && !user;
  document.body.toggleAttribute('data-welcome', welcome);
  $('welcome').hidden = !welcome;
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
      if (event === 'SIGNED_OUT') {
        guest = false;
        unbind();
      }
      updateAccount();
      if (link) schedule();
      if (event === 'INITIAL_SESSION') status(user ? 'Angemeldet.' : '');
      if (event === 'PASSWORD_RECOVERY' && user && !callbackHandled) {
        callbackHandled = true;
        recoveryAccount = user.id;
        showAccountDialog('recover');
      } else if (!callbackHandled && user && callback.get('type') === 'signup'
        && callback.has('access_token') && event === 'SIGNED_IN') {
        callbackHandled = true;
        showNotice('E-Mail bestätigt', 'Deine E-Mail-Adresse wurde bestätigt. Du bist jetzt angemeldet.', true);
      }
    });
  }).catch(error => {
    loading = undefined;
    throw error;
  });
  return loading;
}

function setAccountMode(mode) {
  accountMode = mode;
  const signup = mode === 'signup';
  const forgot = mode === 'forgot';
  const recover = mode === 'recover';
  const label = signup ? 'Konto erstellen' : forgot ? 'Link anfordern' : recover ? 'Passwort speichern' : 'Anmelden';
  $('account-title').textContent = recover ? 'Neues Passwort wählen'
    : forgot ? 'Passwort zurücksetzen' : user ? 'Konto und Spielstand' : label;
  $('account-submit').textContent = label;
  $('account-switch').textContent = signup || forgot ? 'Zur Anmeldung' : 'Konto erstellen';
  $('account-switch').hidden = recover;
  $('account-forgot').hidden = mode !== 'login';
  for (const [id, visible] of [
    ['account-email', !recover], ['confirm-email', signup],
    ['account-password', !forgot], ['confirm-password', signup || recover],
  ]) {
    $(id+'-field').hidden = !visible;
    $(id).disabled = !visible;
    $(id).required = visible;
    if (id !== 'account-email') $(id).value = '';
  }
  $('account-password').value = '';
  $('account-password').autocomplete = signup || recover ? 'new-password' : 'current-password';
  if (signup || recover) $('account-password').minLength = 6;
  else $('account-password').removeAttribute('minlength');
  status('');
  updateAccount();
}

function showAccountDialog(mode) {
  const dialog = $('account-dialog');
  setAccountMode(mode);
  if (!dialog.open) dialog.showModal();
}

function showNotice(title, message, signedIn = false) {
  showAccountDialog('notice');
  $('account-title').textContent = title;
  $('account-notice-message').textContent = message;
  $('notice-login').hidden = $('notice-reset').hidden = signedIn;
  $('notice-continue').hidden = !signedIn;
  $(signedIn ? 'notice-continue' : 'notice-login').focus();
}

function openAccount(mode = 'login') {
  showAccountDialog(mode === 'login' && user && recoveryAccount === user.id ? 'recover' : mode);
  run(async () => {
    if (client) return;
    status('Konto wird geladen …');
    await connect();
  });
}

$('account').hidden = $('profile').hidden = false;
$('account').onclick = $('profile-login').onclick = $('welcome-login').onclick = () => openAccount();
$('welcome-signup').onclick = () => openAccount('signup');
$('account-switch').onclick = () => setAccountMode(accountMode === 'login' ? 'signup' : 'login');
$('account-forgot').onclick = $('notice-reset').onclick = () => openAccount('forgot');
$('notice-login').onclick = () => openAccount('login');
$('notice-continue').onclick = () => $('account-dialog').close();
$('welcome-guest').onclick = () => {
  guest = true;
  updateAccount();
  $('menu').querySelector('button')?.focus();
};
updateAccount();

$('account-form').onsubmit = event => {
  event.preventDefault();
  const signup = accountMode === 'signup';
  const forgot = accountMode === 'forgot';
  const recover = accountMode === 'recover';
  const email = $('account-email').value.trim();
  const password = $('account-password').value;
  if (signup && email.toLowerCase() !== $('confirm-email').value.trim().toLowerCase()) {
    status('Die beiden E-Mail-Adressen stimmen nicht überein.');
    $('confirm-email').focus();
    return;
  }
  if ((signup || recover) && password !== $('confirm-password').value) {
    status('Die beiden Passwörter stimmen nicht überein.');
    $('confirm-password').focus();
    return;
  }
  $('account-password').value = '';
  $('confirm-password').value = '';
  run(async () => {
    if (!client) throw new Error('Die Kontoanbindung ist gerade nicht erreichbar.');
    if (forgot) {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: authRedirect });
      if (error) throw error;
      showNotice('Prüfe dein Postfach', 'Wenn für diese Adresse ein Konto existiert, wurde ein Link zum Zurücksetzen verschickt. Schau auch im Spam-Ordner nach.');
      return;
    }
    if (recover) {
      if (!user || recoveryAccount !== user.id) throw new Error('Fordere bitte einen neuen Link zum Zurücksetzen an.');
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      recoveryAccount = undefined;
      showNotice('Passwort geändert', 'Dein neues Passwort wurde gespeichert.', true);
      return;
    }
    const { data, error } = signup
      ? await client.auth.signUp({ email, password, options: { emailRedirectTo: authRedirect } })
      : await client.auth.signInWithPassword({ email, password });
    if (error) {
      if (signup && ['user_already_exists', 'email_exists'].includes(error.code)) {
        showNotice('E-Mail bereits registriert', 'Melde dich mit deinem bestehenden Konto an oder setze dein Passwort zurück.');
        return;
      }
      if (!signup) throw new Error(error.code === 'email_not_confirmed'
        ? 'Deine E-Mail-Adresse wurde noch nicht bestätigt. Öffne den Link aus deinem Postfach.'
        : 'Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort oder setze dein Passwort zurück.');
      throw error;
    }
    if (signup && !data.session) {
      showNotice('Prüfe dein Postfach', 'Wenn die Adresse neu ist, wurde eine Bestätigungs-E-Mail verschickt. Falls du schon ein Konto hast, melde dich an oder setze dein Passwort zurück.');
      return;
    }
    status('Angemeldet.');
    if (data.session && $('account-dialog').open) $('account-dialog').close();
  });
};

$('profile-form').onsubmit = async event => {
  event.preventDefault();
  if (!user || !client) return;
  const accountId = user.id;
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  const display_name = $('profile-name').value.trim();
  const bio = $('profile-bio').value.trim();
  submit.disabled = true;
  $('profile-status').textContent = 'Profil wird gespeichert …';
  try {
    const { data, error } = await client.auth.updateUser({ data: { display_name, bio } });
    if (error) throw error;
    if (user?.id !== accountId) return;
    user = data.user;
    updateAccount();
    if ($('profile-name').value.trim() === display_name) $('profile-name').value = display_name;
    if ($('profile-bio').value.trim() === bio) $('profile-bio').value = bio;
    $('profile-status').textContent = 'Profil gespeichert.';
  } catch {
    if (user?.id === accountId) $('profile-status').textContent = 'Das Profil konnte gerade nicht gespeichert werden.';
  } finally {
    submit.disabled = false;
  }
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
  if (callback.has('error_code')) {
    history.replaceState(null, '', location.pathname + location.search);
    showNotice('E-Mail-Link ungültig', 'Dieser Link ist abgelaufen oder wurde bereits verwendet. Melde dich an oder fordere einen neuen Link zum Zurücksetzen an.');
  }
  if (localStorage.getItem('sb-uqynozssqshyfhqfyjpg-auth-token') || callback.has('access_token')) {
    connect().catch(() => status('Cloud-Speicherung derzeit nicht erreichbar.'));
  }
} catch {}

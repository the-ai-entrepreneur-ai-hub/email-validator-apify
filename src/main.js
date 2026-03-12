import { Actor, log } from 'apify';
import http from 'http';
import dns from 'dns';
import { promisify } from 'util';
import net from 'net';

const resolveMx = promisify(dns.resolveMx);

// ===== DISPOSABLE EMAIL DOMAINS =====
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','tempmail.com','throwaway.email','yopmail.com',
  'sharklasers.com','guerrillamailblock.com','grr.la','guerrillamail.info','guerrillamail.biz',
  'guerrillamail.de','guerrillamail.net','guerrillamail.org','spam4.me','trashmail.com',
  'trashmail.me','trashmail.net','trashymail.com','dispostable.com','maildrop.cc',
  'mailnesia.com','tempail.com','tempr.email','temp-mail.org','temp-mail.io',
  'fakeinbox.com','emailondeck.com','getnada.com','mohmal.com','minutemail.com',
  '10minutemail.com','20minutemail.com','mailcatch.com','inboxbear.com','mailsac.com',
  'harakirimail.com','discard.email','33mail.com','maildax.com','mailexpire.com',
  'mytemp.email','tempmailaddress.com','spamgourmet.com','armyspy.com','cuvox.de',
  'dayrep.com','einrot.com','fleckens.hu','gustr.com','jourrapide.com','rhyta.com',
  'superrito.com','teleworm.us','dropmail.me','getairmail.com','wegwerfmail.de',
  'wegwerfmail.net','trash-mail.com','anonbox.net','mytrashmail.com','mailforspam.com',
  'spamfree24.org','spamfree.de','objectmail.com','proxymail.eu','rcpt.at','trashmail.org',
  'trash-me.com','binkmail.com','bobmail.info','burnthismail.com','devnullmail.com',
  'dodgeit.com','dodgit.com','emailisvalid.com','emz.net','filzmail.com',
  'flyspam.com','get1mail.com','getonemail.com','getonemail.net',
  'haltospam.com','jetable.org','kasmail.com','koszmail.pl',
  'kurzepost.de','letthemeatspam.com','lookugly.com','lr78.com','maileater.com',
  'mailfreeonline.com','mailin8r.com','mailinator2.com','mailincubator.com',
  'mailme.ir','mailme.lv','mailmetrash.com','mailmoat.com','mailnator.com',
  'mailnull.com','mailshell.com','mailsiphon.com','mailslite.com','mailzilla.com',
  'mbx.cc','meltmail.com','mintemail.com','moncourrier.fr.nf','monemail.fr.nf',
  'monmail.fr.nf','mx0.wwwnew.eu','my10minutemail.com','mytempemail.com',
  'neomailbox.com','nervmich.net','neverbox.com','no-spam.ws',
  'nobulk.com','noclickemail.com','nomail.xl.cx','nomail2me.com',
  'nospam.ze.tc','nospam4.us','nospamfor.us','nospammail.net',
  'nowmymail.com','nurfuerspam.de','objectmail.com','onewaymail.com',
  'otherinbox.com','outlawspam.com','ovpn.to','pookmail.com',
  'proxymail.eu','rcpt.at','rejectmail.com','rhyta.com',
  'safe-mail.net','safersignup.de','safetymail.info','safetypost.de',
  'sandelf.de','schafmail.de','selfdestructingmail.com',
  'shieldedmail.com','shiftmail.com','shitmail.me','shortmail.net',
  'slaskpost.se','sneakemail.com','sogetthis.com',
  'spam.la','spam.su','spamavert.com','spambob.com','spambob.net',
  'spambog.com','spambog.de','spambog.ru','spambox.us','spamcero.com',
  'spamcowboy.com','spamday.com','spamex.com','spamfree24.com',
  'spamgoes.in','spamhole.com','spamify.com','spaml.com',
  'spammotel.com','spamobox.com','spamoff.de','spamspot.com',
  'spamstack.net','spamthis.co.uk','speed.1s.fr',
  'stop-my-spam.com','sweetxxx.de','tempalias.com',
  'tempemail.co.za','tempemail.com','tempemail.net','tempinbox.com',
  'tempmail.eu','tempmail.it','tempmail2.com','tempmailer.com',
  'tempomail.fr','temporaryemail.net','temporaryemail.us',
  'temporaryinbox.com','temporarymailaddress.com',
  'thanksnospam.info','thisisnotmyrealemail.com','thismail.net',
  'throwawayemailaddress.com','tmailinator.com','trashmail.at',
  'trashmail.io','trashmailer.com','trashymail.net',
  'wegwerfadresse.de','wegwerfemail.com','wegwerfemail.de',
  'wegwerfmail.info','wegwerfmail.org','whyspam.me',
  'willselfdestruct.com','wuzup.net','xagloo.com',
  'xemaps.com','xmaily.com','xoxy.net','yapped.net',
  'yopmail.fr','yopmail.net','zehnminuten.de',
  'zehnminutenmail.de','zetmail.com','zoaxe.com','zoemail.org',
  'bugmenot.com','mailinator.net','mailinator.org','mailinator.us',
  'emailfake.com','crazymailing.com','mail-temporaire.fr',
  'jetable.com','contbay.com','damnthespam.com',
]);

const FREE_PROVIDERS = new Set([
  'gmail.com','yahoo.com','hotmail.com','outlook.com','aol.com','icloud.com',
  'mail.com','zoho.com','protonmail.com','proton.me','yandex.com','gmx.com',
  'gmx.net','live.com','msn.com','me.com','mac.com','inbox.com','fastmail.com',
  'tutanota.com','tuta.io','hey.com','pm.me','mail.ru','rambler.ru',
  'qq.com','163.com','126.com','sina.com','rediffmail.com',
]);

const ROLE_EMAILS = new Set([
  'admin','administrator','webmaster','postmaster','hostmaster','abuse','info',
  'support','sales','contact','help','billing','noreply','no-reply',
  'mailer-daemon','nobody','root','security','spam','office','hr','marketing',
  'press','media','legal','compliance','privacy','feedback','hello','team',
]);

// ===== VALIDATION LOGIC =====
async function validateEmail(email) {
  const trimmed = (email || '').trim().toLowerCase();
  const result = {
    email: trimmed, valid: false, format_valid: false, mx_found: false,
    smtp_check: null, is_disposable: false, is_free: false, is_role_based: false,
    domain: null, mx_records: [], score: 0, reason: '',
  };

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(trimmed)) { result.reason = 'Invalid email format'; return result; }
  result.format_valid = true;
  result.score += 20;

  const [localPart, domain] = trimmed.split('@');
  result.domain = domain;
  result.is_disposable = DISPOSABLE_DOMAINS.has(domain);
  if (result.is_disposable) { result.reason = 'Disposable email address'; result.score = Math.max(result.score - 50, 0); }
  result.is_free = FREE_PROVIDERS.has(domain);
  result.is_role_based = ROLE_EMAILS.has(localPart.split('+')[0]);
  if (result.is_role_based) result.score = Math.max(result.score - 10, 0);

  try {
    const mx = await resolveMx(domain);
    if (mx?.length > 0) {
      result.mx_found = true;
      result.mx_records = mx.sort((a, b) => a.priority - b.priority).slice(0, 5).map(r => ({ priority: r.priority, exchange: r.exchange }));
      result.score += 40;
    } else { result.reason = result.reason || 'No MX records found'; }
  } catch (err) { result.reason = result.reason || `DNS lookup failed: ${err.code || err.message}`; return result; }

  if (result.mx_found && !result.is_disposable) {
    try {
      result.smtp_check = await checkSMTP(result.mx_records[0].exchange, trimmed);
      if (result.smtp_check === 'valid') result.score += 40;
      else if (result.smtp_check === 'catch_all') result.score += 20;
      else result.score = Math.max(result.score - 20, 0);
    } catch { result.smtp_check = 'timeout'; result.score += 10; }
  }

  result.valid = result.score >= 60 && result.format_valid && result.mx_found && !result.is_disposable;
  if (!result.reason) result.reason = result.valid ? 'Valid email address' : 'Could not verify email';
  return result;
}

function checkSMTP(mxHost, email) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let step = 0;
    socket.setTimeout(8000);
    socket.on('timeout', () => { socket.destroy(); reject(new Error('timeout')); });
    socket.on('error', () => { socket.destroy(); reject(new Error('error')); });
    socket.connect(25, mxHost, () => {});
    socket.on('data', (data) => {
      const code = parseInt(data.toString().substring(0, 3));
      if (step === 0 && code === 220) { socket.write('EHLO validator.api\r\n'); step = 1; }
      else if (step === 1 && code === 250) { socket.write('MAIL FROM:<check@validator.api>\r\n'); step = 2; }
      else if (step === 2 && code === 250) { socket.write(`RCPT TO:<${email}>\r\n`); step = 3; }
      else if (step === 3) {
        socket.write('QUIT\r\n'); socket.destroy();
        if (code === 250) resolve('valid');
        else if (code === 550 || code === 551 || code === 553) resolve('invalid');
        else if (code === 252) resolve('catch_all');
        else resolve('unknown');
      } else { socket.write('QUIT\r\n'); socket.destroy(); resolve('unknown'); }
    });
  });
}

// ===== MAIN =====
await Actor.init();

const input = await Actor.getInput() || {};
const port = process.env.ACTOR_WEB_SERVER_PORT || process.env.APIFY_ACTOR_WEB_SERVER_PORT || 4321;

// HTTP server for Standby mode
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = new URL(req.url, `http://localhost:${port}`);
  const path = url.pathname;

  // Readiness probe
  if (req.headers['x-apify-container-server-readiness-probe']) {
    res.writeHead(200);
    return res.end(JSON.stringify({ ready: true }));
  }

  // Health check
  if (path === '/' || path === '/health') {
    res.writeHead(200);
    return res.end(JSON.stringify({
      name: 'Email Validator API',
      version: '1.0.0',
      endpoints: ['/validate?email=...', '/disposable?email=...', '/validate/bulk (POST)'],
    }));
  }

  // Validate single email
  if (path === '/validate') {
    const email = url.searchParams.get('email');
    if (!email) { res.writeHead(400); return res.end(JSON.stringify({ error: 'Missing: email' })); }
    const result = await validateEmail(email);
    await Actor.charge({ eventName: 'email-validated', count: 1 }).catch(() => {});
    res.writeHead(200);
    return res.end(JSON.stringify(result));
  }

  // Disposable check
  if (path === '/disposable') {
    const email = url.searchParams.get('email') || '';
    const domain = url.searchParams.get('domain') || '';
    const check = domain || (email.includes('@') ? email.split('@')[1] : email);
    if (!check) { res.writeHead(400); return res.end(JSON.stringify({ error: 'Missing: email or domain' })); }
    await Actor.charge({ eventName: 'email-validated', count: 1 }).catch(() => {});
    res.writeHead(200);
    return res.end(JSON.stringify({
      domain: check.toLowerCase(),
      is_disposable: DISPOSABLE_DOMAINS.has(check.toLowerCase()),
      is_free: FREE_PROVIDERS.has(check.toLowerCase()),
    }));
  }

  // Bulk validate
  if (path === '/validate/bulk' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { emails } = JSON.parse(body);
        if (!emails?.length) { res.writeHead(400); return res.end(JSON.stringify({ error: 'Missing: emails array' })); }
        if (emails.length > 50) { res.writeHead(400); return res.end(JSON.stringify({ error: 'Max 50 emails' })); }
        const results = [];
        for (const e of emails) {
          const r = await validateEmail(e);
          results.push(r);
        }
        await Actor.charge({ eventName: 'email-validated', count: emails.length }).catch(() => {});
        res.writeHead(200);
        res.end(JSON.stringify({ count: results.length, results }));
      } catch (err) { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON body' })); }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found. Try /validate?email=test@gmail.com' }));
});

server.listen(port, () => log.info(`Standby server on port ${port}`));

// Regular actor mode (non-standby) — process input and exit
if (input.email || input.emails) {
  if (input.mode === 'bulk' && input.emails) {
    const results = [];
    for (const e of input.emails.slice(0, 50)) {
      results.push(await validateEmail(e));
    }
    await Actor.pushData(results);
    await Actor.charge({ eventName: 'email-validated', count: results.length }).catch(() => {});
  } else if (input.mode === 'disposable' && input.email) {
    const domain = input.email.includes('@') ? input.email.split('@')[1] : input.email;
    await Actor.pushData([{ domain, is_disposable: DISPOSABLE_DOMAINS.has(domain.toLowerCase()), is_free: FREE_PROVIDERS.has(domain.toLowerCase()) }]);
    await Actor.charge({ eventName: 'email-validated', count: 1 }).catch(() => {});
  } else if (input.email) {
    const result = await validateEmail(input.email);
    await Actor.pushData([result]);
    await Actor.charge({ eventName: 'email-validated', count: 1 }).catch(() => {});
  }
  // Exit after processing input (non-standby mode)
  log.info('Input processed, exiting.');
  server.close();
  await Actor.exit();
} else {
  // Keep alive for standby mode
  log.info('Email Validator API ready in standby mode. Waiting for requests...');
}

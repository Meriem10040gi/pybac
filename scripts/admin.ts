// Manage the admins of the back-office, directly in the database (DATABASE_URL of .env).
//
//   npm run admin -- add prof@lycee.fr              create the account (asks for a password), or make
//                                                   an existing account admin
//   npm run admin -- add prof@lycee.fr --password   also choose a new password for an existing account
//   npm run admin -- remove prof@lycee.fr           the account stays, but is no longer admin
//   npm run admin -- list                           the admins
//
// The password is typed without being shown. It is stored only as a hash, like on the site.
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';

import { hashPassword, normEmail, passwordProblem } from '../server/auth.js';
import { mysqlStore } from '../server/store.js';

const HELP = `Utilisation :
  npm run admin -- add <e-mail> [--password]   créer un administrateur (ou donner ce rôle à un compte)
  npm run admin -- remove <e-mail>             retirer le rôle d'administrateur
  npm run admin -- list                        voir les administrateurs`;

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

/** Lines typed when the input is not a terminal (e.g. `echo motdepasse | npm run admin ...`). */
let piped: string[] | null = null;
async function pipedLine(): Promise<string> {
  if (!piped) {
    piped = [];
    const rl = createInterface({ input: process.stdin });
    for await (const line of rl) piped.push(line);
  }
  return piped.shift() ?? '';
}

/** Asks for a password without showing it (a * per character). */
function askHidden(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    process.stdout.write(question + '\n');
    return pipedLine();
  }
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let value = '';
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          process.stdout.write('\n');
          return resolve(value);
        }
        if (ch === '\u0003') {
          // Ctrl+C
          process.stdout.write('\n');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else if (ch >= ' ') {
          value += ch;
          process.stdout.write('*');
        }
      }
    };
    stdin.on('data', onData);
  });
}

async function choosePassword(): Promise<string> {
  for (;;) {
    const p1 = await askHidden('Mot de passe (au moins 8 caractères) : ');
    const problem = passwordProblem(p1);
    if (problem) {
      console.log(problem);
      if (!process.stdin.isTTY) fail('Mot de passe refusé.');
      continue;
    }
    const p2 = await askHidden('Le même mot de passe, encore une fois : ');
    if (p1 === p2) return p1;
    console.log('Les deux mots de passe sont différents. On recommence.');
    if (!process.stdin.isTTY) fail('Mot de passe refusé.');
  }
}

const { positionals, values } = parseArgs({ allowPositionals: true, options: { password: { type: 'boolean', default: false }, help: { type: 'boolean', short: 'h' } } });
const [command, rawEmail] = positionals;
if (values.help || !command) {
  console.log(HELP);
  process.exit(command ? 0 : 1);
}

// check the email before connecting to the database
const email = command === 'list' ? null : normEmail(rawEmail);
if ((command === 'add' || command === 'remove') && !email) fail(`Adresse e-mail invalide : ${rawEmail ?? '(rien)'}

${HELP}`);

const url = process.env.DATABASE_URL?.trim();
if (!url) fail('DATABASE_URL manque : remplissez le fichier .env (voir .env.example).');

const store = await mysqlStore(url);
const envAdmins = new Set((process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean));

if (command === 'list') {
  const users = await store.listUsers();
  const admins = users.filter((u) => u.isAdmin || envAdmins.has(u.email));
  console.log(admins.length ? '\nAdministrateurs :' : '\nAucun administrateur pour l\'instant.');
  for (const u of admins) console.log(`  ${u.email}${u.isAdmin ? '' : '  (par ADMIN_EMAILS dans .env)'}`);
  const missing = [...envAdmins].filter((e) => !users.some((u) => u.email === e));
  for (const e of missing) console.log(`  ${e}  (dans ADMIN_EMAILS, mais ce compte n'existe pas encore)`);
  console.log('');
} else if (command === 'add' || command === 'remove') {
  if (!email) fail(`Adresse e-mail invalide : ${rawEmail ?? '(rien)'}`);
  const existing = await store.userByEmail(email);

  if (command === 'add') {
    if (!existing) {
      console.log(`\nCréation du compte administrateur ${email}`);
      const user = await store.createUser(email, await hashPassword(await choosePassword()));
      if (!user) fail('Le compte n\'a pas pu être créé (il vient peut-être d\'être créé ailleurs). Relancez la commande.');
      await store.setAdmin(user.id, true);
      console.log(`\nC'est fait : ${email} est administrateur. Connectez-vous sur le site avec cet e-mail et ce mot de passe.\n`);
    } else {
      await store.setAdmin(existing.id, true);
      if (values.password) {
        console.log(`\nNouveau mot de passe pour ${email}`);
        await store.setPassword(existing.id, await hashPassword(await choosePassword()));
        // the old sessions stop working
        await store.deleteSessions(existing.id);
      }
      console.log(`\nC'est fait : le compte ${email} est administrateur${values.password ? ', avec son nouveau mot de passe' : ' (mot de passe inchangé)'}.\n`);
    }
  } else {
    if (!existing) fail(`Aucun compte avec l'adresse ${email}.`);
    await store.setAdmin(existing.id, false);
    console.log(`\nC'est fait : ${email} n'est plus administrateur (le compte et sa progression restent).`);
    if (envAdmins.has(email)) console.log('Attention : cette adresse est encore dans ADMIN_EMAILS (.env), qui la garde administrateur. Retirez-la aussi.');
    console.log('');
  }
} else {
  fail(`Commande inconnue : ${command}\n\n${HELP}`);
}

process.exit(0);

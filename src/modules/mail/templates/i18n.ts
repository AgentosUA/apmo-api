/** Languages of the site (see `Language` in the web app). */
const MAIL_LANGUAGES = ['en', 'uk', 'cz'] as const;

type MailLanguage = (typeof MAIL_LANGUAGES)[number];

const resolveMailLanguage = (...candidates: unknown[]): MailLanguage =>
  (candidates.find((value) =>
    MAIL_LANGUAGES.includes(value as MailLanguage),
  ) as MailLanguage) ?? 'en';

/** `lang` attribute of the HTML document (`cz` is not an ISO 639-1 code). */
const HTML_LANG: Record<MailLanguage, string> = {
  en: 'en',
  uk: 'uk',
  cz: 'cs',
};

const strings = {
  en: {
    greeting: (name: string) => `Hi, ${name}!`,
    greetingAnonymous: 'Hi!',
    footer:
      'You received this email because it was requested for your Arma Plan Maker account.',
    ignore: 'If it was not you, just ignore this email — your account is safe.',

    tempPassword: {
      subject: 'Your temporary password',
      title: 'Password reset',
      preheader: 'Use this password to log in, then set a new one.',
      intro:
        'We received a request to reset the password of your account. Log in with this temporary password:',
      label: 'Temporary password',
      oldStillWorks: 'Your current password keeps working until you change it.',
      action: 'Log in',
      afterLogin:
        'After logging in, open <b>Profile → Change password</b> and set a new password.',
    },

    welcome: {
      subject: 'Welcome to Arma Plan Maker',
      title: 'Account created',
      preheader: 'Your account is ready — plan your next operation.',
      intro: 'Your account is ready. Here is what you can do:',
      steps: [
        'Pick a map or upload a <b>mission.sqm</b> to get the slots, units and vehicles of your mission.',
        'Draw the plan with markers, lines and areas — just like in the game.',
        'Share the link with your squad and edit the plan together in real time.',
      ],
      action: 'Create a plan',
      footer:
        'You received this email because an account was created with this address.',
    },

    linked: {
      subject: (provider: string) => `${provider} was linked to your account`,
      title: 'New sign-in method',
      preheader: (provider: string) => `You can now log in with ${provider}.`,
      intro: (provider: string) =>
        `<b>${provider}</b> was linked to your account. From now on you can log in with it.`,
      provider: 'Service',
      account: 'Account',
      date: 'Date',
      notYou:
        'If it was not you, change your password and unlink this service in <b>Profile → Sign-in methods</b>.',
      action: 'Open profile',
    },
  },

  uk: {
    greeting: (name: string) => `Вітаємо, ${name}!`,
    greetingAnonymous: 'Вітаємо!',
    footer:
      'Ви отримали цей лист, бо його запросили для вашого акаунта Arma Plan Maker.',
    ignore:
      'Якщо це були не ви — просто проігноруйте лист, ваш акаунт у безпеці.',

    tempPassword: {
      subject: 'Ваш тимчасовий пароль',
      title: 'Відновлення пароля',
      preheader: 'Увійдіть із цим паролем, а потім задайте новий.',
      intro:
        'Ми отримали запит на відновлення пароля вашого акаунта. Увійдіть із тимчасовим паролем:',
      label: 'Тимчасовий пароль',
      oldStillWorks: 'Поточний пароль діє, доки ви його не зміните.',
      action: 'Увійти',
      afterLogin:
        'Після входу відкрийте <b>Профіль → Змінити пароль</b> і задайте новий пароль.',
    },

    welcome: {
      subject: 'Ласкаво просимо до Arma Plan Maker',
      title: 'Акаунт створено',
      preheader: 'Акаунт готовий — плануйте наступну операцію.',
      intro: 'Ваш акаунт готовий. Ось із чого почати:',
      steps: [
        'Оберіть мапу або завантажте <b>mission.sqm</b>, щоб отримати слоти, юніти й техніку місії.',
        'Малюйте план маркерами, лініями й зонами — як у грі.',
        'Поділіться посиланням із загоном і редагуйте план разом у реальному часі.',
      ],
      action: 'Створити план',
      footer: 'Ви отримали цей лист, бо на цю адресу створено акаунт.',
    },

    linked: {
      subject: (provider: string) => `${provider} прив'язано до вашого акаунта`,
      title: 'Новий спосіб входу',
      preheader: (provider: string) =>
        `Тепер ви можете входити через ${provider}.`,
      intro: (provider: string) =>
        `До вашого акаунта прив'язано <b>${provider}</b>. Відтепер ви можете входити через нього.`,
      provider: 'Сервіс',
      account: 'Акаунт',
      date: 'Дата',
      notYou:
        "Якщо це були не ви — змініть пароль і відв'яжіть сервіс у <b>Профіль → Способи входу</b>.",
      action: 'Відкрити профіль',
    },
  },

  cz: {
    greeting: (name: string) => `Ahoj, ${name}!`,
    greetingAnonymous: 'Ahoj!',
    footer:
      'Tento e-mail jste obdrželi, protože byl vyžádán pro váš účet Arma Plan Maker.',
    ignore:
      'Pokud jste to nebyli vy, e-mail ignorujte — váš účet je v bezpečí.',

    tempPassword: {
      subject: 'Vaše dočasné heslo',
      title: 'Obnovení hesla',
      preheader: 'Přihlaste se tímto heslem a poté si nastavte nové.',
      intro:
        'Obdrželi jsme žádost o obnovení hesla k vašemu účtu. Přihlaste se tímto dočasným heslem:',
      label: 'Dočasné heslo',
      oldStillWorks: 'Vaše současné heslo platí, dokud ho nezměníte.',
      action: 'Přihlásit se',
      afterLogin:
        'Po přihlášení otevřete <b>Profil → Změnit heslo</b> a nastavte si nové heslo.',
    },

    welcome: {
      subject: 'Vítejte v Arma Plan Maker',
      title: 'Účet vytvořen',
      preheader: 'Váš účet je připraven — naplánujte další operaci.',
      intro: 'Váš účet je připraven. Co můžete dělat:',
      steps: [
        'Vyberte mapu nebo nahrajte <b>mission.sqm</b> a získejte sloty, jednotky a vozidla mise.',
        'Kreslete plán pomocí značek, čar a oblastí — stejně jako ve hře.',
        'Sdílejte odkaz se svou jednotkou a upravujte plán společně v reálném čase.',
      ],
      action: 'Vytvořit plán',
      footer:
        'Tento e-mail jste obdrželi, protože s touto adresou byl vytvořen účet.',
    },

    linked: {
      subject: (provider: string) => `${provider} byl propojen s vaším účtem`,
      title: 'Nový způsob přihlášení',
      preheader: (provider: string) =>
        `Nyní se můžete přihlásit přes ${provider}.`,
      intro: (provider: string) =>
        `K vašemu účtu byl propojen <b>${provider}</b>. Od teď se můžete přihlašovat přes něj.`,
      provider: 'Služba',
      account: 'Účet',
      date: 'Datum',
      notYou:
        'Pokud jste to nebyli vy, změňte heslo a odpojte službu v <b>Profil → Způsoby přihlášení</b>.',
      action: 'Otevřít profil',
    },
  },
} satisfies Record<MailLanguage, unknown>;

export { HTML_LANG, MAIL_LANGUAGES, resolveMailLanguage, strings };
export type { MailLanguage };

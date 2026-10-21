import type { Dictionary } from '../../types';

/** Page-scoped dictionary module for the tracker page (`/tracker`). */
const en: Dictionary = {
  tracker: {
    // Header
    tag: 'STEP 4 • APPLICATION TRACKER',
    title: 'APPLICATION TRACKER',
    lede: 'Every opportunity you save, with the readiness score from the moment you saved it. Deadlines within {days} days are highlighted.',

    // Shared tracker strings (kept so the namespace survives the module swap)
    viewTable: 'Table',
    viewBoard: 'Board',
    viewLabel: 'Tracker view',
    addItem: 'Add item',
    empty: 'Nothing tracked yet. Run a check and save the result to your tracker.',
    exportJson: 'Export JSON',
    exportPdf: 'Export PDF',
    exportIcs: 'Export calendar',
    share: 'Share',
    deadlineSoon: 'Deadline within 7 days',
    statusLabel: 'Application status',
    notes: 'Notes',
    deleteItem: 'Delete {title}',

    // Tracker statuses (enum values rendered through the dictionary)
    status: {
      Interested: 'Interested',
      Preparing: 'Preparing',
      Applied: 'Applied',
      Interview: 'Interview',
      Result: 'Result'
    },

    // Controls
    all: 'All',
    labelStatus: 'Status',
    sortBy: 'Sort by',
    sort: {
      deadline: 'Deadline (soonest first)',
      readiness: 'Readiness score',
      title: 'Title (A–Z)',
      created: 'Recently saved'
    },
    search: 'Search',
    searchPlaceholder: 'Title, source or note',
    dueWithinDays: 'Due within {days} days',
    view: 'View',
    clearFilters: 'Clear filters',
    noMatches: 'No saved opportunities match these filters.',

    // Stats
    stat: {
      saved: 'Saved',
      dueSoon: 'Due in {days} days'
    },

    // Empty state
    emptyTitle: 'Nothing saved yet',
    emptyBody:
      'Run a check, then press “Save to Tracker” on the results page. Your saved opportunities, deadlines and notes will appear here.',

    // Actions
    checkAnother: 'Check another',
    exportMyData: 'Export my data (JSON)',
    dismiss: 'Dismiss',
    checkOpportunity: 'Check an opportunity',
    browseDiscover: 'Browse Discover',

    // Banners
    loading: 'Opening your tracker…',
    localOnlyBanner: 'Saved on this device only. Sign in to also keep your tracker in the cloud.',

    // Share links card
    shareLinksTitle: 'Share links',
    shareLinksDescription:
      'Read-only snapshots containing only the opportunity, statuses, score and next steps — never your email, phone number or profile links. Each link expires after 7 days and you can revoke it at any time.',
    noShares:
      'You have not created any share links yet. Press “Share link” on a saved opportunity, or create one from the results page.',
    shareAction: {
      revoked: 'Revoked',
      expired: 'Expired',
      expiresInOneDay: 'Expires in 1 day',
      expiresInDays: 'Expires in {days} days',
      copy: 'Copy link',
      revoke: 'Revoke'
    },

    // Export card
    exportTitle: 'Export your data',
    exportDescription:
      'Downloads one JSON file with your profile, your tracker and your share links.',
    downloadJson: 'Download JSON',
    whatWeStore: 'What we store',

    // Table
    table: {
      opportunity: 'Opportunity',
      deadline: 'Deadline',
      readiness: 'Readiness',
      actions: 'Actions'
    },
    noSourceRecorded: 'No source recorded',
    noSource: 'No source',
    officialPage: 'Official page',
    notScored: 'Not scored',
    addNote: 'Add a note…',
    addToCalendar: 'Add to calendar',
    creating: 'Creating…',
    shareLinkButton: 'Share link',

    // Board
    boardEmptyColumn: 'Nothing here yet.',

    // Deadline chip
    deadline: {
      none: 'No deadline given',
      today: 'Due today',
      tomorrow: 'Due tomorrow',
      inDays: 'Due in {days} days',
      overdueOne: 'Overdue by 1 day',
      overdueMany: 'Overdue by {days} days',
      titleOverdue: 'Deadline has passed'
    },

    // Accessible labels
    a11y: {
      statusFor: 'Status for {title}',
      notesFor: 'Notes for {title}',
      move: 'Move {title}'
    },

    // Tooltips
    tip: {
      addToCalendar: 'Download a calendar file with a 3-day and 1-day reminder',
      shareLink: 'Create a read-only link that expires in 7 days'
    },

    // Messages
    errors: {
      load: 'We could not open your tracker just now. Please refresh the page.',
      save: 'That change could not be saved. Please try again.',
      noDeadline: 'This opportunity has no deadline, so a calendar file cannot be created.',
      ics: 'We could not build the calendar file for this deadline.',
      share: 'We could not create a share link right now. Please try again.',
      copy: 'Copying is blocked by the browser. Open the link and copy it from the address bar.'
    },
    notices: {
      shareCopied: 'Read-only link copied. It expires in 7 days and you can revoke it below.',
      shareCreated: 'Read-only link created. Copy it from the list below.',
      revoked: 'Link revoked. It no longer opens for anyone.',
      copied: 'Link copied.',
      emptyExport: 'Your tracker is empty, so this export contains your profile only.'
    },
    confirmRemove: 'Remove “{title}” from your tracker?',
    thisOpportunity: 'this opportunity',
    icsDescription: 'OpportunityKit reminder for {title}. Readiness {score}% ({label}).'
  }
};

const hi: Dictionary = {
  tracker: {
    // Header
    tag: 'चरण 4 • आवेदन ट्रैकर',
    title: 'आवेदन ट्रैकर',
    lede: 'आप जो भी अवसर सहेजते हैं, उसके साथ सहेजने के क्षण का तैयारी स्कोर। {days} दिनों के भीतर की समय-सीमाएँ हाइलाइट की जाती हैं।',

    // Shared tracker strings
    viewTable: 'तालिका',
    viewBoard: 'बोर्ड',
    viewLabel: 'ट्रैकर दृश्य',
    addItem: 'आइटम जोड़ें',
    empty: 'अभी तक कुछ ट्रैक नहीं किया गया। एक जाँच चलाएँ और परिणाम अपने ट्रैकर में सहेजें।',
    exportJson: 'JSON निर्यात करें',
    exportPdf: 'PDF निर्यात करें',
    exportIcs: 'कैलेंडर निर्यात करें',
    share: 'साझा करें',
    deadlineSoon: 'समय-सीमा 7 दिनों के भीतर',
    statusLabel: 'आवेदन की स्थिति',
    notes: 'नोट्स',
    deleteItem: '{title} हटाएँ',

    // Tracker statuses
    status: {
      Interested: 'इच्छुक',
      Preparing: 'तैयारी में',
      Applied: 'आवेदन किया',
      Interview: 'साक्षात्कार',
      Result: 'परिणाम'
    },

    // Controls
    all: 'सभी',
    labelStatus: 'स्थिति',
    sortBy: 'क्रमबद्ध करें',
    sort: {
      deadline: 'समय-सीमा (सबसे निकट पहले)',
      readiness: 'तैयारी स्कोर',
      title: 'शीर्षक (A–Z)',
      created: 'हाल ही में सहेजा गया'
    },
    search: 'खोजें',
    searchPlaceholder: 'शीर्षक, स्रोत या नोट',
    dueWithinDays: '{days} दिनों के भीतर देय',
    view: 'दृश्य',
    clearFilters: 'फ़िल्टर हटाएँ',
    noMatches: 'इन फ़िल्टरों से कोई सहेजा गया अवसर मेल नहीं खाता।',

    // Stats
    stat: {
      saved: 'सहेजे गए',
      dueSoon: '{days} दिनों में देय'
    },

    // Empty state
    emptyTitle: 'अभी तक कुछ सहेजा नहीं गया',
    emptyBody:
      'एक जाँच चलाएँ, फिर परिणाम पृष्ठ पर “ट्रैकर में सहेजें” दबाएँ। आपके सहेजे गए अवसर, समय-सीमाएँ और नोट्स यहाँ दिखाई देंगे।',

    // Actions
    checkAnother: 'दूसरा जाँचें',
    exportMyData: 'मेरा डेटा निर्यात करें (JSON)',
    dismiss: 'बंद करें',
    checkOpportunity: 'एक अवसर जाँचें',
    browseDiscover: 'डिस्कवर ब्राउज़ करें',

    // Banners
    loading: 'आपका ट्रैकर खोला जा रहा है…',
    localOnlyBanner: 'केवल इस डिवाइस पर सहेजा गया। अपना ट्रैकर क्लाउड में भी रखने के लिए साइन इन करें।',

    // Share links card
    shareLinksTitle: 'साझा लिंक',
    shareLinksDescription:
      'केवल-पढ़ने योग्य स्नैपशॉट जिनमें केवल अवसर, स्थितियाँ, स्कोर और अगले कदम होते हैं — कभी भी आपका ईमेल, फ़ोन नंबर या प्रोफ़ाइल लिंक नहीं। प्रत्येक लिंक 7 दिनों के बाद समाप्त होता है और आप इसे कभी भी रद्द कर सकते हैं।',
    noShares:
      'आपने अभी तक कोई साझा लिंक नहीं बनाया है। किसी सहेजे गए अवसर पर “लिंक साझा करें” दबाएँ, या परिणाम पृष्ठ से एक बनाएँ।',
    shareAction: {
      revoked: 'रद्द किया गया',
      expired: 'समाप्त',
      expiresInOneDay: '1 दिन में समाप्त होगा',
      expiresInDays: '{days} दिनों में समाप्त होगा',
      copy: 'लिंक कॉपी करें',
      revoke: 'रद्द करें'
    },

    // Export card
    exportTitle: 'अपना डेटा निर्यात करें',
    exportDescription:
      'आपकी प्रोफ़ाइल, आपका ट्रैकर और आपके साझा लिंक वाली एक JSON फ़ाइल डाउनलोड करता है।',
    downloadJson: 'JSON डाउनलोड करें',
    whatWeStore: 'हम क्या संग्रहीत करते हैं',

    // Table
    table: {
      opportunity: 'अवसर',
      deadline: 'समय-सीमा',
      readiness: 'तैयारी',
      actions: 'क्रियाएँ'
    },
    noSourceRecorded: 'कोई स्रोत दर्ज नहीं',
    noSource: 'कोई स्रोत नहीं',
    officialPage: 'आधिकारिक पृष्ठ',
    notScored: 'स्कोर नहीं',
    addNote: 'एक नोट जोड़ें…',
    addToCalendar: 'कैलेंडर में जोड़ें',
    creating: 'बनाया जा रहा है…',
    shareLinkButton: 'लिंक साझा करें',

    // Board
    boardEmptyColumn: 'अभी यहाँ कुछ नहीं है।',

    // Deadline chip
    deadline: {
      none: 'कोई समय-सीमा नहीं दी गई',
      today: 'आज देय',
      tomorrow: 'कल देय',
      inDays: '{days} दिनों में देय',
      overdueOne: '1 दिन विलंब',
      overdueMany: '{days} दिन विलंब',
      titleOverdue: 'समय-सीमा बीत चुकी है'
    },

    // Accessible labels
    a11y: {
      statusFor: '{title} की स्थिति',
      notesFor: '{title} के लिए नोट्स',
      move: '{title} को ले जाएँ'
    },

    // Tooltips
    tip: {
      addToCalendar: '3-दिन और 1-दिन के रिमाइंडर वाली कैलेंडर फ़ाइल डाउनलोड करें',
      shareLink: '7 दिनों में समाप्त होने वाला केवल-पढ़ने योग्य लिंक बनाएँ'
    },

    // Messages
    errors: {
      load: 'हम अभी आपका ट्रैकर नहीं खोल सके। कृपया पृष्ठ रीफ़्रेश करें।',
      save: 'वह बदलाव सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।',
      noDeadline: 'इस अवसर की कोई समय-सीमा नहीं है, इसलिए कैलेंडर फ़ाइल नहीं बनाई जा सकती।',
      ics: 'हम इस समय-सीमा के लिए कैलेंडर फ़ाइल नहीं बना सके।',
      share: 'हम अभी साझा लिंक नहीं बना सके। कृपया पुनः प्रयास करें।',
      copy: 'ब्राउज़र द्वारा कॉपी करना अवरुद्ध है। लिंक खोलें और इसे एड्रेस बार से कॉपी करें।'
    },
    notices: {
      shareCopied: 'केवल-पढ़ने योग्य लिंक कॉपी हो गया। यह 7 दिनों में समाप्त होगा और आप इसे नीचे रद्द कर सकते हैं।',
      shareCreated: 'केवल-पढ़ने योग्य लिंक बन गया। इसे नीचे दी गई सूची से कॉपी करें।',
      revoked: 'लिंक रद्द कर दिया गया। यह अब किसी के लिए नहीं खुलता।',
      copied: 'लिंक कॉपी हो गया।',
      emptyExport: 'आपका ट्रैकर खाली है, इसलिए इस निर्यात में केवल आपकी प्रोफ़ाइल है।'
    },
    confirmRemove: '“{title}” को अपने ट्रैकर से हटाएँ?',
    thisOpportunity: 'यह अवसर',
    icsDescription: '{title} के लिए OpportunityKit रिमाइंडर। तैयारी {score}% ({label})।'
  }
};

const mr: Dictionary = {
  tracker: {
    // Header
    tag: 'टप्पा ४ • अर्ज ट्रॅकर',
    title: 'अर्ज ट्रॅकर',
    lede: 'तुम्ही जतन केलेली प्रत्येक संधी, ती जतन केल्याच्या क्षणीच्या तयारी गुणासह. {days} दिवसांत येणाऱ्या अंतिम मुदती ठळक केल्या जातात.',

    // Shared tracker strings
    viewTable: 'तक्ता',
    viewBoard: 'फलक',
    viewLabel: 'ट्रॅकर दृश्य',
    addItem: 'आयटम जोडा',
    empty: 'अद्याप काहीही ट्रॅक केलेले नाही. एक तपासणी चालवा आणि निकाल तुमच्या ट्रॅकरमध्ये जतन करा.',
    exportJson: 'JSON निर्यात करा',
    exportPdf: 'PDF निर्यात करा',
    exportIcs: 'दिनदर्शिका निर्यात करा',
    share: 'शेअर करा',
    deadlineSoon: 'अंतिम मुदत 7 दिवसांत',
    statusLabel: 'अर्जाची स्थिती',
    notes: 'टिपा',
    deleteItem: '{title} हटवा',

    // Tracker statuses
    status: {
      Interested: 'इच्छुक',
      Preparing: 'तयारी करत आहे',
      Applied: 'अर्ज केला',
      Interview: 'मुलाखत',
      Result: 'निकाल'
    },

    // Controls
    all: 'सर्व',
    labelStatus: 'स्थिती',
    sortBy: 'क्रमवारी लावा',
    sort: {
      deadline: 'अंतिम मुदत (सर्वात जवळची आधी)',
      readiness: 'तयारी गुण',
      title: 'शीर्षक (A–Z)',
      created: 'अलीकडे जतन केलेले'
    },
    search: 'शोधा',
    searchPlaceholder: 'शीर्षक, स्रोत किंवा टीप',
    dueWithinDays: '{days} दिवसांत देय',
    view: 'दृश्य',
    clearFilters: 'फिल्टर साफ करा',
    noMatches: 'या फिल्टरशी जुळणारी कोणतीही जतन केलेली संधी नाही.',

    // Stats
    stat: {
      saved: 'जतन केलेले',
      dueSoon: '{days} दिवसांत देय'
    },

    // Empty state
    emptyTitle: 'अद्याप काहीही जतन केलेले नाही',
    emptyBody:
      'एक तपासणी चालवा, नंतर निकाल पृष्ठावर “ट्रॅकरमध्ये जतन करा” दाबा. तुमच्या जतन केलेल्या संधी, अंतिम मुदती आणि टिपा येथे दिसतील.',

    // Actions
    checkAnother: 'अजून एक तपासा',
    exportMyData: 'माझा डेटा निर्यात करा (JSON)',
    dismiss: 'बंद करा',
    checkOpportunity: 'एक संधी तपासा',
    browseDiscover: 'डिस्कव्हर ब्राउझ करा',

    // Banners
    loading: 'तुमचा ट्रॅकर उघडत आहे…',
    localOnlyBanner: 'फक्त या डिव्हाइसवर जतन केलेले. तुमचा ट्रॅकर क्लाउडमध्येही ठेवण्यासाठी साइन इन करा.',

    // Share links card
    shareLinksTitle: 'शेअर दुवे',
    shareLinksDescription:
      'केवळ-वाचन स्नॅपशॉट ज्यात फक्त संधी, स्थिती, गुण आणि पुढील पायऱ्या असतात — तुमचा ईमेल, फोन नंबर किंवा प्रोफाइल दुवे कधीही नाही. प्रत्येक दुवा 7 दिवसांनंतर कालबाह्य होतो आणि तुम्ही तो कधीही रद्द करू शकता.',
    noShares:
      'तुम्ही अद्याप कोणताही शेअर दुवा तयार केलेला नाही. जतन केलेल्या संधीवर “दुवा शेअर करा” दाबा, किंवा निकाल पृष्ठावरून एक तयार करा.',
    shareAction: {
      revoked: 'रद्द केले',
      expired: 'कालबाह्य',
      expiresInOneDay: '1 दिवसात कालबाह्य होईल',
      expiresInDays: '{days} दिवसांत कालबाह्य होईल',
      copy: 'दुवा कॉपी करा',
      revoke: 'रद्द करा'
    },

    // Export card
    exportTitle: 'तुमचा डेटा निर्यात करा',
    exportDescription:
      'तुमचे प्रोफाइल, तुमचा ट्रॅकर आणि तुमचे शेअर दुवे असलेली एक JSON फाइल डाउनलोड करते.',
    downloadJson: 'JSON डाउनलोड करा',
    whatWeStore: 'आम्ही काय साठवतो',

    // Table
    table: {
      opportunity: 'संधी',
      deadline: 'अंतिम मुदत',
      readiness: 'तयारी',
      actions: 'क्रिया'
    },
    noSourceRecorded: 'कोणताही स्रोत नोंदलेला नाही',
    noSource: 'स्रोत नाही',
    officialPage: 'अधिकृत पृष्ठ',
    notScored: 'गुण नाही',
    addNote: 'टीप जोडा…',
    addToCalendar: 'दिनदर्शिकेत जोडा',
    creating: 'तयार करत आहे…',
    shareLinkButton: 'दुवा शेअर करा',

    // Board
    boardEmptyColumn: 'इथे अजून काही नाही.',

    // Deadline chip
    deadline: {
      none: 'अंतिम मुदत दिलेली नाही',
      today: 'आज देय',
      tomorrow: 'उद्या देय',
      inDays: '{days} दिवसांत देय',
      overdueOne: '1 दिवस उशीर',
      overdueMany: '{days} दिवस उशीर',
      titleOverdue: 'अंतिम मुदत संपली आहे'
    },

    // Accessible labels
    a11y: {
      statusFor: '{title} ची स्थिती',
      notesFor: '{title} साठी टिपा',
      move: '{title} हलवा'
    },

    // Tooltips
    tip: {
      addToCalendar: '3-दिवस आणि 1-दिवस स्मरणपत्रासह दिनदर्शिका फाइल डाउनलोड करा',
      shareLink: '7 दिवसांत कालबाह्य होणारा केवळ-वाचन दुवा तयार करा'
    },

    // Messages
    errors: {
      load: 'आम्ही आत्ता तुमचा ट्रॅकर उघडू शकलो नाही. कृपया पृष्ठ रीफ्रेश करा.',
      save: 'तो बदल जतन करता आला नाही. कृपया पुन्हा प्रयत्न करा.',
      noDeadline: 'या संधीची अंतिम मुदत नाही, म्हणून दिनदर्शिका फाइल तयार करता येत नाही.',
      ics: 'आम्ही या अंतिम मुदतीसाठी दिनदर्शिका फाइल तयार करू शकलो नाही.',
      share: 'आम्ही आत्ता शेअर दुवा तयार करू शकलो नाही. कृपया पुन्हा प्रयत्न करा.',
      copy: 'ब्राउझरने कॉपी करणे अवरोधित केले आहे. दुवा उघडा आणि ॲड्रेस बारमधून कॉपी करा.'
    },
    notices: {
      shareCopied: 'केवळ-वाचन दुवा कॉपी झाला. तो 7 दिवसांत कालबाह्य होईल आणि तुम्ही तो खाली रद्द करू शकता.',
      shareCreated: 'केवळ-वाचन दुवा तयार झाला. तो खालील यादीतून कॉपी करा.',
      revoked: 'दुवा रद्द केला. तो आता कोणासाठीही उघडत नाही.',
      copied: 'दुवा कॉपी झाला.',
      emptyExport: 'तुमचा ट्रॅकर रिकामा आहे, म्हणून या निर्यातीत फक्त तुमचे प्रोफाइल आहे.'
    },
    confirmRemove: '“{title}” तुमच्या ट्रॅकरमधून हटवायचे?',
    thisOpportunity: 'ही संधी',
    icsDescription: '{title} साठी OpportunityKit स्मरणपत्र. तयारी {score}% ({label}).'
  }
};

const module_ = { en, hi, mr };
export default module_;

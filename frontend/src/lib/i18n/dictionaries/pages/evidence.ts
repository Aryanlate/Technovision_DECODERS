import type { Dictionary } from '../../types';

/** Page-scoped dictionary module for the evidence audit page (`/evidence`). */
const en: Dictionary = {
  evidence: {
    header: {
      tag: 'STEP 3 • EVIDENCE LEDGER',
      title: 'EVIDENCE',
      subtitle:
        'Every fact this app knows about you and the opportunities you checked. Each change appends a new version; nothing is ever overwritten.'
    },

    loading: 'Loading your evidence…',

    empty: {
      message:
        'No evidence records yet. Save your profile or paste an opportunity checklist and the facts will appear here.',
      action: 'Go to Check Page'
    },

    subject: {
      profile: 'Your profile',
      opportunity: 'Opportunity',
      recordCount: '{count} records',
      unknown: 'Unknown subject'
    },

    record: {
      currentValue: 'Current value',
      versionCount: '{count} versions',
      timeline: 'Version timeline',
      created: 'Created',
      changed: 'Changed',
      unchanged: 'Value unchanged',
      from: 'From',
      to: 'To',
      origin: 'Origin',
      trust: 'Trust',
      source: 'Source',
      noSource: 'No source link or sentence',
      emptyValue: 'Empty',
      superseded: 'Superseded'
    },

    actions: {
      backToResult: '← Back to result'
    }
  }
};

const hi: Dictionary = {
  evidence: {
    header: {
      tag: 'चरण 3 • प्रमाण बही',
      title: 'प्रमाण',
      subtitle:
        'यह ऐप आपके बारे में और आपके द्वारा जाँचे गए अवसरों के बारे में जो भी जानता है। हर बदलाव एक नया संस्करण जोड़ता है; कुछ भी अधिलेखित नहीं होता।'
    },

    loading: 'आपके प्रमाण लोड हो रहे हैं…',

    empty: {
      message:
        'अभी कोई प्रमाण रिकॉर्ड नहीं है। अपनी प्रोफ़ाइल सहेजें या अवसर चेकलिस्ट पेस्ट करें और तथ्य यहाँ दिखेंगे।',
      action: 'चेक पेज पर जाएँ'
    },

    subject: {
      profile: 'आपकी प्रोफ़ाइल',
      opportunity: 'अवसर',
      recordCount: '{count} रिकॉर्ड',
      unknown: 'अज्ञात विषय'
    },

    record: {
      currentValue: 'वर्तमान मान',
      versionCount: '{count} संस्करण',
      timeline: 'संस्करण समयरेखा',
      created: 'बनाया गया',
      changed: 'बदला गया',
      unchanged: 'मान नहीं बदला',
      from: 'से',
      to: 'तक',
      origin: 'स्रोत प्रकार',
      trust: 'विश्वास',
      source: 'स्रोत',
      noSource: 'कोई स्रोत लिंक या वाक्य नहीं',
      emptyValue: 'खाली',
      superseded: 'प्रतिस्थापित'
    },

    actions: {
      backToResult: '← परिणाम पर वापस जाएँ'
    }
  }
};

const mr: Dictionary = {
  evidence: {
    header: {
      tag: 'टप्पा 3 • पुरावा वही',
      title: 'पुरावा',
      subtitle:
        'हे ॲप तुमच्याबद्दल आणि तुम्ही तपासलेल्या संधींबद्दल जे काही जाणते. प्रत्येक बदल नवीन आवृत्ती जोडतो; काहीही अधिलिखित होत नाही.'
    },

    loading: 'तुमचे पुरावे लोड होत आहेत…',

    empty: {
      message:
        'अजून कोणतीही पुरावा नोंद नाही. तुमचे प्रोफाइल जतन करा किंवा संधी चेकलिस्ट पेस्ट करा आणि वस्तुस्थिती येथे दिसतील.',
      action: 'तपासणी पेजवर जा'
    },

    subject: {
      profile: 'तुमचे प्रोफाइल',
      opportunity: 'संधी',
      recordCount: '{count} नोंदी',
      unknown: 'अज्ञात विषय'
    },

    record: {
      currentValue: 'सध्याचे मूल्य',
      versionCount: '{count} आवृत्त्या',
      timeline: 'आवृत्ती कालरेषा',
      created: 'तयार केले',
      changed: 'बदलले',
      unchanged: 'मूल्य बदलले नाही',
      from: 'पासून',
      to: 'पर्यंत',
      origin: 'स्रोत प्रकार',
      trust: 'विश्वास',
      source: 'स्रोत',
      noSource: 'स्रोत लिंक किंवा वाक्य नाही',
      emptyValue: 'रिकामे',
      superseded: 'बदललेले'
    },

    actions: {
      backToResult: '← निकालावर परत जा'
    }
  }
};

const module_ = { en, hi, mr };
export default module_;

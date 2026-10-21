import type { Dictionary } from '../types';

/**
 * Dictionary module for strings rendered by shared components (summary bar,
 * tracker table/board, deadline chip, agent panels, ...).
 * Merged over the shared dictionary, so keys here win where they overlap.
 */
const en: Dictionary = {
  components: {
    summaryBar: {
      regionLabel: 'Opportunity eligibility summary',
      verdictSummary: 'VERDICT SUMMARY',
      statusLabel: 'STATUS:',
      totalCriteria: '{total} Total Criteria',
      progressLabel: '{match} {matchLabel}, {mismatch} {mismatchLabel}, {missing} {missingLabel}',
      segmentTitle: '{count} {label} ({percent}%)'
    },

    saveToTracker: {
      save: 'Save to Tracker',
      saved: '✓ Saved to Tracker',
      openTracker: 'Open tracker →',
      error: 'Could not save right now. Please check your browser storage and try again.'
    },

    agentActivity: {
      title: 'Agent Activity Live Panel',
      running: 'Running Orchestrator',
      complete: '{done}/{total} Complete',
      totalTime: 'Total time: {time}s',
      statusQueued: 'Queued',
      statusRunning: 'Running...',
      statusDone: 'Done',
      statusFailed: 'Failed'
    },

    suggestionsInbox: {
      title: 'Suggestions Inbox',
      pendingCount: '{count} PENDING',
      subtitle: 'Evidence gathered by agents. Confirm items to update your profile automatically.',
      acceptedCount: '✓ {count} Accepted',
      emptyTitle: 'Inbox Clear',
      emptyBody:
        'No pending agent suggestions. Analyze an opportunity or profile links to discover verified skills and credentials.',
      via: 'via {agent}',
      evidenceSource: 'Evidence source: {source}',
      accept: 'Accept',
      acceptTitle: 'Accept and add this item to your profile',
      reject: 'Reject',
      rejectTitle: 'Dismiss this suggestion',
      principleLabel: 'Principle: ',
      principleBody:
        'Agents only suggest credentials and evidence based on your public links. They never apply to anything and never decide a status. You always confirm before anything counts.'
    },

    scamPanel: {
      points: '{score} points',
      pointsShort: '{score} pts',
      warningSign: 'Warning sign',
      safetyCheck: 'Safety check',
      warningSignsHeading: 'Warning signs in the listing text',
      noWarning: 'No warning sign was found in the text.',
      findingsHeading: 'What was found, and what it costs',
      pointsPlus: '+{points} pts',
      staySafe: 'Stay safe'
    },

    failureAlert: {
      emptyPaste: {
        title: 'No Opportunity Text Pasted',
        desc: 'Please paste an internship listing, scholarship notice, or competition description in the box above to extract criteria.',
        badge: 'INPUT REQUIRED'
      },
      unparseable: {
        title: 'Unparseable Opportunity Text',
        desc: 'We could not detect clear structured eligibility criteria (year, CGPA, skills, documents, or links) from the pasted text. You can add requirements manually using "+ Add".',
        badge: 'PARSE NOTICE'
      },
      invalidLink: {
        title: 'Invalid Profile Link Format',
        desc: 'Please verify link format. GitHub links should look like github.com/username and LinkedIn like linkedin.com/in/username.',
        badge: 'FORMAT MISMATCH'
      },
      missingProfile: {
        title: 'Student Profile Not Found',
        desc: 'You have not set up your master student credentials yet. Set up your profile once or load our benchmark student profile to verify your eligibility.',
        badge: 'PROFILE MISSING'
      },
      agentTimeout: {
        title: 'Agent Response Timeout (Backend Asleep)',
        desc: 'The live AI agent service did not respond in time (free Render instances sleep on inactivity). OpportunityKit safely fell back to deterministic rule analysis.',
        badge: 'OFFLINE FALLBACK'
      },
      rateLimit: {
        title: 'Free Tier Provider Rate Limit',
        desc: 'The free tier LLM provider rate limit was reached. OpportunityKit automatically switched to cached benchmark responses so your session continues uninterrupted.',
        badge: 'RATE LIMIT NOTICED'
      }
    }
  }
};

const hi: Dictionary = {
  components: {
    summaryBar: {
      regionLabel: 'अवसर पात्रता सारांश',
      verdictSummary: 'निर्णय सारांश',
      statusLabel: 'स्थिति:',
      totalCriteria: '{total} कुल शर्तें',
      progressLabel: '{match} {matchLabel}, {mismatch} {mismatchLabel}, {missing} {missingLabel}',
      segmentTitle: '{count} {label} ({percent}%)'
    },

    saveToTracker: {
      save: 'ट्रैकर में सहेजें',
      saved: '✓ ट्रैकर में सहेजा गया',
      openTracker: 'ट्रैकर खोलें →',
      error: 'अभी सहेजा नहीं जा सका। कृपया अपने ब्राउज़र स्टोरेज की जाँच करें और फिर कोशिश करें।'
    },

    agentActivity: {
      title: 'एजेंट गतिविधि लाइव पैनल',
      running: 'ऑर्केस्ट्रेटर चल रहा है',
      complete: '{done}/{total} पूर्ण',
      totalTime: 'कुल समय: {time} सेकंड',
      statusQueued: 'कतार में',
      statusRunning: 'चल रहा है...',
      statusDone: 'पूर्ण',
      statusFailed: 'विफल'
    },

    suggestionsInbox: {
      title: 'सुझाव इनबॉक्स',
      pendingCount: '{count} लंबित',
      subtitle: 'एजेंट द्वारा जुटाए गए प्रमाण। आइटम की पुष्टि करके अपनी प्रोफ़ाइल अपने आप अपडेट करें।',
      acceptedCount: '✓ {count} स्वीकृत',
      emptyTitle: 'इनबॉक्स खाली',
      emptyBody:
        'कोई लंबित एजेंट सुझाव नहीं। सत्यापित कौशल और प्रमाण खोजने के लिए किसी अवसर या प्रोफ़ाइल लिंक का विश्लेषण करें।',
      via: '{agent} के माध्यम से',
      evidenceSource: 'प्रमाण स्रोत: {source}',
      accept: 'स्वीकारें',
      acceptTitle: 'स्वीकारें और यह आइटम अपनी प्रोफ़ाइल में जोड़ें',
      reject: 'अस्वीकारें',
      rejectTitle: 'यह सुझाव खारिज करें',
      principleLabel: 'सिद्धांत: ',
      principleBody:
        'एजेंट केवल आपके सार्वजनिक लिंक के आधार पर कौशल और प्रमाण सुझाते हैं। वे कभी कहीं आवेदन नहीं करते और कोई स्थिति तय नहीं करते। कुछ भी गिने जाने से पहले आप हमेशा पुष्टि करते हैं।'
    },

    scamPanel: {
      points: '{score} अंक',
      pointsShort: '{score} अंक',
      warningSign: 'चेतावनी संकेत',
      safetyCheck: 'सुरक्षा जाँच',
      warningSignsHeading: 'लिस्टिंग टेक्स्ट में चेतावनी संकेत',
      noWarning: 'टेक्स्ट में कोई चेतावनी संकेत नहीं मिला।',
      findingsHeading: 'क्या मिला, और उसकी कीमत क्या है',
      pointsPlus: '+{points} अंक',
      staySafe: 'सुरक्षित रहें'
    },

    failureAlert: {
      emptyPaste: {
        title: 'कोई अवसर टेक्स्ट पेस्ट नहीं किया गया',
        desc: 'शर्तें निकालने के लिए कृपया ऊपर के बॉक्स में इंटर्नशिप लिस्टिंग, छात्रवृत्ति सूचना या प्रतियोगिता विवरण पेस्ट करें।',
        badge: 'इनपुट आवश्यक'
      },
      unparseable: {
        title: 'अपठनीय अवसर टेक्स्ट',
        desc: 'पेस्ट किए गए टेक्स्ट से हम स्पष्ट संरचित पात्रता शर्तें (वर्ष, CGPA, कौशल, दस्तावेज़ या लिंक) नहीं पहचान सके। आप "+ जोड़ें" का उपयोग करके शर्तें मैन्युअल रूप से जोड़ सकते हैं।',
        badge: 'पार्स सूचना'
      },
      invalidLink: {
        title: 'अमान्य प्रोफ़ाइल लिंक प्रारूप',
        desc: 'कृपया लिंक प्रारूप जाँचें। GitHub लिंक github.com/username जैसे और LinkedIn linkedin.com/in/username जैसे होने चाहिए।',
        badge: 'प्रारूप बेमेल'
      },
      missingProfile: {
        title: 'छात्र प्रोफ़ाइल नहीं मिली',
        desc: 'आपने अभी तक अपनी मुख्य छात्र जानकारी सेट नहीं की है। अपनी पात्रता जाँचने के लिए एक बार प्रोफ़ाइल सेट करें या हमारी बेंचमार्क छात्र प्रोफ़ाइल लोड करें।',
        badge: 'प्रोफ़ाइल अनुपस्थित'
      },
      agentTimeout: {
        title: 'एजेंट प्रतिक्रिया समय-सीमा (बैकएंड सुप्त)',
        desc: 'लाइव AI एजेंट सेवा ने समय पर जवाब नहीं दिया (मुफ़्त Render इंस्टेंस निष्क्रियता पर सो जाते हैं)। OpportunityKit सुरक्षित रूप से नियतात्मक नियम विश्लेषण पर लौट आया।',
        badge: 'ऑफ़लाइन फ़ॉलबैक'
      },
      rateLimit: {
        title: 'मुफ़्त टियर प्रदाता दर सीमा',
        desc: 'मुफ़्त LLM प्रदाता की दर सीमा पूरी हो गई। OpportunityKit ने अपने आप कैश्ड बेंचमार्क प्रतिक्रियाओं पर स्विच कर दिया ताकि आपका सत्र बिना रुकावट जारी रहे।',
        badge: 'दर सीमा सूचित'
      }
    }
  }
};

const mr: Dictionary = {
  components: {
    summaryBar: {
      regionLabel: 'संधी पात्रता सारांश',
      verdictSummary: 'निर्णय सारांश',
      statusLabel: 'स्थिती:',
      totalCriteria: '{total} एकूण अटी',
      progressLabel: '{match} {matchLabel}, {mismatch} {mismatchLabel}, {missing} {missingLabel}',
      segmentTitle: '{count} {label} ({percent}%)'
    },

    saveToTracker: {
      save: 'ट्रॅकरमध्ये जतन करा',
      saved: '✓ ट्रॅकरमध्ये जतन केले',
      openTracker: 'ट्रॅकर उघडा →',
      error: 'आत्ता जतन करता आले नाही. कृपया तुमचा ब्राउझर स्टोरेज तपासा आणि पुन्हा प्रयत्न करा.'
    },

    agentActivity: {
      title: 'एजंट क्रियाकलाप लाइव्ह पॅनेल',
      running: 'ऑर्केस्ट्रेटर सुरू आहे',
      complete: '{done}/{total} पूर्ण',
      totalTime: 'एकूण वेळ: {time} सेकंद',
      statusQueued: 'रांगेत',
      statusRunning: 'सुरू आहे...',
      statusDone: 'पूर्ण',
      statusFailed: 'अयशस्वी'
    },

    suggestionsInbox: {
      title: 'सूचना इनबॉक्स',
      pendingCount: '{count} प्रलंबित',
      subtitle: 'एजंटने गोळा केलेले पुरावे. आयटमची पुष्टी करून तुमचे प्रोफाइल स्वयंचलितपणे अद्ययावत करा.',
      acceptedCount: '✓ {count} स्वीकारले',
      emptyTitle: 'इनबॉक्स रिकामा',
      emptyBody:
        'प्रलंबित एजंट सूचना नाहीत. सत्यापित कौशल्ये आणि पुरावे शोधण्यासाठी एखाद्या संधीचे किंवा प्रोफाइल लिंकचे विश्लेषण करा.',
      via: '{agent} मार्फत',
      evidenceSource: 'पुरावा स्रोत: {source}',
      accept: 'स्वीकारा',
      acceptTitle: 'स्वीकारा आणि हा आयटम तुमच्या प्रोफाइलमध्ये जोडा',
      reject: 'नाकारा',
      rejectTitle: 'ही सूचना डिसमिस करा',
      principleLabel: 'तत्त्व: ',
      principleBody:
        'एजंट फक्त तुमच्या सार्वजनिक लिंकवर आधारित कौशल्ये आणि पुरावे सुचवतात. ते कधीही कुठेही अर्ज करत नाहीत आणि स्थिती ठरवत नाहीत. काहीही मोजण्यापूर्वी तुम्ही नेहमी पुष्टी करता.'
    },

    scamPanel: {
      points: '{score} गुण',
      pointsShort: '{score} गुण',
      warningSign: 'इशारा',
      safetyCheck: 'सुरक्षा तपासणी',
      warningSignsHeading: 'जाहिरातीतील मजकुरातील इशारे',
      noWarning: 'मजकुरात कोणताही इशारा आढळला नाही.',
      findingsHeading: 'काय आढळले, आणि त्याची किंमत काय',
      pointsPlus: '+{points} गुण',
      staySafe: 'सुरक्षित राहा'
    },

    failureAlert: {
      emptyPaste: {
        title: 'कोणताही संधी मजकूर पेस्ट केलेला नाही',
        desc: 'अटी काढण्यासाठी कृपया वरील बॉक्समध्ये इंटर्नशिप जाहिरात, शिष्यवृत्ती सूचना किंवा स्पर्धेचे वर्णन पेस्ट करा.',
        badge: 'इनपुट आवश्यक'
      },
      unparseable: {
        title: 'न वाचता येणारा संधी मजकूर',
        desc: 'पेस्ट केलेल्या मजकुरातून आम्हाला स्पष्ट संरचित पात्रता अटी (वर्ष, CGPA, कौशल्ये, कागदपत्रे किंवा लिंक) आढळल्या नाहीत. तुम्ही "+ जोडा" वापरून अटी स्वतः जोडू शकता.',
        badge: 'पार्स सूचना'
      },
      invalidLink: {
        title: 'अवैध प्रोफाइल लिंक स्वरूप',
        desc: 'कृपया लिंक स्वरूप तपासा. GitHub लिंक github.com/username सारखी आणि LinkedIn linkedin.com/in/username सारखी असावी.',
        badge: 'स्वरूप जुळत नाही'
      },
      missingProfile: {
        title: 'विद्यार्थी प्रोफाइल सापडले नाही',
        desc: 'तुम्ही अजून तुमची मुख्य विद्यार्थी माहिती सेट केलेली नाही. तुमची पात्रता तपासण्यासाठी एकदा प्रोफाइल सेट करा किंवा आमचे बेंचमार्क विद्यार्थी प्रोफाइल लोड करा.',
        badge: 'प्रोफाइल अनुपलब्ध'
      },
      agentTimeout: {
        title: 'एजंट प्रतिसाद कालबाह्य (बॅकएंड सुप्त)',
        desc: 'थेट AI एजंट सेवेने वेळेत प्रतिसाद दिला नाही (मोफत Render इन्स्टन्स निष्क्रियतेवर झोपतात). OpportunityKit सुरक्षितपणे निर्धारक नियम विश्लेषणावर परत आले.',
        badge: 'ऑफलाइन फॉलबॅक'
      },
      rateLimit: {
        title: 'मोफत श्रेणी प्रदाता दर मर्यादा',
        desc: 'मोफत LLM प्रदात्याची दर मर्यादा गाठली. OpportunityKit ने स्वयंचलितपणे कॅशे केलेल्या बेंचमार्क प्रतिसादांवर स्विच केले जेणेकरून तुमचे सत्र विनाखंड सुरू राहील.',
        badge: 'दर मर्यादा लक्षात आली'
      }
    }
  }
};

const module_ = { en, hi, mr };
export default module_;

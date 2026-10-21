import type { Dictionary } from '../../types';

/** Page-scoped dictionary module for the check page (`/check`). */
const en: Dictionary = {
  check: {
    tag: 'STEP 1 • PASTE & AUDIT',
    title: 'CHECK OPPORTUNITY',
    subtitle:
      'Paste any internship, scholarship, or hackathon listing. Our transparent rule-based engine parses requirements into an editable checklist.',

    dismiss: 'Dismiss',
    noticeLoadedSample: 'Loaded sample: "{title}"',
    noticeLoadedProfile: 'Loaded benchmark student profile (Alex Sharma).',
    noticeAgentsDone:
      'Agents completed analysis in {seconds}s. Review suggestions inbox below.',
    noticeAcceptedSuggestion: 'Accepted: "{title}" and saved to your profile.',

    wakingUp: 'Waking up the agents...',
    wakingDetail: 'Connecting to cloud agent workers (8s cold start timeout)',
    renderFreeTier: 'Render Free Tier Instance',

    offlineMode: 'Offline Mode',
    offlineRunning: 'Running in offline mode',
    offlineDetail: '— using in-browser rule engine and cached benchmark agent models.',
    retryConnection: 'Retry Connection',

    missingProfileMessage:
      "You haven't created your master profile yet. To verify requirements against your academic credentials, create your profile once or load our benchmark student profile.",
    loadBenchmarkProfile: 'Load Benchmark Profile (Alex Sharma)',

    cardDescriptionTitle: '1. Opportunity Description',
    cardDescriptionBody: 'Paste text from job boards, brochures, or portals.',
    loadSampleOpportunity: 'Load Sample Opportunity',
    clear: 'Clear',

    testOtherScenarios: 'Or Test Other Benchmark Scenarios:',
    sampleStem: 'STEM Scholarship (Income & Marks)',
    sampleHackathon: 'National Hackathon (Team & Deadline)',
    sampleIoT: 'IoT Internship (IoT Project & LinkedIn)',

    opportunityType: 'Opportunity Type',
    autoDetect: 'Auto-detect by default ({type})',
    typeInternship: 'Internship',
    typeScholarship: 'Scholarship',
    typeCompetitionHackathon: 'Competition / Hackathon',
    typeCustomOther: 'Custom / Other',
    opportunityTitleLabel: 'Opportunity Title (Optional)',
    opportunityTitlePlaceholder: 'e.g. Summer Engineering Intern',

    listingTextLabel: 'Opportunity Listing Text',
    listingTextPlaceholder: 'Paste internship, scholarship or hackathon requirements here...',
    loadBenchmarkOpp: 'Load Benchmark Opportunity (Summer Intern)',

    checklistTitle: '2. Parsed Checklist',
    checklistDescription: '{count} structured criteria extracted. Fix, add, or delete.',
    addButton: '+ Add',
    parseWarnings: '⚠ Parse Warnings ({count}):',
    addManually: 'Add Requirement Manually',

    addNewRequirement: 'Add New Requirement',
    requirementLabel: 'Requirement Label',
    requirementLabelPlaceholder: 'e.g. Minimum 1 IoT Project',
    kindLabel: 'Kind',
    valueLabel: 'Value',
    valuePlaceholder: 'e.g. 7.5 or HTML, CSS',
    sourceSentenceLabel: 'Source Sentence (Optional)',
    sourceSentencePlaceholder: 'Sentence from original opportunity',
    mandatoryCriterion: 'Mandatory criterion',
    addToChecklist: 'Add to Checklist',
    sourcePrefix: 'Source: ',
    manuallyAdded: 'Manually added requirement',

    kind: {
      yearOfStudy: 'Year of Study',
      cgpaCutoff: 'CGPA / Cut-off',
      technicalSkills: 'Technical Skills',
      document: 'Document',
      link: 'Link',
      availability: 'Availability',
      projectCount: 'Project Count',
      projectTag: 'Project Tag',
      deadline: 'Deadline',
      custom: 'Custom'
    },
    kindShort: {
      year: 'year',
      cgpa: 'cgpa',
      skills: 'skills',
      document: 'document',
      link: 'link',
      availability: 'availability',
      projectCount: 'projectCount',
      projectTag: 'projectTag',
      deadline: 'deadline',
      custom: 'custom'
    },

    labelLabel: 'Label',
    editRequirementTitle: 'Edit this requirement',
    deleteRequirementTitle: 'Delete requirement',
    asks: 'Asks: ',

    compareWithProfile: 'Compare with my profile →',
    runningAgents: 'Running 6 AI Agents...',
    runAgents: '⚡ Run AI Agents (Live Verification & Discovery)',

    liveAgentActivity: 'Live Agent Activity',
    liveAgentDescription:
      'Real-time execution status of 6 specialized agents coordinated by the plain TypeScript Orchestrator.',
    agentsRunning: 'Agents Running...',
    triggerAgentRun: 'Trigger Agent Run',

    safetyRulePrefix: 'Safety & Governance Rule: ',
    safetyRuleBody:
      'Agents only suggest and research credentials. They never apply to anything on your behalf and never decide an eligibility verdict.',

    compareNoRequirements:
      'Please paste an opportunity or add at least one requirement before comparing.'
  }
};

const hi: Dictionary = {
  check: {
    tag: 'चरण 1 • पेस्ट और ऑडिट',
    title: 'अवसर जाँचें',
    subtitle:
      'कोई भी इंटर्नशिप, छात्रवृत्ति या हैकाथॉन लिस्टिंग पेस्ट करें। हमारा पारदर्शी नियम-आधारित इंजन आवश्यकताओं को एक संपादन-योग्य चेकलिस्ट में बदल देता है।',

    dismiss: 'हटाएँ',
    noticeLoadedSample: 'नमूना लोड किया: "{title}"',
    noticeLoadedProfile: 'बेंचमार्क छात्र प्रोफ़ाइल लोड की (Alex Sharma)।',
    noticeAgentsDone:
      'एजेंट्स ने {seconds} सेकंड में विश्लेषण पूरा किया। नीचे सुझाव इनबॉक्स देखें।',
    noticeAcceptedSuggestion: 'स्वीकार किया: "{title}" और आपकी प्रोफ़ाइल में सहेजा।',

    wakingUp: 'एजेंट्स को जगाया जा रहा है...',
    wakingDetail: 'क्लाउड एजेंट वर्कर्स से कनेक्ट हो रहा है (8s कोल्ड स्टार्ट टाइमआउट)',
    renderFreeTier: 'Render फ्री टियर इंस्टेंस',

    offlineMode: 'ऑफ़लाइन मोड',
    offlineRunning: 'ऑफ़लाइन मोड में चल रहा है',
    offlineDetail: '— ब्राउज़र में मौजूद नियम इंजन और कैश्ड बेंचमार्क एजेंट मॉडल का उपयोग कर रहा है।',
    retryConnection: 'कनेक्शन पुनः प्रयास करें',

    missingProfileMessage:
      'आपने अभी तक अपनी मास्टर प्रोफ़ाइल नहीं बनाई है। अपनी शैक्षणिक योग्यताओं के विरुद्ध आवश्यकताओं की जाँच के लिए, एक बार अपनी प्रोफ़ाइल बनाएँ या हमारी बेंचमार्क छात्र प्रोफ़ाइल लोड करें।',
    loadBenchmarkProfile: 'बेंचमार्क प्रोफ़ाइल लोड करें (Alex Sharma)',

    cardDescriptionTitle: '1. अवसर विवरण',
    cardDescriptionBody: 'जॉब बोर्ड, ब्रोशर या पोर्टल से टेक्स्ट पेस्ट करें।',
    loadSampleOpportunity: 'नमूना अवसर लोड करें',
    clear: 'साफ़ करें',

    testOtherScenarios: 'या अन्य बेंचमार्क परिदृश्य आज़माएँ:',
    sampleStem: 'STEM छात्रवृत्ति (आय और अंक)',
    sampleHackathon: 'राष्ट्रीय हैकाथॉन (टीम और समय-सीमा)',
    sampleIoT: 'IoT इंटर्नशिप (IoT प्रोजेक्ट और LinkedIn)',

    opportunityType: 'अवसर प्रकार',
    autoDetect: 'डिफ़ॉल्ट रूप से स्वतः पहचानें ({type})',
    typeInternship: 'इंटर्नशिप',
    typeScholarship: 'छात्रवृत्ति',
    typeCompetitionHackathon: 'प्रतियोगिता / हैकाथॉन',
    typeCustomOther: 'कस्टम / अन्य',
    opportunityTitleLabel: 'अवसर शीर्षक (वैकल्पिक)',
    opportunityTitlePlaceholder: 'उदा. समर इंजीनियरिंग इंटर्न',

    listingTextLabel: 'अवसर लिस्टिंग टेक्स्ट',
    listingTextPlaceholder: 'यहाँ इंटर्नशिप, छात्रवृत्ति या हैकाथॉन की आवश्यकताएँ पेस्ट करें...',
    loadBenchmarkOpp: 'बेंचमार्क अवसर लोड करें (समर इंटर्न)',

    checklistTitle: '2. पार्स की गई चेकलिस्ट',
    checklistDescription: '{count} संरचित मानदंड निकाले गए। ठीक करें, जोड़ें या हटाएँ।',
    addButton: '+ जोड़ें',
    parseWarnings: '⚠ पार्स चेतावनियाँ ({count}):',
    addManually: 'आवश्यकता मैन्युअली जोड़ें',

    addNewRequirement: 'नई आवश्यकता जोड़ें',
    requirementLabel: 'आवश्यकता लेबल',
    requirementLabelPlaceholder: 'उदा. कम से कम 1 IoT प्रोजेक्ट',
    kindLabel: 'प्रकार',
    valueLabel: 'मान',
    valuePlaceholder: 'उदा. 7.5 या HTML, CSS',
    sourceSentenceLabel: 'स्रोत वाक्य (वैकल्पिक)',
    sourceSentencePlaceholder: 'मूल अवसर से वाक्य',
    mandatoryCriterion: 'अनिवार्य मानदंड',
    addToChecklist: 'चेकलिस्ट में जोड़ें',
    sourcePrefix: 'स्रोत: ',
    manuallyAdded: 'मैन्युअली जोड़ी गई आवश्यकता',

    kind: {
      yearOfStudy: 'अध्ययन वर्ष',
      cgpaCutoff: 'CGPA / कट-ऑफ़',
      technicalSkills: 'तकनीकी कौशल',
      document: 'दस्तावेज़',
      link: 'लिंक',
      availability: 'उपलब्धता',
      projectCount: 'प्रोजेक्ट संख्या',
      projectTag: 'प्रोजेक्ट टैग',
      deadline: 'समय-सीमा',
      custom: 'कस्टम'
    },
    kindShort: {
      year: 'वर्ष',
      cgpa: 'cgpa',
      skills: 'कौशल',
      document: 'दस्तावेज़',
      link: 'लिंक',
      availability: 'उपलब्धता',
      projectCount: 'प्रोजेक्ट संख्या',
      projectTag: 'प्रोजेक्ट टैग',
      deadline: 'समय-सीमा',
      custom: 'कस्टम'
    },

    labelLabel: 'लेबल',
    editRequirementTitle: 'इस आवश्यकता को संपादित करें',
    deleteRequirementTitle: 'आवश्यकता हटाएँ',
    asks: 'माँग: ',

    compareWithProfile: 'मेरी प्रोफ़ाइल से तुलना करें →',
    runningAgents: '6 AI एजेंट्स चल रहे हैं...',
    runAgents: '⚡ AI एजेंट्स चलाएँ (लाइव सत्यापन और खोज)',

    liveAgentActivity: 'लाइव एजेंट गतिविधि',
    liveAgentDescription:
      'सादे TypeScript ऑर्केस्ट्रेटर द्वारा समन्वित 6 विशेष एजेंट्स की रीयल-टाइम निष्पादन स्थिति।',
    agentsRunning: 'एजेंट्स चल रहे हैं...',
    triggerAgentRun: 'एजेंट रन शुरू करें',

    safetyRulePrefix: 'सुरक्षा और शासन नियम: ',
    safetyRuleBody:
      'एजेंट्स केवल क्रेडेंशियल सुझाते और शोधते हैं। वे आपकी ओर से कभी कहीं आवेदन नहीं करते और पात्रता का फैसला कभी नहीं करते।',

    compareNoRequirements:
      'तुलना करने से पहले कृपया कोई अवसर पेस्ट करें या कम से कम एक आवश्यकता जोड़ें।'
  }
};

const mr: Dictionary = {
  check: {
    tag: 'पायरी 1 • पेस्ट आणि ऑडिट',
    title: 'संधी तपासा',
    subtitle:
      'कोणतीही इंटर्नशिप, शिष्यवृत्ती किंवा हॅकाथॉन यादी पेस्ट करा. आमचे पारदर्शक नियम-आधारित इंजिन आवश्यकता एका संपादनयोग्य चेकलिस्टमध्ये रूपांतरित करते.',

    dismiss: 'बंद करा',
    noticeLoadedSample: 'नमुना लोड केला: "{title}"',
    noticeLoadedProfile: 'बेंचमार्क विद्यार्थी प्रोफाइल लोड केले (Alex Sharma).',
    noticeAgentsDone:
      'एजंट्सनी {seconds} सेकंदात विश्लेषण पूर्ण केले. खालील सूचना इनबॉक्स पहा.',
    noticeAcceptedSuggestion: 'स्वीकारले: "{title}" आणि तुमच्या प्रोफाइलमध्ये जतन केले.',

    wakingUp: 'एजंट्सना जागवत आहे...',
    wakingDetail: 'क्लाउड एजंट वर्कर्सशी कनेक्ट होत आहे (8s कोल्ड स्टार्ट टाइमआउट)',
    renderFreeTier: 'Render फ्री टियर इन्स्टन्स',

    offlineMode: 'ऑफलाइन मोड',
    offlineRunning: 'ऑफलाइन मोडमध्ये चालू आहे',
    offlineDetail: '— ब्राउझरमधील नियम इंजिन आणि कॅशे केलेले बेंचमार्क एजंट मॉडेल वापरत आहे.',
    retryConnection: 'कनेक्शन पुन्हा प्रयत्न करा',

    missingProfileMessage:
      'तुम्ही अजून तुमचे मास्टर प्रोफाइल तयार केलेले नाही. तुमच्या शैक्षणिक पात्रतेविरुद्ध आवश्यकता तपासण्यासाठी, एकदा तुमचे प्रोफाइल तयार करा किंवा आमचे बेंचमार्क विद्यार्थी प्रोफाइल लोड करा.',
    loadBenchmarkProfile: 'बेंचमार्क प्रोफाइल लोड करा (Alex Sharma)',

    cardDescriptionTitle: '1. संधीचे वर्णन',
    cardDescriptionBody: 'जॉब बोर्ड, माहितीपत्रक किंवा पोर्टलवरून मजकूर पेस्ट करा.',
    loadSampleOpportunity: 'नमुना संधी लोड करा',
    clear: 'साफ करा',

    testOtherScenarios: 'किंवा इतर बेंचमार्क परिस्थिती वापरून पहा:',
    sampleStem: 'STEM शिष्यवृत्ती (उत्पन्न आणि गुण)',
    sampleHackathon: 'राष्ट्रीय हॅकाथॉन (संघ आणि अंतिम मुदत)',
    sampleIoT: 'IoT इंटर्नशिप (IoT प्रकल्प आणि LinkedIn)',

    opportunityType: 'संधीचा प्रकार',
    autoDetect: 'डीफॉल्टनुसार स्वयं-ओळख ({type})',
    typeInternship: 'इंटर्नशिप',
    typeScholarship: 'शिष्यवृत्ती',
    typeCompetitionHackathon: 'स्पर्धा / हॅकाथॉन',
    typeCustomOther: 'सानुकूल / इतर',
    opportunityTitleLabel: 'संधीचे शीर्षक (पर्यायी)',
    opportunityTitlePlaceholder: 'उदा. उन्हाळी इंजिनिअरिंग इंटर्न',

    listingTextLabel: 'संधीची यादी मजकूर',
    listingTextPlaceholder: 'येथे इंटर्नशिप, शिष्यवृत्ती किंवा हॅकाथॉनच्या आवश्यकता पेस्ट करा...',
    loadBenchmarkOpp: 'बेंचमार्क संधी लोड करा (उन्हाळी इंटर्न)',

    checklistTitle: '2. पार्स केलेली चेकलिस्ट',
    checklistDescription: '{count} संरचित निकष काढले. दुरुस्त करा, जोडा किंवा हटवा.',
    addButton: '+ जोडा',
    parseWarnings: '⚠ पार्स इशारे ({count}):',
    addManually: 'आवश्यकता स्वतःहून जोडा',

    addNewRequirement: 'नवीन आवश्यकता जोडा',
    requirementLabel: 'आवश्यकता लेबल',
    requirementLabelPlaceholder: 'उदा. किमान 1 IoT प्रकल्प',
    kindLabel: 'प्रकार',
    valueLabel: 'मूल्य',
    valuePlaceholder: 'उदा. 7.5 किंवा HTML, CSS',
    sourceSentenceLabel: 'स्रोत वाक्य (पर्यायी)',
    sourceSentencePlaceholder: 'मूळ संधीतील वाक्य',
    mandatoryCriterion: 'अनिवार्य निकष',
    addToChecklist: 'चेकलिस्टमध्ये जोडा',
    sourcePrefix: 'स्रोत: ',
    manuallyAdded: 'स्वतःहून जोडलेली आवश्यकता',

    kind: {
      yearOfStudy: 'अभ्यास वर्ष',
      cgpaCutoff: 'CGPA / कट-ऑफ',
      technicalSkills: 'तांत्रिक कौशल्ये',
      document: 'दस्तऐवज',
      link: 'लिंक',
      availability: 'उपलब्धता',
      projectCount: 'प्रकल्प संख्या',
      projectTag: 'प्रकल्प टॅग',
      deadline: 'अंतिम मुदत',
      custom: 'सानुकूल'
    },
    kindShort: {
      year: 'वर्ष',
      cgpa: 'cgpa',
      skills: 'कौशल्ये',
      document: 'दस्तऐवज',
      link: 'लिंक',
      availability: 'उपलब्धता',
      projectCount: 'प्रकल्प संख्या',
      projectTag: 'प्रकल्प टॅग',
      deadline: 'अंतिम मुदत',
      custom: 'सानुकूल'
    },

    labelLabel: 'लेबल',
    editRequirementTitle: 'ही आवश्यकता संपादित करा',
    deleteRequirementTitle: 'आवश्यकता हटवा',
    asks: 'मागणी: ',

    compareWithProfile: 'माझ्या प्रोफाइलशी तुलना करा →',
    runningAgents: '6 AI एजंट्स चालू आहेत...',
    runAgents: '⚡ AI एजंट्स चालवा (थेट पडताळणी आणि शोध)',

    liveAgentActivity: 'थेट एजंट क्रियाकलाप',
    liveAgentDescription:
      'साध्या TypeScript ऑर्केस्ट्रेटरद्वारे समन्वित 6 विशेष एजंट्सची रिअल-टाइम अंमलबजावणी स्थिती.',
    agentsRunning: 'एजंट्स चालू आहेत...',
    triggerAgentRun: 'एजंट रन सुरू करा',

    safetyRulePrefix: 'सुरक्षा आणि कारभार नियम: ',
    safetyRuleBody:
      'एजंट्स केवळ क्रेडेन्शियल्स सुचवतात आणि संशोधन करतात. ते तुमच्या वतीने कधीही कुठेही अर्ज करत नाहीत आणि पात्रतेचा निर्णय कधीच घेत नाहीत.',

    compareNoRequirements:
      'तुलना करण्यापूर्वी कृपया एखादी संधी पेस्ट करा किंवा किमान एक आवश्यकता जोडा.'
  }
};

const module_ = { en, hi, mr };
export default module_;

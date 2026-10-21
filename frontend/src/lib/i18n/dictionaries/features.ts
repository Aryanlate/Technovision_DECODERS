import type { Dictionary } from '../types';

/**
 * Dictionary module for the business-feature surfaces:
 *   - `drive`          partner-published checklists (/drive/new, /drive/[id], /college)
 *   - `sustainability` the "How we stay sustainable" cost model on /pricing
 *   - `nudge`          the non-blocking Premium upgrade hints
 *
 * Each namespace is owned by this module and merged over the shared dictionary.
 */
const en: Dictionary = {
  drive: {
    // ---- Publisher form (/drive/new) ----
    newTag: 'PARTNER CHECKLIST PUBLISHER',
    newTitle: 'PUBLISH A DRIVE CHECKLIST',
    newSubtitle:
      'A company or a placement cell enters the requirements and the deadline once, then shares a single link. Students open it and compare it with their own profile in one click.',
    formNotice:
      'Only the checklist you type here is stored. No student data is attached to a published drive.',
    fieldPartnerName: 'Company or placement cell',
    fieldPartnerNamePlaceholder: 'e.g. Nalanda Institute of Technology — Training & Placement Cell',
    fieldPartnerType: 'Who is publishing',
    typeCompany: 'Company / recruiter',
    typePlacementCell: 'College placement cell',
    typeOther: 'Other',
    fieldTitle: 'Drive title',
    fieldTitlePlaceholder: 'e.g. Backend Engineering Internship Drive 2026',
    fieldLocation: 'Location',
    fieldLocationPlaceholder: 'e.g. Pune (hybrid)',
    fieldDeadline: 'Application deadline',
    fieldApplyUrl: 'Official application link',
    fieldApplyUrlPlaceholder: 'https://…',
    fieldNotes: 'Notes for students',
    fieldNotesPlaceholder: 'Anything a student should know before applying.',

    reqHeading: 'Structured checklist',
    reqHint:
      'Only the fields you fill in become requirements. Anything left blank is simply not checked.',
    reqYears: 'Allowed year(s) of study',
    reqMinCgpa: 'Minimum CGPA',
    reqSkills: 'Mandatory skills (comma separated)',
    reqSkillsPlaceholder: 'e.g. Python, SQL, Docker',
    reqResume: 'Verified resume required',
    reqLink: 'GitHub or portfolio link required',
    reqAvailability: 'Minimum availability (weeks)',

    publish: 'Publish checklist & get link',
    publishing: 'Publishing…',
    fixErrors: 'Please fix the following before publishing:',
    previewHeading: 'What students will see',
    previewEmpty: 'Add a requirement above to preview the checklist.',

    publishedTag: 'CHECKLIST PUBLISHED',
    publishedBody:
      'Share this link. Anyone who opens it sees the checklist and can compare it with their own profile.',
    copyLink: 'Copy link',
    copied: 'Link copied',
    openStudentView: 'Open the student view →',
    publishAnother: 'Publish another checklist',
    backToCollege: '← Back to the college dashboard',
    featureOff: 'Partner-published checklists are switched off right now.',

    // ---- Student view (/drive/[id]) ----
    studentTag: 'PARTNER CHECKLIST • READ ONLY',
    publishedBy: 'Published by {partner}',
    requirementCount: '{count} requirements',
    deadlineLabel: 'DEADLINE',
    applyLink: 'Official application link',
    notesLabel: 'Notes from the organiser',
    checklistHeading: 'What this drive asks for',
    noRequirements: 'This checklist has no requirements recorded.',
    compare: 'Compare with my profile in one click',
    comparing: 'Comparing…',
    resultHeading: 'Your result',
    needProfile:
      'You have not saved a profile yet. Build one first so the comparison has something to check against.',
    buildProfile: 'Build your profile →',
    missing: 'This drive link is unknown or has been withdrawn.',
    missingCta: 'Run your own check →',
    readOnlyNote:
      'Statuses come from the same transparent rule engine used everywhere else. “Missing info” is never treated as a failure.'
  },

  sustainability: {
    tag: 'BUSINESS MODEL',
    title: 'HOW WE STAY SUSTAINABLE',
    subtitle:
      'What one check costs us to run, and how many Premium students cover the fixed bill. Everything below is an assumption, not a measurement — the working is shown so you can disagree with it.',

    assumptionsHeading: 'The assumptions we use',
    a1: 'Average cost of one AI provider call',
    a2: 'AI calls in a check that uses AI',
    a3: 'Share of checks that use no AI at all',
    a4: 'Free plan limit',
    a5: 'Assumed checks per student per month',
    a6: 'Fixed monthly running cost',
    a7: 'Hosting cost per student per month',
    a8: 'Premium price per student per month',
    a9: 'Assumed number of free students',

    vPerCall: 'Rs {value} per call',
    vCalls: '{value} calls',
    vShare: '{value}% of checks',
    vPerMonth: 'Rs {value} / month',
    vChecks: '{value} checks / month',
    vStudents: '{value} students',

    computedHeading: 'What that works out to',
    avgCostPerCheck: 'Average cost per check',
    avgCostPerCheckBody:
      'Most checks are answered by the rule engine inside the browser and never call a paid model. Only {aiShare}% of checks use AI, so the average cost per check is about {cost}.',
    monthlyCost: 'Monthly cost per student',
    monthlyCostBody:
      'About {checks} checks a month plus hosting comes to roughly {cost} per student.',
    breakEven: 'Break-even Premium students',
    breakEvenBody:
      'With {free} free students, the fixed bill plus the free tier adds up to about {cost} a month. Each Premium student contributes about {margin}, so roughly {students} Premium students cover it.',
    breakEvenUnreachable:
      'With these assumptions the Premium price does not cover the running cost, so break-even is never reached. Raise the price assumption or lower the AI cost.',
    formulaNote:
      'Average cost per check = share of AI checks × AI calls per check × cost per AI call.',
    disclaimer:
      'These are planning assumptions for a hackathon prototype, not audited financials. Real provider prices, usage and hosting bills will differ.',
    exampleHeading: 'Worked example',
    exampleBody: 'With the numbers above, one check costs about {cost} and break-even is {students} Premium students.'
  },

  nudge: {
    regionLabel: 'Premium upgrade hint',
    premiumTag: 'PREMIUM',
    dismiss: 'Not now',
    seePlans: 'See Premium →',
    gapTitle: 'Nice — that gap is closed.',
    gapBody:
      'Your result above is unchanged and stays on screen. Student Premium would also add {feature}.',
    gapFeature: 'deep GitHub repository verification, with unlimited re-checks of this opportunity',
    limitTitle: 'You have used all {limit} free checks this month.',
    limitBody:
      'Everything you have already seen stays on screen and can be exported. Student Premium adds {feature}.',
    limitFeature: 'unlimited opportunity checks, web research and employer scam screening'
  },

  college: {
    exportReportPdf: 'Export report as PDF',
    publishedTag: 'PARTNER-PUBLISHED DRIVES',
    publishedTitle: 'READY FOR A PUBLISHED DRIVE',
    publishedBody:
      'A company or placement cell has published a checklist. Pick it to see how many students in this batch are already ready, and share the link with students.',
    selectDrive: 'Published drive',
    noDrives: 'No partner drive has been published yet.',
    createDrive: 'Publish a drive checklist →',
    readyCount: '{count} ready',
    almostReadyCount: '{count} almost ready',
    notReadyCount: '{count} not ready',
    openStudentView: 'Open student view ↗'
  }
};

const hi: Dictionary = {
  drive: {
    newTag: 'पार्टनर चेकलिस्ट प्रकाशक',
    newTitle: 'ड्राइव चेकलिस्ट प्रकाशित करें',
    newSubtitle:
      'कोई कंपनी या प्लेसमेंट सेल एक बार आवश्यकताएँ और अंतिम तिथि भरता है, फिर एक ही लिंक साझा करता है। छात्र उसे खोलकर एक क्लिक में अपनी प्रोफ़ाइल से तुलना करते हैं।',
    formNotice:
      'यहाँ भरी गई चेकलिस्ट ही संग्रहित होती है। प्रकाशित ड्राइव के साथ कोई छात्र डेटा नहीं जुड़ता।',
    fieldPartnerName: 'कंपनी या प्लेसमेंट सेल',
    fieldPartnerNamePlaceholder: 'जैसे नलंदा इंस्टीट्यूट ऑफ़ टेक्नोलॉजी — ट्रेनिंग और प्लेसमेंट सेल',
    fieldPartnerType: 'कौन प्रकाशित कर रहा है',
    typeCompany: 'कंपनी / भर्तीकर्ता',
    typePlacementCell: 'कॉलेज प्लेसमेंट सेल',
    typeOther: 'अन्य',
    fieldTitle: 'ड्राइव का शीर्षक',
    fieldTitlePlaceholder: 'जैसे बैकएंड इंजीनियरिंग इंटर्नशिप ड्राइव 2026',
    fieldLocation: 'स्थान',
    fieldLocationPlaceholder: 'जैसे पुणे (हाइब्रिड)',
    fieldDeadline: 'आवेदन की अंतिम तिथि',
    fieldApplyUrl: 'आधिकारिक आवेदन लिंक',
    fieldApplyUrlPlaceholder: 'https://…',
    fieldNotes: 'छात्रों के लिए निर्देश',
    fieldNotesPlaceholder: 'आवेदन से पहले छात्र को जो जानना चाहिए।',

    reqHeading: 'संरचित चेकलिस्ट',
    reqHint: 'आप जो भी फ़ील्ड भरेंगे वही आवश्यकता बनेगी। खाली छोड़ी गई चीज़ जाँची नहीं जाएगी।',
    reqYears: 'अनुमत अध्ययन वर्ष',
    reqMinCgpa: 'न्यूनतम CGPA',
    reqSkills: 'अनिवार्य कौशल (अल्पविराम से अलग)',
    reqSkillsPlaceholder: 'जैसे Python, SQL, Docker',
    reqResume: 'सत्यापित रिज़्यूमे आवश्यक',
    reqLink: 'GitHub या पोर्टफ़ोलियो लिंक आवश्यक',
    reqAvailability: 'न्यूनतम उपलब्धता (सप्ताह)',

    publish: 'चेकलिस्ट प्रकाशित करें और लिंक पाएँ',
    publishing: 'प्रकाशित हो रहा है…',
    fixErrors: 'प्रकाशित करने से पहले ये ठीक करें:',
    previewHeading: 'छात्रों को क्या दिखेगा',
    previewEmpty: 'चेकलिस्ट देखने के लिए ऊपर कोई आवश्यकता जोड़ें।',

    publishedTag: 'चेकलिस्ट प्रकाशित',
    publishedBody:
      'यह लिंक साझा करें। इसे खोलने वाला कोई भी व्यक्ति चेकलिस्ट देख सकता है और अपनी प्रोफ़ाइल से तुलना कर सकता है।',
    copyLink: 'लिंक कॉपी करें',
    copied: 'लिंक कॉपी हो गया',
    openStudentView: 'छात्र दृश्य खोलें →',
    publishAnother: 'एक और चेकलिस्ट प्रकाशित करें',
    backToCollege: '← कॉलेज डैशबोर्ड पर वापस जाएँ',
    featureOff: 'पार्टनर-प्रकाशित चेकलिस्ट अभी बंद हैं।',

    studentTag: 'पार्टनर चेकलिस्ट • केवल पढ़ने के लिए',
    publishedBy: '{partner} द्वारा प्रकाशित',
    requirementCount: '{count} आवश्यकताएँ',
    deadlineLabel: 'अंतिम तिथि',
    applyLink: 'आधिकारिक आवेदन लिंक',
    notesLabel: 'आयोजक के निर्देश',
    checklistHeading: 'यह ड्राइव क्या माँगती है',
    noRequirements: 'इस चेकलिस्ट में कोई आवश्यकता दर्ज नहीं है।',
    compare: 'एक क्लिक में मेरी प्रोफ़ाइल से तुलना करें',
    comparing: 'तुलना हो रही है…',
    resultHeading: 'आपका परिणाम',
    needProfile:
      'आपने अभी तक प्रोफ़ाइल सहेजी नहीं है। पहले प्रोफ़ाइल बनाएँ ताकि तुलना के लिए कुछ हो।',
    buildProfile: 'अपनी प्रोफ़ाइल बनाएँ →',
    missing: 'यह ड्राइव लिंक अज्ञात है या हटा दिया गया है।',
    missingCta: 'स्वयं जाँच चलाएँ →',
    readOnlyNote:
      'स्थितियाँ हर जगह उपयोग होने वाले उसी पारदर्शी नियम इंजन से आती हैं। “जानकारी शेष” को कभी विफलता नहीं माना जाता।'
  },

  sustainability: {
    tag: 'व्यवसाय मॉडल',
    title: 'हम टिकाऊ कैसे रहते हैं',
    subtitle:
      'एक जाँच चलाने में हमें कितना खर्च आता है, और कितने Premium छात्र तय बिल कवर करते हैं। नीचे दी गई हर संख्या एक अनुमान है, मापा हुआ आँकड़ा नहीं — गणना दिखाई गई है ताकि आप उससे असहमत हो सकें।',

    assumptionsHeading: 'हम जो अनुमान लगाते हैं',
    a1: 'एक AI कॉल की औसत लागत',
    a2: 'AI वाली जाँच में AI कॉल की संख्या',
    a3: 'बिना AI वाली जाँचों का हिस्सा',
    a4: 'मुफ़्त योजना की सीमा',
    a5: 'प्रति छात्र प्रति माह अनुमानित जाँचें',
    a6: 'तय मासिक संचालन लागत',
    a7: 'प्रति छात्र प्रति माह होस्टिंग लागत',
    a8: 'प्रति छात्र प्रति माह Premium मूल्य',
    a9: 'अनुमानित मुफ़्त छात्र',

    vPerCall: 'प्रति कॉल Rs {value}',
    vCalls: '{value} कॉल',
    vShare: 'जाँचों का {value}%',
    vPerMonth: 'Rs {value} / माह',
    vChecks: '{value} जाँचें / माह',
    vStudents: '{value} छात्र',

    computedHeading: 'इससे क्या निकलता है',
    avgCostPerCheck: 'प्रति जाँच औसत लागत',
    avgCostPerCheckBody:
      'अधिकांश जाँचें ब्राउज़र में नियम इंजन से पूरी होती हैं और किसी सशुल्क मॉडल को कॉल नहीं करतीं। केवल {aiShare}% जाँचें AI का उपयोग करती हैं, इसलिए प्रति जाँच औसत लागत लगभग {cost} है।',
    monthlyCost: 'प्रति छात्र मासिक लागत',
    monthlyCostBody:
      'महीने में लगभग {checks} जाँचें और होस्टिंग मिलाकर प्रति छात्र करीब {cost} बैठता है।',
    breakEven: 'ब्रेक-ईवन Premium छात्र',
    breakEvenBody:
      '{free} मुफ़्त छात्रों के साथ, तय बिल और मुफ़्त श्रेणी मिलाकर महीने का लगभग {cost} बनता है। हर Premium छात्र करीब {margin} देता है, इसलिए लगभग {students} Premium छात्र इसे कवर कर लेते हैं।',
    breakEvenUnreachable:
      'इन अनुमानों के साथ Premium मूल्य संचालन लागत नहीं कवर करता, इसलिए ब्रेक-ईवन कभी नहीं होता। मूल्य अनुमान बढ़ाएँ या AI लागत घटाएँ।',
    formulaNote: 'प्रति जाँच औसत लागत = AI जाँचों का हिस्सा × प्रति जाँच AI कॉल × प्रति AI कॉल लागत।',
    disclaimer:
      'ये हैकाथॉन प्रोटोटाइप के लिए योजना-संबंधी अनुमान हैं, ऑडिट किए गए वित्तीय आँकड़े नहीं। असली प्रदाता दरें, उपयोग और होस्टिंग बिल अलग होंगे।',
    exampleHeading: 'उदाहरण',
    exampleBody: 'ऊपर के आँकड़ों के साथ एक जाँच की लागत लगभग {cost} है और ब्रेक-ईवन {students} Premium छात्रों पर होता है।'
  },

  nudge: {
    regionLabel: 'Premium अपग्रेड संकेत',
    premiumTag: 'PREMIUM',
    dismiss: 'अभी नहीं',
    seePlans: 'Premium देखें →',
    gapTitle: 'बढ़िया — वह कमी पूरी हो गई।',
    gapBody:
      'ऊपर दिखाया गया परिणाम वैसा ही है और स्क्रीन पर बना रहेगा। Student Premium इसके साथ {feature} भी देता है।',
    gapFeature: 'गहन GitHub रिपॉज़िटरी सत्यापन, और इस अवसर की असीमित पुनः-जाँच',
    limitTitle: 'आपने इस माह की सभी {limit} मुफ़्त जाँचें उपयोग कर लीं।',
    limitBody:
      'आपने जो देखा है वह स्क्रीन पर बना रहता है और निर्यात किया जा सकता है। Student Premium {feature} जोड़ता है।',
    limitFeature: 'असीमित अवसर जाँचें, वेब शोध और नियोक्ता धोखाधड़ी स्क्रीनिंग'
  },

  college: {
    exportReportPdf: 'रिपोर्ट PDF के रूप में निर्यात करें',
    publishedTag: 'पार्टनर-प्रकाशित ड्राइव',
    publishedTitle: 'प्रकाशित ड्राइव के लिए तैयार',
    publishedBody:
      'किसी कंपनी या प्लेसमेंट सेल ने चेकलिस्ट प्रकाशित की है। उसे चुनें और देखें कि इस बैच के कितने छात्र पहले से तैयार हैं, तथा लिंक छात्रों के साथ साझा करें।',
    selectDrive: 'प्रकाशित ड्राइव',
    noDrives: 'अभी तक कोई पार्टनर ड्राइव प्रकाशित नहीं हुई है।',
    createDrive: 'ड्राइव चेकलिस्ट प्रकाशित करें →',
    readyCount: '{count} तैयार',
    almostReadyCount: '{count} लगभग तैयार',
    notReadyCount: '{count} तैयार नहीं',
    openStudentView: 'छात्र दृश्य खोलें ↗'
  }
};

const mr: Dictionary = {
  drive: {
    newTag: 'पार्टनर चेकलिस्ट प्रकाशक',
    newTitle: 'ड्राइव्ह चेकलिस्ट प्रकाशित करा',
    newSubtitle:
      'एखादी कंपनी किंवा प्लेसमेंट सेल एकदाच आवश्यकता आणि अंतिम तारीख भरते, नंतर एकच दुवा सामायिक करते. विद्यार्थी तो उघडतात आणि एका क्लिकमध्ये स्वतःच्या प्रोफाइलशी तुलना करतात.',
    formNotice:
      'येथे भरलेली चेकलिस्टच साठवली जाते. प्रकाशित ड्राइव्हसोबत विद्यार्थ्याचा कोणताही डेटा जोडला जात नाही.',
    fieldPartnerName: 'कंपनी किंवा प्लेसमेंट सेल',
    fieldPartnerNamePlaceholder: 'उदा. नलंदा इन्स्टिट्यूट ऑफ टेक्नॉलॉजी — प्रशिक्षण व प्लेसमेंट सेल',
    fieldPartnerType: 'कोण प्रकाशित करत आहे',
    typeCompany: 'कंपनी / भर्तीकर्ता',
    typePlacementCell: 'कॉलेज प्लेसमेंट सेल',
    typeOther: 'इतर',
    fieldTitle: 'ड्राइव्हचे शीर्षक',
    fieldTitlePlaceholder: 'उदा. बॅकएंड इंजिनिअरिंग इंटर्नशिप ड्राइव्ह 2026',
    fieldLocation: 'ठिकाण',
    fieldLocationPlaceholder: 'उदा. पुणे (हायब्रिड)',
    fieldDeadline: 'अर्जाची अंतिम तारीख',
    fieldApplyUrl: 'अधिकृत अर्ज दुवा',
    fieldApplyUrlPlaceholder: 'https://…',
    fieldNotes: 'विद्यार्थ्यांसाठी सूचना',
    fieldNotesPlaceholder: 'अर्ज करण्यापूर्वी विद्यार्थ्याला जे माहीत असावे.',

    reqHeading: 'संरचित चेकलिस्ट',
    reqHint: 'तुम्ही भरलेली फील्डच आवश्यकता बनतात. रिकामी सोडलेली गोष्ट तपासली जात नाही.',
    reqYears: 'मान्य अभ्यास वर्षे',
    reqMinCgpa: 'किमान CGPA',
    reqSkills: 'अनिवार्य कौशल्ये (स्वल्पविरामाने)',
    reqSkillsPlaceholder: 'उदा. Python, SQL, Docker',
    reqResume: 'सत्यापित रेझ्युमे आवश्यक',
    reqLink: 'GitHub किंवा पोर्टफोलिओ दुवा आवश्यक',
    reqAvailability: 'किमान उपलब्धता (आठवडे)',

    publish: 'चेकलिस्ट प्रकाशित करा आणि दुवा मिळवा',
    publishing: 'प्रकाशित होत आहे…',
    fixErrors: 'प्रकाशित करण्यापूर्वी हे दुरुस्त करा:',
    previewHeading: 'विद्यार्थ्यांना काय दिसेल',
    previewEmpty: 'चेकलिस्ट पाहण्यासाठी वर एक आवश्यकता जोडा.',

    publishedTag: 'चेकलिस्ट प्रकाशित',
    publishedBody:
      'हा दुवा सामायिक करा. तो उघडणारा कोणीही चेकलिस्ट पाहू शकतो आणि स्वतःच्या प्रोफाइलशी तुलना करू शकतो.',
    copyLink: 'दुवा कॉपी करा',
    copied: 'दुवा कॉपी झाला',
    openStudentView: 'विद्यार्थी दृश्य उघडा →',
    publishAnother: 'आणखी एक चेकलिस्ट प्रकाशित करा',
    backToCollege: '← कॉलेज डॅशबोर्डवर परत जा',
    featureOff: 'पार्टनर-प्रकाशित चेकलिस्ट सध्या बंद आहेत.',

    studentTag: 'पार्टनर चेकलिस्ट • फक्त वाचण्यासाठी',
    publishedBy: '{partner} ने प्रकाशित',
    requirementCount: '{count} आवश्यकता',
    deadlineLabel: 'अंतिम तारीख',
    applyLink: 'अधिकृत अर्ज दुवा',
    notesLabel: 'आयोजकाच्या सूचना',
    checklistHeading: 'हा ड्राइव्ह काय मागतो',
    noRequirements: 'या चेकलिस्टमध्ये कोणतीही आवश्यकता नोंदलेली नाही.',
    compare: 'एका क्लिकमध्ये माझ्या प्रोफाइलशी तुलना करा',
    comparing: 'तुलना सुरू आहे…',
    resultHeading: 'तुमचा निकाल',
    needProfile:
      'तुम्ही अजून प्रोफाइल जतन केलेले नाही. आधी प्रोफाइल तयार करा म्हणजे तुलना करता येईल.',
    buildProfile: 'तुमचे प्रोफाइल तयार करा →',
    missing: 'हा ड्राइव्ह दुवा अज्ञात आहे किंवा काढून टाकला आहे.',
    missingCta: 'स्वतः तपासणी चालवा →',
    readOnlyNote:
      'स्थिती सर्वत्र वापरल्या जाणाऱ्या त्याच पारदर्शक नियम इंजिनमधून येतात. “माहिती शिल्लक” कधीही अपयश मानले जात नाही.'
  },

  sustainability: {
    tag: 'व्यवसाय मॉडेल',
    title: 'आम्ही टिकाऊ कसे राहतो',
    subtitle:
      'एक तपासणी चालवण्यास आम्हाला किती खर्च येतो, आणि किती Premium विद्यार्थी निश्चित बिल भरून काढतात. खालील प्रत्येक आकडा हा अंदाज आहे, मोजलेला आकडा नाही — गणित दाखवले आहे जेणेकरून तुम्ही त्याला आव्हान देऊ शकता.',

    assumptionsHeading: 'आम्ही वापरलेले अंदाज',
    a1: 'एका AI कॉलचा सरासरी खर्च',
    a2: 'AI वापरणाऱ्या तपासणीतील AI कॉल',
    a3: 'AI न वापरणाऱ्या तपासण्यांचा वाटा',
    a4: 'विनामूल्य योजनेची मर्यादा',
    a5: 'प्रति विद्यार्थी प्रति महिना अंदाजित तपासण्या',
    a6: 'निश्चित मासिक चालू खर्च',
    a7: 'प्रति विद्यार्थी प्रति महिना होस्टिंग खर्च',
    a8: 'प्रति विद्यार्थी प्रति महिना Premium किंमत',
    a9: 'अंदाजित विनामूल्य विद्यार्थी',

    vPerCall: 'प्रति कॉल Rs {value}',
    vCalls: '{value} कॉल',
    vShare: 'तपासण्यांच्या {value}%',
    vPerMonth: 'Rs {value} / महिना',
    vChecks: '{value} तपासण्या / महिना',
    vStudents: '{value} विद्यार्थी',

    computedHeading: 'यातून काय निघते',
    avgCostPerCheck: 'प्रति तपासणी सरासरी खर्च',
    avgCostPerCheckBody:
      'बहुतेक तपासण्या ब्राउझरमधील नियम इंजिन पूर्ण करते आणि कोणत्याही सशुल्क मॉडेलला कॉल करत नाही. फक्त {aiShare}% तपासण्या AI वापरतात, त्यामुळे प्रति तपासणी सरासरी खर्च सुमारे {cost} आहे.',
    monthlyCost: 'प्रति विद्यार्थी मासिक खर्च',
    monthlyCostBody:
      'महिन्याला सुमारे {checks} तपासण्या आणि होस्टिंग मिळून प्रति विद्यार्थी जवळपास {cost} होतो.',
    breakEven: 'ब्रेक-ईव्हन Premium विद्यार्थी',
    breakEvenBody:
      '{free} विनामूल्य विद्यार्थ्यांसह, निश्चित बिल आणि विनामूल्य श्रेणी मिळून महिन्याला सुमारे {cost} होते. प्रत्येक Premium विद्यार्थी सुमारे {margin} देतो, त्यामुळे जवळपास {students} Premium विद्यार्थी ते भरून काढतात.',
    breakEvenUnreachable:
      'या अंदाजांसह Premium किंमत चालू खर्च भरून काढत नाही, त्यामुळे ब्रेक-ईव्हन कधीच गाठले जात नाही. किंमतीचा अंदाज वाढवा किंवा AI खर्च कमी करा.',
    formulaNote: 'प्रति तपासणी सरासरी खर्च = AI तपासण्यांचा वाटा × प्रति तपासणी AI कॉल × प्रति AI कॉल खर्च.',
    disclaimer:
      'हे हॅकाथॉन प्रोटोटाइपसाठी नियोजन-अंदाज आहेत, ऑडिट केलेले आर्थिक आकडे नाहीत. प्रत्यक्ष प्रदाता दर, वापर आणि होस्टिंग बिल वेगळे असतील.',
    exampleHeading: 'उदाहरण',
    exampleBody: 'वरील आकड्यांसह एका तपासणीचा खर्च सुमारे {cost} आहे आणि ब्रेक-ईव्हन {students} Premium विद्यार्थ्यांवर होते.'
  },

  nudge: {
    regionLabel: 'Premium अपग्रेड सूचना',
    premiumTag: 'PREMIUM',
    dismiss: 'आत्ता नको',
    seePlans: 'Premium पहा →',
    gapTitle: 'छान — ती तफावत भरली गेली.',
    gapBody:
      'वर दाखवलेला निकाल तसाच आहे आणि स्क्रीनवर राहतो. Student Premium त्यासोबत {feature} देखील देतो.',
    gapFeature: 'सखोल GitHub रेपॉझिटरी पडताळणी, आणि या संधीच्या अमर्याद पुनर्तपासण्या',
    limitTitle: 'तुम्ही या महिन्याच्या सर्व {limit} विनामूल्य तपासण्या वापरल्या.',
    limitBody:
      'तुम्ही आधीच पाहिलेले सर्व स्क्रीनवर राहते आणि निर्यात करता येते. Student Premium {feature} जोडतो.',
    limitFeature: 'अमर्यादित संधी तपासण्या, वेब संशोधन आणि नियोक्ता फसवणूक तपासणी'
  },

  college: {
    exportReportPdf: 'अहवाल PDF म्हणून निर्यात करा',
    publishedTag: 'पार्टनर-प्रकाशित ड्राइव्ह',
    publishedTitle: 'प्रकाशित ड्राइव्हसाठी तयार',
    publishedBody:
      'एखाद्या कंपनीने किंवा प्लेसमेंट सेलने चेकलिस्ट प्रकाशित केली आहे. ती निवडा आणि या बॅचमधील किती विद्यार्थी आधीच तयार आहेत ते पहा, आणि दुवा विद्यार्थ्यांसोबत सामायिक करा.',
    selectDrive: 'प्रकाशित ड्राइव्ह',
    noDrives: 'अजून कोणतीही पार्टनर ड्राइव्ह प्रकाशित झालेली नाही.',
    createDrive: 'ड्राइव्ह चेकलिस्ट प्रकाशित करा →',
    readyCount: '{count} तयार',
    almostReadyCount: '{count} जवळपास तयार',
    notReadyCount: '{count} तयार नाहीत',
    openStudentView: 'विद्यार्थी दृश्य उघडा ↗'
  }
};

const module_ = { en, hi, mr };
export default module_;

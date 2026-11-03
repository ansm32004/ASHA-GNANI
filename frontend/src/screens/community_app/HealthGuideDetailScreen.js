import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, shadows, spacing } from '../../theme';
import { requestApi } from '../../services/api/requestApi';

const GUIDE_DATA = {
  pregnancy: {
    id: 'pregnancy',
    title: 'गर्भावस्था देखभाल (Pregnancy Care)',
    subtitle: 'स्वस्थ मां और स्वस्थ शिशु के लिए जरूरी दिशानिर्देश',
    accentColor: '#E25858',
    icon: 'heart-circle',
    audioText: 'गर्भावस्था के दौरान कम से कम चार प्रसव पूर्व जांच यानी एएनसी कराना जरूरी है। रोज़ाना एक आयरन की गोली और कैल्शियम की गोली लें। पौष्टिक आहार खाएं। यदि तेज सिरदर्द, आंखों में धुंधलापन या चेहरे पर सूजन हो तो तुरंत आशा दीदी या अस्पताल से संपर्क करें।',
    overview: 'गर्भावस्था एक अत्यंत महत्वपूर्ण समय है। सही पोषण, समय पर जांच और दवाओं के सेवन से मां और बच्चा दोनों सुरक्षित रहते हैं।',
    guidelines: [
      { title: 'कम से कम 4 ANC जांच', desc: 'पहली तिमाही, दूसरी तिमाही (24-28 सप्ताह), 32 सप्ताह और 36 सप्ताह पर अनिवार्य जांच कराएं।' },
      { title: 'आयरन और फोलिक एसिड', desc: '180 दिन तक रोजाना 1 आयरन की गोली (IFA) और 1 कैल्शियम की गोली लें। दोनों गोलियां एक साथ न लें।' },
      { title: 'टीकाकरण (TT / Td)', desc: 'गर्भावस्था में टिटनेस और डिप्थीरिया से बचाव के लिए 2 टीके (Td-1 और Td-2) अवश्य लगवाएं।' },
      { title: 'संस्थागत प्रसव (Hospital Delivery)', desc: 'सुरक्षित प्रसव के लिए हमेशा सरकारी अस्पताल या स्वास्थ्य केंद्र चुनें। एम्बुलेंस के लिए 108 पर कॉल करें।' }
    ],
    dangerSigns: [
      'अत्यधिक सिरदर्द या आंखों में धुंधलापन दिखना',
      'चेहरे, हाथों या पैरों में अचानक तेज सूजन आना',
      'योनि से रक्तस्राव (Bleeding) या पानी का रिसाव',
      'शिशु की हलचल अचानक कम या बंद होना',
      'तेज बुखार या दौरे पड़ना'
    ],
    diet: [
      'हरी पत्तेदार सब्जियां (पालक, मेथी, बथुआ)',
      'दालें, चना, राजमा, सोयाबीन और मूंगफली',
      'दूध, दही, पनीर या अंडा',
      'मौसमी फल, नींबू, संतरा और भरपूर पानी पिएं'
    ],
    schemes: [
      { name: 'प्रधानमंत्री मातृ वंदना योजना (PMMVY)', amount: '₹5,000', desc: 'पहले जीवित बच्चे पर 2 किस्तों में आर्थिक सहायता' },
      { name: 'जननी सुरक्षा योजना (JSY)', amount: '₹1,400', desc: 'ग्रामीण क्षेत्रों में संस्थागत प्रसव कराने पर मां को प्रोत्साहन राशि' }
    ]
  },
  women: {
    id: 'women',
    title: 'महिला स्वास्थ्य (Women’s Health)',
    subtitle: 'मासिक धर्म स्वच्छता, एनीमिया रोकथाम एवं परिवार नियोजन',
    accentColor: '#9C27B0',
    icon: 'rose',
    audioText: 'महिलाएं परिवार की रीढ़ हैं। मासिक धर्म के समय साफ सेनेटरी पैड का प्रयोग करें। एनीमिया से बचाव के लिए पौष्टिक आहार लें। परिवार नियोजन के सुरक्षित साधनों की जानकारी के लिए आशा दीदी से मिलें।',
    overview: 'महिलाओं का स्वास्थ्य पूरे परिवार की खुशहाली की नींव है। मासिक धर्म स्वच्छता, खून की कमी से बचाव और परिवार नियोजन के आधुनिक साधन सभी सरकारी केंद्रों पर निःशुल्क उपलब्ध हैं।',
    guidelines: [
      { title: 'मासिक धर्म स्वच्छता', desc: 'हमेशा साफ सेनेटरी पैड का उपयोग करें। हर 4 से 6 घंटे में पैड बदलें और साबुन से हाथ धोएं।' },
      { title: 'एनीमिया (खून की कमी) नियंत्रण', desc: 'सप्ताह में एक नीली आयरन की गोली (WIFAS) लें। साल में एक बार हीमोग्लोबिन स्तर की जांच कराएं।' },
      { title: 'परिवार नियोजन के साधन', desc: 'अंतरा इंजेक्शन (3 महीने का गर्भनिरोधक), छाया गोलियां और कॉपर-टी आशा दीदी और प्राथमिक स्वास्थ्य केंद्र पर मुफ्त उपलब्ध हैं।' },
      { title: 'कैंसर पूर्व जांच', desc: '30 वर्ष से अधिक उम्र की सभी महिलाओं को गर्भाशय ग्रीवा और स्तन की जांच हर 5 वर्ष में करानी चाहिए।' }
    ],
    dangerSigns: [
      'माहवारी के अलावा योनि से असामान्य रक्तस्राव या दुर्गंधयुक्त स्राव',
      'स्तन में कोई गांठ या दर्द महसूस होना',
      'कमर के निचले हिस्से या पेल्विस में लगातार तेज दर्द',
      'अत्यधिक कमजोरी, चक्कर आना या त्वचा का पीला पड़ना'
    ],
    diet: [
      'गुड़, चना, तिल और मूंगफली (आयरन के बेहतरीन स्रोत)',
      'आंवला, अमरूद और नींबू (विटामिन C जो आयरन सोखने में मदद करता है)',
      'अंकुरित अनाज और सहजन (सहजन की पत्तियां)',
      'चाय और कॉफी भोजन के तुरंत बाद न लें'
    ],
    schemes: [
      { name: 'राष्ट्रीय किशोरी स्वास्थ्य कार्यक्रम (RKSK)', amount: 'मुफ्त सेनेटरी पैड', desc: 'किशोरी दिवस पर मुफ्त सेनेटरी नैपकिन व परामर्श' },
      { name: 'मिशन परिवार विकास (MPV)', amount: 'प्रोत्साहन राशि', desc: 'प्रसव उपरांत परिवार नियोजन अपनाने पर आर्थिक प्रोत्साहन' }
    ]
  },
  child: {
    id: 'child',
    title: 'शिशु स्वास्थ्य (Child Healthcare)',
    subtitle: 'जन्म से 5 वर्ष तक शिशु की सही देखभाल व पोषण',
    accentColor: '#2478D0',
    icon: 'happy',
    audioText: 'जन्म के पहले घंटे में मां का पहला गाढ़ा पीला दूध यानी कोलोस्ट्रम जरूर पिलाएं। 6 महीने तक केवल मां का दूध दें, पानी भी नहीं। 6 महीने पूरे होने पर ऊपरी आहार शुरू करें। बच्चे का वजन हर महीने आंगनवाड़ी में तौलवाएं।',
    overview: 'शिशु के जीवन के पहले 1000 दिन (गर्भावस्था से 2 वर्ष तक) शारीरिक और मानसिक विकास के लिए सबसे महत्वपूर्ण होते हैं।',
    guidelines: [
      { title: 'पहला गाढ़ा दूध (कोलोस्ट्रम)', desc: 'जन्म के तुरंत बाद (1 घंटे के भीतर) बच्चे को मां का दूध पिलाएं। यह बच्चे का पहला प्राकृतिक टीका है।' },
      { title: '6 महीने तक केवल स्तनपान', desc: 'पहले 6 महीने तक बच्चे को सिर्फ मां का दूध दें। घुट्टी, शहद, पानी या गाय का दूध बिल्कुल न दें।' },
      { title: 'पूरक आहार (Complementary Feeding)', desc: '6 महीने पूरे होने पर मसली हुई दाल, खिचड़ी, उबला आलू, केला दिन में 3-4 बार देना शुरू करें।' },
      { title: 'विकास निगरानी (MCP कार्ड)', desc: 'हर महीने आंगनवाड़ी केंद्र पर बच्चे का वजन तौलवाएं और विकास चार्ट में हरा क्षेत्र सुनिश्चित करें।' }
    ],
    dangerSigns: [
      'बच्चा सुस्त हो या मां का दूध न पी पा रहा हो',
      'तेज सांस चलना या छाती अंदर धंसना (निमोनिया का लक्षण)',
      'लगातार उल्टी होना या तेज दस्त (पानी जैसी शौच)',
      'शरीर का ठंडा पड़ना या 102 डिग्री से अधिक तेज बुखार',
      'नाभि से मवाद आना या नाभि का लाल होना'
    ],
    diet: [
      'गाढ़ी खिचड़ी में थोड़ा घी या तेल मिलाकर दें',
      'मसली हुई पीली दाल, उबली सब्जियां और केला',
      'स्तनपान कम से कम 2 वर्ष की आयु तक जारी रखें',
      'ओआरएस (ORS) और जिंक का घोल दस्त के समय तुरंत शुरू करें'
    ],
    schemes: [
      { name: 'राष्ट्रीय बाल स्वास्थ्य कार्यक्रम (RBSK)', amount: 'मुफ्त उपचार', desc: 'जन्मजात विकृतियों और बीमारियों की मुफ्त जांच व इलाज' },
      { name: 'पोषण अभियान (POSHAN Abhiyaan)', amount: 'राशन पैकेट', desc: 'आंगनवाड़ी केंद्र से टेक-होम राशन (THR) वितरण' }
    ]
  },
  vaccination: {
    id: 'vaccination',
    title: 'टीकाकरण कैलेंडर (Vaccination Schedule)',
    subtitle: '12 जानलेवा बीमारियों से बच्चे की सम्पूर्ण सुरक्षा',
    accentColor: '#27A69A',
    icon: 'shield-checkmark',
    audioText: 'टीकाकरण बच्चे का सुरक्षा कवच है। हर महीने के बुधवार को आंगनवाड़ी केंद्र पर वीएचएसएनडी सत्र में टीका लगता है। समय पर सभी टीके लगवाकर अपने बच्चे को जानलेवा बीमारियों से बचाएं।',
    overview: 'मिशन इंद्रधनुष के अंतर्गत बच्चों को टीबी, पोलियो, हेपेटाइटिस-बी, गलघोंटू, काली खांसी, टिटनेस, हीमोफिलस इन्फ्लूएंजा, रोटावायरस, न्यूमोकोकल, खसरा और रूबेला जैसी बीमारियों से बचाया जाता है।',
    guidelines: [
      { title: 'जन्म के समय (At Birth)', desc: 'बीसीजी (BCG), पोलियो की खुराक (OPV-0), और हेपेटाइटिस-बी बर्थ डोज़।' },
      { title: '6, 10, और 14 सप्ताह', desc: 'पेंटावेलेंट (1, 2, 3), पोलियो ड्रॉप्स, रोटावायरस ओरल, एफ-आईपीवी और न्यूमोकोकल (PCV)।' },
      { title: '9 महीने पूरे होने पर', desc: 'खसरा-रूबेला (MR-1), विटामिन-ए की पहली खुराक और पीसीवी बूस्टर।' },
      { title: '16 से 24 महीने', desc: 'एमआर-2 (MR-2), डीपीटी बूस्टर-1, पोलियो बूस्टर और विटामिन-ए की दूसरी खुराक।' },
      { title: '5 से 6 वर्ष', desc: 'डीपीटी बूस्टर-2 (DPT Booster-2) टीका अनिवार्य रूप से लगवाएं।' }
    ],
    dangerSigns: [
      'टीका लगने के 24 घंटे बाद भी तेज बुखार बना रहना',
      'टीके के स्थान पर अत्यधिक लाली, मवाद या बहुत बड़ा फोड़ा बनना',
      'बच्चे का अत्यधिक रोना या अचेत होना'
    ],
    diet: [
      'टीकाकरण से पहले और बाद में स्तनपान जारी रखें',
      'हल्का बुखार होने पर घबराएं नहीं, आशा दीदी द्वारा दी गई पैरासिटामोल सिरप की सही खुराक दें',
      'टीके के स्थान पर कोई तेल, हल्दी या बर्फ न रगड़ें'
    ],
    schemes: [
      { name: 'मिशन इंद्रधनुष (Mission Indradhanush)', amount: '100% मुफ्त', desc: 'छूटे हुए बच्चों व गर्भवती महिलाओं का घर-घर टीकाकरण' },
      { name: 'U-WIN डिजिटल पोर्टल', amount: 'डिजिटल सर्टिफिकेट', desc: 'टीकाकरण का ऑनलाइन रिकॉर्ड और एसएमएस रिमाइंडर' }
    ]
  },
  nutrition: {
    id: 'nutrition',
    title: 'पोषण एवं संतुलित आहार (Nutrition & Diet)',
    subtitle: 'स्थानीय अनाज, दालों और हरी सब्जियों से संपूर्ण पोषण',
    accentColor: '#F59E0B',
    icon: 'nutrition',
    audioText: 'स्वस्थ शरीर के लिए तिरंगा भोजन खाएं। भोजन में पीले, सफेद और हरे रंग की खाद्य सामग्री शामिल करें। आंगनवाड़ी केंद्र से मिलने वाला पोषण राशन जरूर लें। खाना खाने से पहले और शौच के बाद साबुन से हाथ धोएं।',
    overview: 'अच्छा पोषण महंगे खाने में नहीं, बल्कि स्थानीय और ताज़ा खाद्य पदार्थों के सही संतुलन में है। मौसमी सब्जियां, फल और दालें शरीर को रोगों से लड़ने की शक्ति देती हैं।',
    guidelines: [
      { title: 'तिरंगा भोजन की थाली', desc: 'केसरिया (गाजर, कद्दू, पपीता), सफेद (चावल, दूध, दही, केला) और हरा (पालक, मेथी, लौकी) हर भोजन में शामिल करें।' },
      { title: 'टेक-होम राशन (THR)', desc: 'गर्भवती महिलाओं, धात्री माताओं और 6 माह से 3 वर्ष के बच्चों के लिए आंगनवाड़ी से हर माह मुफ्त राशन प्राप्त करें।' },
      { title: 'स्वच्छ पानी और स्वच्छता', desc: 'हमेशा ढका हुआ पानी पिएं। भोजन पकाने व परोसने से पहले हाथों को साबुन से 20 सेकंड तक धोएं।' },
      { title: 'पेट के कीड़े की दवा (Deworming)', desc: '1 से 19 वर्ष के बच्चों को राष्ट्रीय कृमि मुक्ति दिवस पर साल में दो बार एल्बेंडाजोल की गोली अवश्य दें।' }
    ],
    dangerSigns: [
      'बच्चे का वजन कई महीनों से न बढ़ना या कम होना',
      'बालों का भूरा व रूखा होना और त्वचा में ढीलापन',
      'हाथों और पैरों में गड्ढे पड़ने वाली सूजन (कुपोषण का गंभीर लक्षण)',
      'मिट्टी, राख या चॉक खाने की आदत (गंभीर एनीमिया)'
    ],
    diet: [
      'मोटा अनाज (बाजरा, ज्वार, रागी) और दलिया',
      'अंकुरित मूंग व चना',
      'मौसमी हरी पत्तेदार सब्जियां और ताजे फल',
      'आयोडीन युक्त नमक का ही उपयोग करें'
    ],
    schemes: [
      { name: 'प्रधानमंत्री पोषण शक्ति निर्माण (POSHAN)', amount: 'पूरक पोषाहार', desc: 'बच्चों व किशोरियों में कुपोषण और एनीमिया मिटाने का राष्ट्रीय मिशन' },
      { name: 'मुख्यमंत्री सुपोषण योजना', amount: 'अंडा/चना/गुड़', desc: 'गंभीर कुपोषित बच्चों के लिए अतिरिक्त पौष्टिक आहार' }
    ]
  }
};

export const HealthGuideDetailScreen = ({ route, navigation }) => {
  const categoryKey = route.params?.category || 'pregnancy';
  const data = GUIDE_DATA[categoryKey] || GUIDE_DATA.pregnancy;

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestText, setRequestText] = useState(`कृपया ${data.title.split(' ')[0]} के संबंध में गृह भेंट करें।`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handleSendRequest = async () => {
    if (!requestText.trim()) {
      Alert.alert('त्रुटि', 'कृपया अनुरोध का विवरण लिखें।');
      return;
    }
    setIsSubmitting(true);
    try {
      await requestApi.createRequest({
        household_id: 'hh_001',
        beneficiary_name: 'Meena Devi',
        category: 'Household visit request',
        description: `[${data.title.split(' ')[0]}] ${requestText}`,
        priority: categoryKey === 'pregnancy' ? 'Urgent' : 'Medium'
      });
      setIsSubmitting(false);
      setShowRequestModal(false);
      Alert.alert(
        'अनुरोध भेजा गया (Request Sent)',
        'आपका संदेश आशा दीदी (सुनीता देवी) को भेज दिया गया है। वे जल्द ही आपसे संपर्क करेंगी।',
        [
          {
            text: 'ठीक है',
            onPress: () => navigation.navigate('RemindersTab')
          }
        ]
      );
    } catch (err) {
      setIsSubmitting(false);
      Alert.alert('त्रुटि', 'अनुरोध भेजने में समस्या आई। कृपया पुनः प्रयास करें।');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{data.title.split(' ')[0]}</Text>
        <TouchableOpacity
          onPress={() => setShowRequestModal(true)}
          style={styles.headerAction}
          accessibilityLabel="Ask ASHA"
        >
          <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
          <Text style={styles.headerActionText}>आशा दीदी</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={[styles.heroCard, { borderLeftColor: data.accentColor }]}>
          <View style={styles.heroRow}>
            <View style={[styles.iconBox, { backgroundColor: data.accentColor + '18' }]}>
              <Ionicons name={data.icon} size={32} color={data.accentColor} />
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>{data.title}</Text>
              <Text style={styles.heroSubtitle}>{data.subtitle}</Text>
            </View>
          </View>
          <Text style={styles.overviewText}>{data.overview}</Text>

          {/* Interactive Audio Player */}
          <TouchableOpacity
            style={[styles.audioPlayer, isPlayingAudio && styles.audioPlayerActive]}
            onPress={handleToggleAudio}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Listen to audio guidelines"
          >
            <View style={[styles.playButtonCircle, isPlayingAudio && { backgroundColor: data.accentColor }]}>
              <Ionicons
                name={isPlayingAudio ? 'pause' : 'volume-high'}
                size={20}
                color={isPlayingAudio ? '#FFFFFF' : colors.primary}
              />
            </View>
            <View style={styles.audioTextWrapper}>
              <Text style={styles.audioLabel}>
                {isPlayingAudio ? 'ऑडियो बज रहा है (सुनें)...' : 'ऑडियो में सुनें (Listen in Hindi)'}
              </Text>
              <Text style={styles.audioHint} numberOfLines={isPlayingAudio ? 3 : 1}>
                {isPlayingAudio ? `"${data.audioText}"` : 'टैप करके दिशानिर्देश आवाज में सुनें'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 1: Danger Signs (खतरे के लक्षण) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={styles.dangerSectionTitle}>खतरे के लक्षण (Danger Signs — तुरंत अस्पताल जाएं)</Text>
          </View>
          <View style={styles.dangerBox}>
            {data.dangerSigns.map((sign, idx) => (
              <View key={idx} style={styles.dangerRow}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginTop: 2 }} />
                <Text style={styles.dangerText}>{sign}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.emergencyCallBtn}
              onPress={() => Alert.alert('आपातकालीन कॉल', 'एम्बुलेंस के लिए 108 या आशा दीदी को कॉल करें।')}
            >
              <Ionicons name="call" size={16} color="#FFFFFF" />
              <Text style={styles.emergencyCallText}>आपातकाल में 108 डायल करें</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Key Guidelines (मुख्य दिशानिर्देश) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>मुख्य देखभाल एवं दिशानिर्देश (Care Guidelines)</Text>
          {data.guidelines.map((guide, idx) => (
            <View key={idx} style={styles.guidelineCard}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{idx + 1}</Text>
              </View>
              <View style={styles.guidelineContent}>
                <Text style={styles.guidelineTitle}>{guide.title}</Text>
                <Text style={styles.guidelineDesc}>{guide.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section 3: Recommended Diet (अनुशंसित आहार) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>पौष्टिक आहार सुझाव (Recommended Diet)</Text>
          <View style={styles.dietCard}>
            {data.diet.map((item, idx) => (
              <View key={idx} style={styles.dietRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.teal} />
                <Text style={styles.dietText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section 4: Government Schemes (सरकारी योजनाएं एवं लाभ) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>पात्र सरकारी योजनाएं (Government Schemes)</Text>
          {data.schemes.map((scheme, idx) => (
            <View key={idx} style={styles.schemeCard}>
              <View style={styles.schemeHeaderRow}>
                <Text style={styles.schemeName}>{scheme.name}</Text>
                <View style={styles.amountBadge}>
                  <Text style={styles.amountText}>{scheme.amount}</Text>
                </View>
              </View>
              <Text style={styles.schemeDesc}>{scheme.desc}</Text>
            </View>
          ))}
        </View>

        {/* CTA Banner: Contact ASHA */}
        <View style={styles.ctaCard}>
          <View style={styles.ctaTextContainer}>
            <Text style={styles.ctaTitle}>क्या आपको कोई संदेह या प्रश्न है?</Text>
            <Text style={styles.ctaSubtitle}>अपनी आशा दीदी (सुनीता देवी) से घर आकर मिलने का अनुरोध करें।</Text>
          </View>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => setShowRequestModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
            <Text style={styles.ctaButtonText}>आशा दीदी से भेंट मांगें</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Request Visit Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>आशा दीदी को संदेश भेजें</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              आशा कार्यकर्ता: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>सुनीता देवी (Rampur SC-04)</Text>
            </Text>

            <Text style={styles.modalLabel}>अनुरोध का विवरण (Message / Request):</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={requestText}
              onChangeText={setRequestText}
              placeholder="अपनी समस्या या भेंट का कारण लिखें..."
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowRequestModal(false)}
              >
                <Text style={styles.cancelBtnText}>रद्द करें</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSendRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>अनुरोध भेजें</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: 8
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill
  },
  headerActionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 16,
    ...shadows.card
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroTextContainer: {
    flex: 1
  },
  heroTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2
  },
  overviewText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 14
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  audioPlayerActive: {
    backgroundColor: '#EBF4FE',
    borderColor: colors.primary
  },
  playButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle
  },
  audioTextWrapper: {
    flex: 1
  },
  audioLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  audioHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  section: {
    marginBottom: 20
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  dangerSectionTitle: {
    ...typography.heading3,
    color: colors.danger,
    fontWeight: '700'
  },
  dangerBox: {
    backgroundColor: '#FDF2F2',
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F8B4B4'
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8
  },
  dangerText: {
    ...typography.bodyMedium,
    color: '#991B1B',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500'
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.danger,
    paddingVertical: 10,
    borderRadius: radius.sm,
    marginTop: 6
  },
  emergencyCallText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 10
  },
  guidelineCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'flex-start',
    gap: 12
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700'
  },
  guidelineContent: {
    flex: 1
  },
  guidelineTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  guidelineDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18
  },
  dietCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  dietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  dietText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1
  },
  schemeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  schemeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  schemeName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1
  },
  amountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  amountText: {
    ...typography.caption,
    color: '#065F46',
    fontWeight: '700'
  },
  schemeDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18
  },
  ctaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    ...shadows.card
  },
  ctaTextContainer: {
    marginBottom: 12
  },
  ctaTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  ctaSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md
  },
  ctaButtonText: {
    ...typography.button,
    color: '#FFFFFF'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  modalTitle: {
    ...typography.heading2,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  modalSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 14
  },
  modalLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: 6
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 16
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    ...typography.button,
    color: colors.textSecondary
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md
  },
  submitBtnText: {
    ...typography.button,
    color: '#FFFFFF'
  }
});

export default HealthGuideDetailScreen;

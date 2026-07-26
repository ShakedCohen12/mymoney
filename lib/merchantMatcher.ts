export type MerchantCategoryMatch = {
  categoryNames: string[];
  subcategoryNames: string[];
};

type MerchantRule = {
  merchantNames: string[];
  categoryNames: string[];
  subcategoryNames: string[];
};

export function normalizeMerchant(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
    .replace(/[״"'׳`]/g, "")
    .replace(/בעמ/g, "")
    .replace(/ltd/gi, "")
    .replace(/ישראל/g, "")
    .replace(/[^a-z0-9א-ת]/g, "")
    .trim();
}

const merchantRules: MerchantRule[] = [
  {
    merchantNames: [
      "כביש 6",
      "כביש6",
      "דרך ארץ",
      "derech eretz",
      "highway 6",
    ],
    categoryNames: [
      "רכב ותחבורה",
      "תחבורה",
      "רכב",
    ],
    subcategoryNames: [
      "כבישי אגרה",
      "אגרה",
      "כביש 6",
    ],
  },

  {
    merchantNames: [
      "פז",
      "yellow",
      "ילו",
      "paz",
    ],
    categoryNames: [
      "רכב ותחבורה",
      "תחבורה",
      "רכב",
    ],
    subcategoryNames: [
      "דלק",
      "תחנת דלק",
    ],
  },

  {
    merchantNames: [
      "סונול",
      "so good",
      "sogood",
      "sonol",
    ],
    categoryNames: [
      "רכב ותחבורה",
      "תחבורה",
      "רכב",
    ],
    subcategoryNames: [
      "דלק",
      "תחנת דלק",
    ],
  },

  {
    merchantNames: [
      "דור אלון",
      "אלונית",
      "dor alon",
    ],
    categoryNames: [
      "רכב ותחבורה",
      "תחבורה",
      "רכב",
    ],
    subcategoryNames: [
      "דלק",
      "תחנת דלק",
    ],
  },

  {
    merchantNames: [
      "דלק",
      "מנטה",
      "delek",
    ],
    categoryNames: [
      "רכב ותחבורה",
      "תחבורה",
      "רכב",
    ],
    subcategoryNames: [
      "דלק",
      "תחנת דלק",
    ],
  },

  {
    merchantNames: [
      "שופרסל",
      "שופרסל שלי",
      "שופרסל דיל",
      "יש חסד",
      "shufersal",
    ],
    categoryNames: [
      "קניות",
      "מזון וקניות",
      "מזון",
    ],
    subcategoryNames: [
      "סופר",
      "סופרמרקט",
      "קניות לבית",
    ],
  },

  {
    merchantNames: [
      "רמי לוי",
      "רמי לוי שיווק השקמה",
      "rami levy",
    ],
    categoryNames: [
      "קניות",
      "מזון וקניות",
      "מזון",
    ],
    subcategoryNames: [
      "סופר",
      "סופרמרקט",
      "קניות לבית",
    ],
  },

  {
    merchantNames: [
      "יוחננוף",
      "yochananof",
    ],
    categoryNames: [
      "קניות",
      "מזון וקניות",
      "מזון",
    ],
    subcategoryNames: [
      "סופר",
      "סופרמרקט",
      "קניות לבית",
    ],
  },

  {
    merchantNames: [
      "ויקטורי",
      "victory",
    ],
    categoryNames: [
      "קניות",
      "מזון וקניות",
      "מזון",
    ],
    subcategoryNames: [
      "סופר",
      "סופרמרקט",
      "קניות לבית",
    ],
  },

  {
    merchantNames: [
      "אושר עד",
      "osher ad",
    ],
    categoryNames: [
      "קניות",
      "מזון וקניות",
      "מזון",
    ],
    subcategoryNames: [
      "סופר",
      "סופרמרקט",
      "קניות לבית",
    ],
  },

  {
    merchantNames: [
      "קרפור",
      "carrefour",
    ],
    categoryNames: [
      "קניות",
      "מזון וקניות",
      "מזון",
    ],
    subcategoryNames: [
      "סופר",
      "סופרמרקט",
      "קניות לבית",
    ],
  },

  {
    merchantNames: [
      "am pm",
      "ampm",
      "am:pm",
    ],
    categoryNames: [
      "קניות",
      "מזון וקניות",
      "מזון",
    ],
    subcategoryNames: [
      "מכולת",
      "סופר",
      "סופרמרקט",
    ],
  },

  {
    merchantNames: [
      "וולט",
      "wolt",
    ],
    categoryNames: [
      "אוכל ומסעדות",
      "מסעדות",
      "אוכל",
    ],
    subcategoryNames: [
      "משלוחים",
      "אוכל בחוץ",
      "מסעדות",
    ],
  },

  {
    merchantNames: [
      "תן ביס",
      "תןביס",
      "10bis",
    ],
    categoryNames: [
      "אוכל ומסעדות",
      "מסעדות",
      "אוכל",
    ],
    subcategoryNames: [
      "משלוחים",
      "אוכל בחוץ",
      "מסעדות",
    ],
  },

  {
    merchantNames: [
      "מקדונלדס",
      "מקדונלד'ס",
      "mcdonalds",
    ],
    categoryNames: [
      "אוכל ומסעדות",
      "מסעדות",
      "אוכל",
    ],
    subcategoryNames: [
      "מזון מהיר",
      "אוכל בחוץ",
      "מסעדות",
    ],
  },

  {
    merchantNames: [
      "ארומה",
      "aroma",
    ],
    categoryNames: [
      "אוכל ומסעדות",
      "מסעדות",
      "אוכל",
    ],
    subcategoryNames: [
      "בתי קפה",
      "קפה",
      "אוכל בחוץ",
    ],
  },

  {
    merchantNames: [
      "קפה קפה",
      "cafecafe",
      "cafe cafe",
    ],
    categoryNames: [
      "אוכל ומסעדות",
      "מסעדות",
      "אוכל",
    ],
    subcategoryNames: [
      "בתי קפה",
      "קפה",
      "אוכל בחוץ",
    ],
  },

  {
    merchantNames: [
      "סופר פארם",
      "סופר-פארם",
      "super pharm",
      "superpharm",
    ],
    categoryNames: [
      "בריאות",
      "בריאות וטיפוח",
      "טיפוח",
    ],
    subcategoryNames: [
      "פארם",
      "תרופות",
      "טיפוח",
    ],
  },

  {
    merchantNames: [
      "be",
      "בי פארם",
      "be pharm",
    ],
    categoryNames: [
      "בריאות",
      "בריאות וטיפוח",
      "טיפוח",
    ],
    subcategoryNames: [
      "פארם",
      "תרופות",
      "טיפוח",
    ],
  },

  {
    merchantNames: [
      "נטפליקס",
      "netflix",
    ],
    categoryNames: [
      "פנאי ובידור",
      "פנאי",
      "בידור",
      "מנויים",
    ],
    subcategoryNames: [
      "מנויים",
      "סטרימינג",
      "טלוויזיה",
    ],
  },

  {
    merchantNames: [
      "ספוטיפיי",
      "spotify",
    ],
    categoryNames: [
      "פנאי ובידור",
      "פנאי",
      "בידור",
      "מנויים",
    ],
    subcategoryNames: [
      "מנויים",
      "מוזיקה",
      "סטרימינג",
    ],
  },

  {
    merchantNames: [
      "אפל",
      "apple",
      "apple com bill",
    ],
    categoryNames: [
      "פנאי ובידור",
      "פנאי",
      "מנויים",
      "קניות",
    ],
    subcategoryNames: [
      "מנויים",
      "אפליקציות",
      "דיגיטל",
    ],
  },

  {
    merchantNames: [
      "יס",
      "yes",
    ],
    categoryNames: [
      "חשבונות",
      "בית וחשבונות",
      "תקשורת",
      "פנאי ובידור",
    ],
    subcategoryNames: [
      "טלוויזיה",
      "תקשורת",
      "מנויים",
    ],
  },

  {
    merchantNames: [
      "הוט",
      "hot",
    ],
    categoryNames: [
      "חשבונות",
      "בית וחשבונות",
      "תקשורת",
    ],
    subcategoryNames: [
      "תקשורת",
      "אינטרנט",
      "טלוויזיה",
    ],
  },

  {
    merchantNames: [
      "סלקום",
      "cellcom",
    ],
    categoryNames: [
      "חשבונות",
      "בית וחשבונות",
      "תקשורת",
    ],
    subcategoryNames: [
      "טלפון",
      "סלולר",
      "תקשורת",
    ],
  },

  {
    merchantNames: [
      "פרטנר",
      "partner",
    ],
    categoryNames: [
      "חשבונות",
      "בית וחשבונות",
      "תקשורת",
    ],
    subcategoryNames: [
      "טלפון",
      "סלולר",
      "תקשורת",
    ],
  },

  {
    merchantNames: [
      "בזק",
      "bezeq",
    ],
    categoryNames: [
      "חשבונות",
      "בית וחשבונות",
      "תקשורת",
    ],
    subcategoryNames: [
      "אינטרנט",
      "טלפון",
      "תקשורת",
    ],
  },

  {
    merchantNames: [
      "חברת החשמל",
      "חשמל",
      "iec",
    ],
    categoryNames: [
      "חשבונות",
      "בית וחשבונות",
      "דיור",
    ],
    subcategoryNames: [
      "חשמל",
      "חשבונות בית",
    ],
  },

  {
    merchantNames: [
      "מקורות",
      "תאגיד מים",
      "מים",
    ],
    categoryNames: [
      "חשבונות",
      "בית וחשבונות",
      "דיור",
    ],
    subcategoryNames: [
      "מים",
      "חשבונות בית",
    ],
  },

  {
    merchantNames: [
      "זארה",
      "zara",
    ],
    categoryNames: [
      "קניות",
      "ביגוד",
      "אופנה",
    ],
    subcategoryNames: [
      "ביגוד",
      "אופנה",
    ],
  },

  {
    merchantNames: [
      "h&m",
      "hm",
    ],
    categoryNames: [
      "קניות",
      "ביגוד",
      "אופנה",
    ],
    subcategoryNames: [
      "ביגוד",
      "אופנה",
    ],
  },

  {
    merchantNames: [
      "טרמינל איקס",
      "terminal x",
      "terminalx",
    ],
    categoryNames: [
      "קניות",
      "ביגוד",
      "אופנה",
    ],
    subcategoryNames: [
      "קניות אונליין",
      "ביגוד",
      "אופנה",
    ],
  },

  {
    merchantNames: [
      "אלי אקספרס",
      "aliexpress",
      "ali express",
    ],
    categoryNames: [
      "קניות",
    ],
    subcategoryNames: [
      "קניות אונליין",
      "אונליין",
    ],
  },

  {
    merchantNames: [
      "טמו",
      "temu",
    ],
    categoryNames: [
      "קניות",
    ],
    subcategoryNames: [
      "קניות אונליין",
      "אונליין",
    ],
  },

  {
    merchantNames: [
      "איקאה",
      "ikea",
    ],
    categoryNames: [
      "בית",
      "בית וחשבונות",
      "קניות",
    ],
    subcategoryNames: [
      "ריהוט",
      "ציוד לבית",
      "עיצוב הבית",
    ],
  },

  {
    merchantNames: [
      "קיי אס פי",
      "ksp",
    ],
    categoryNames: [
      "קניות",
      "טכנולוגיה",
      "אלקטרוניקה",
    ],
    subcategoryNames: [
      "אלקטרוניקה",
      "מחשבים",
      "טכנולוגיה",
    ],
  },

  {
    merchantNames: [
      "אייבורי",
      "ivory",
    ],
    categoryNames: [
      "קניות",
      "טכנולוגיה",
      "אלקטרוניקה",
    ],
    subcategoryNames: [
      "אלקטרוניקה",
      "מחשבים",
      "טכנולוגיה",
    ],
  },
];

export function matchMerchant(
  merchantName: string
): MerchantCategoryMatch | null {
  const merchantKey = normalizeMerchant(merchantName);

  if (!merchantKey) {
    return null;
  }

  const rule = merchantRules.find((currentRule) =>
    currentRule.merchantNames.some((name) => {
      const ruleKey = normalizeMerchant(name);

      return (
        merchantKey.includes(ruleKey) ||
        ruleKey.includes(merchantKey)
      );
    })
  );

  if (!rule) {
    return null;
  }

  return {
    categoryNames: rule.categoryNames,
    subcategoryNames: rule.subcategoryNames,
  };
}
// ========================================
// KEYWORD LISTS
// ========================================

const POSITIVE_WORDS = [
  "good","great","awesome","love","nice","amazing",
  "excellent","wonderful","fantastic","brilliant",
  "superb","outstanding","perfect","beautiful",
  "lovely","incredible"
];

const NEGATIVE_WORDS = [
  "bad","worst","hate","useless","terrible",
  "horrible","awful","disgusting","pathetic",
  "disappointing"
];

const TOXIC_WORDS = [
  "idiot","stupid","dumb","nonsense","moron",
  "fool","loser","trash","garbage","worthless",
  "pathetic","incompetent","failure"
];

const VULGAR_WORDS = [
  "fuck","shit","bitch","ass","damn",
  "bastard","crap","hell","piss",
  "dick","cock","pussy","asshole","motherfucker"
];

const HINDI_BAD_WORDS = [
  "chutiya","chutiye","madarchod","bhenchod","bhosdike",
  "gandu","harami","kamina","kutta","kutte",
  "saala","saali","randi","lodu","lawde",
  "gaandu","bhadwe","bhadwa","behen","behenkelode",
  "mc","bc","bhosad","chut","lund",
  "betichod","behenchod","ullu","bewakoof",
  "pagal","buddhu","nalayak"
];

const SPAM_PATTERNS = [
  "buy now","free money","click here",
  "limited offer","act now","win free",
  "make money fast","100% free",
  "no credit card","risk free",
  "special promotion","earn $$",
  "work from home","weight loss","casino"
];

const HATE_SPEECH_PATTERNS = [
  "kill yourself","kys","die",
  "end your life","hope you die",
  "should die","deserve to die"
];

// ========================================
// UTILITIES
// ========================================

function containsAny(text, list) {
  return list.some(word => text.includes(word));
}

function countMatches(text, list) {
  return list.filter(word => text.includes(word)).length;
}

// ========================================
// MAIN ANALYSIS FUNCTION
// ========================================

function analyzeComment({ text, platform, content_type, language }) {

  const lowerText = text.toLowerCase().trim();

  if (!lowerText) {
    return {
      original_text: text,
      sentiment: { label: "neutral", confidence: 0.5 },
      category: "invalid",
      flags: { toxic:false,vulgar:false,spam:false,hate_speech:false },
      recommended_action: "reject",
      metadata:{
        platform: platform || "unspecified",
        content_type: content_type || "comment",
        language: language || "en",
        reason: "Empty comment"
      }
    };
  }

  const flags = {
    toxic: containsAny(lowerText, TOXIC_WORDS),
    vulgar: containsAny(lowerText, VULGAR_WORDS) || containsAny(lowerText, HINDI_BAD_WORDS),
    spam: containsAny(lowerText, SPAM_PATTERNS),
    hate_speech: containsAny(lowerText, HATE_SPEECH_PATTERNS)
  };

  const toxicCount = countMatches(lowerText, TOXIC_WORDS);
  const vulgarCount =
    countMatches(lowerText, VULGAR_WORDS) +
    countMatches(lowerText, HINDI_BAD_WORDS);

  let sentimentLabel = "neutral";
  let confidence = 0.5;

  const positiveCount = countMatches(lowerText, POSITIVE_WORDS);
  const negativeCount = countMatches(lowerText, NEGATIVE_WORDS);

  if (positiveCount > negativeCount) {
    sentimentLabel = "positive";
    confidence = Math.min(0.95, 0.6 + positiveCount * 0.1);
  } 
  else if (negativeCount > positiveCount) {
    sentimentLabel = "negative";
    confidence = Math.min(0.95, 0.6 + negativeCount * 0.1);
  }

  if (flags.toxic || flags.vulgar || flags.hate_speech) {
    sentimentLabel = "negative";
    confidence = 0.9;
  }

  let category = "neutral";
  let severity = "low";

  if (flags.hate_speech) {
    category = "hate_speech";
    severity = "critical";
  }
  else if (flags.spam) {
    category = "spam";
    severity = "high";
  }
  else if (vulgarCount >= 3) {
    category = "severe_profanity";
    severity = "critical";
  }
  else if (flags.vulgar) {
    category = "vulgar";
    severity = "high";
  }
  else if (toxicCount >= 2) {
    category = "severe_toxic";
    severity = "high";
  }
  else if (flags.toxic) {
    category = "toxic_insult";
    severity = "medium";
  }
  else if (sentimentLabel === "positive") {
    category = "supportive";
  }
  else if (sentimentLabel === "negative") {
    category = "emotional_negative";
  }

  let recommended_action = "allow";

  if (severity === "critical") {
    recommended_action = "block_immediately";
  }
  else if (severity === "high") {
    recommended_action = "hide_and_review";
  }
  else if (severity === "medium") {
    recommended_action = "flag_for_review";
  }
  else if (sentimentLabel === "negative") {
    recommended_action = "allow_with_warning";
  }

  return {
    original_text: text,
    sentiment: {
      label: sentimentLabel,
      confidence: parseFloat(confidence.toFixed(2))
    },
    category,
    severity,
    flags,
    recommended_action,
    metadata: {
      platform: platform || "unspecified",
      content_type: content_type || "comment",
      language: language || "en",
      toxic_count: toxicCount,
      vulgar_count: vulgarCount,
      positive_words: positiveCount,
      negative_words: negativeCount
    }
  };
}

module.exports = analyzeComment;
from __future__ import annotations

import re

POSITIVE_WORDS = {
    'happy', 'good', 'great', 'love', 'calm', 'better', 'relaxed', 'proud', 'grateful', 'excited', 'hopeful',
    'smile', 'enjoy', 'thankful', 'peaceful', 'nice', 'fun', 'joy', 'okay', 'fine', 'safe'
}
NEGATIVE_WORDS = {
    'sad', 'bad', 'depressed', 'anxious', 'stress', 'stressed', 'tired', 'upset', 'angry', 'lonely', 'hurt',
    'cry', 'worried', 'panic', 'empty', 'hopeless', 'afraid', 'burnout', 'burned', 'overwhelmed', 'down'
}
SUPPORT_WORDS = {
    'rest', 'music', 'walk', 'breathe', 'friend', 'family', 'support', 'help', 'sleep', 'break', 'tea', 'water'
}
INTENSIFIERS = {'very', 'really', 'so', 'too', 'extremely', 'quite', 'super'}
NEGATIONS = {'not', 'never', "don't", 'no', 'nothing', 'hardly', 'rarely'}
FIRST_PERSON = {'i', 'me', 'my', 'myself'}


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z']+", (text or '').lower())


def extract_text_features(transcript: str, topic_text: str) -> dict:
    cleaned = ' '.join((transcript or '').strip().split())
    tokens = _tokenize(cleaned)
    topic_tokens = _tokenize(topic_text)

    positive_count = sum(token in POSITIVE_WORDS for token in tokens)
    negative_count = sum(token in NEGATIVE_WORDS for token in tokens)
    support_count = sum(token in SUPPORT_WORDS for token in tokens)
    intensifier_count = sum(token in INTENSIFIERS for token in tokens)
    negation_count = sum(token in NEGATIONS for token in tokens)
    first_person_count = sum(token in FIRST_PERSON for token in tokens)

    sentiment_balance = positive_count - negative_count
    lexical_diversity = len(set(tokens)) / max(len(tokens), 1)

    overlap_count = len(set(tokens) & set(topic_tokens)) if topic_tokens else 0
    topic_alignment = overlap_count / max(len(set(topic_tokens)), 1) if topic_tokens else 0.0

    return {
        'available': bool(cleaned),
        'transcript': cleaned,
        'tokenCount': len(tokens),
        'positiveCount': positive_count,
        'negativeCount': negative_count,
        'supportCount': support_count,
        'intensifierCount': intensifier_count,
        'negationCount': negation_count,
        'firstPersonCount': first_person_count,
        'sentimentBalance': sentiment_balance,
        'lexicalDiversity': round(float(lexical_diversity), 4),
        'topicAlignment': round(float(topic_alignment), 4),
        'questionMarks': cleaned.count('?'),
        'exclamationMarks': cleaned.count('!'),
    }

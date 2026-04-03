import axios from 'axios';

function toSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function buildCuratedItem(id, title, query, category, description) {
  return {
    id,
    title,
    url: toSearchUrl(query),
    thumbnail: '',
    channelTitle: 'MoodPal picks',
    category,
    source: 'fallback-search',
    description
  };
}

const CURATED_BY_CATEGORY = {
  calming: [
    buildCuratedItem(
      'calm-piano',
      'Relaxing piano mix',
      'relaxing piano music for stress relief',
      'calming',
      'Gentle piano and instrumental music for a quieter moment.'
    ),
    buildCuratedItem(
      'soft-instrumental',
      'Soft instrumental playlist',
      'soft instrumental calming music playlist',
      'calming',
      'Light, slow music that can help the user settle down.'
    ),
    buildCuratedItem(
      'rain-sleep',
      'Rain and sleep sounds',
      'rain sounds relaxing sleep music',
      'calming',
      'A softer ambient option for rest and decompression.'
    )
  ],
  relaxing: [
    buildCuratedItem(
      'acoustic-chill',
      'Light acoustic playlist',
      'light acoustic chill playlist',
      'relaxing',
      'Easy listening acoustic tracks for a balanced mood.'
    ),
    buildCuratedItem(
      'focus-lofi',
      'Focus and lo-fi mix',
      'focus music lofi chill mix',
      'relaxing',
      'Soft background music for focus and gentle recovery.'
    ),
    buildCuratedItem(
      'jazz-calm',
      'Calm jazz background music',
      'calm jazz background music',
      'relaxing',
      'A mellow option when the user wants something warm but not sleepy.'
    )
  ],
  uplifting: [
    buildCuratedItem(
      'happy-pop',
      'Happy playlist',
      'happy songs uplifting playlist',
      'uplifting',
      'Lively songs to match a brighter mood.'
    ),
    buildCuratedItem(
      'positive-energy',
      'Positive energy music',
      'positive energy music playlist',
      'uplifting',
      'Energetic background music for momentum and motivation.'
    ),
    buildCuratedItem(
      'morning-boost',
      'Morning boost mix',
      'good mood morning music playlist',
      'uplifting',
      'A more upbeat option for keeping the mood high.'
    )
  ]
};

export function getMusicCategory(score) {
  if (score <= 30) return 'calming';
  if (score <= 60) return 'relaxing';
  return 'uplifting';
}

export function getMusicQueriesByMood(score) {
  const category = getMusicCategory(score);

  if (category === 'calming') {
    return [
      'relaxing piano music for stress relief',
      'calming music soft instrumental',
      'healing ambient music playlist'
    ];
  }

  if (category === 'relaxing') {
    return [
      'light acoustic chill playlist',
      'focus music chill mix',
      'calm jazz background music'
    ];
  }

  return [
    'happy songs uplifting playlist',
    'positive energy music mix',
    'feel good music playlist'
  ];
}

function normalizeYouTubeResults(items, category) {
  return (items || []).map((item, index) => ({
    id: item?.id?.videoId || `${category}-${index}`,
    title: item?.snippet?.title || 'YouTube music recommendation',
    url: item?.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : '',
    thumbnail:
      item?.snippet?.thumbnails?.high?.url ||
      item?.snippet?.thumbnails?.medium?.url ||
      item?.snippet?.thumbnails?.default?.url ||
      '',
    channelTitle: item?.snippet?.channelTitle || 'YouTube',
    category,
    source: 'youtube-api',
    description: item?.snippet?.description || 'Recommended by MoodPal based on the current mood score.'
  }));
}

async function searchYouTubeVideos(query, apiKey, maxResults = 3) {
  const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    timeout: 8000,
    params: {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults,
      key: apiKey,
      videoCategoryId: '10',
      videoEmbeddable: 'true',
      safeSearch: 'moderate'
    }
  });

  return response.data?.items || [];
}

export function getFallbackMusicRecommendations(score) {
  const category = getMusicCategory(score);
  return CURATED_BY_CATEGORY[category] || CURATED_BY_CATEGORY.relaxing;
}

export async function getMusicRecommendations(score, apiKey) {
  const category = getMusicCategory(score);

  if (!apiKey) {
    return getFallbackMusicRecommendations(score);
  }

  const queries = getMusicQueriesByMood(score);

  for (const query of queries) {
    try {
      const items = await searchYouTubeVideos(query, apiKey, 3);
      const results = normalizeYouTubeResults(items, category).filter((item) => item.url);
      if (results.length) {
        return results;
      }
    } catch (error) {
      // Fall back to curated results if the API is unavailable or the key is invalid.
    }
  }

  return getFallbackMusicRecommendations(score);
}

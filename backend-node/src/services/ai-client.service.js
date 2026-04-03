import fs from 'node:fs';
import axios from 'axios';
import FormData from 'form-data';

export async function analyzeWithAi({ videoPath, topicText, transcript }) {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  const form = new FormData();
  form.append('video', fs.createReadStream(videoPath));
  form.append('topicText', topicText || '');
  form.append('transcript', transcript || '');

  const response = await axios.post(`${aiServiceUrl}/infer`, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  });

  return response.data?.data;
}

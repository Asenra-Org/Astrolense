import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

export const maxDuration = 60;

const parser = new Parser();

const IMAGE_MAP: Record<string, string> = {
  'sun': 'https://upload.wikimedia.org/wikipedia/commons/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
  'moon': 'https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg',
  'mercury': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg',
  'venus': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Venus_from_Mariner_10.jpg',
  'earth': 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg',
  'mars': 'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg',
  'jupiter': 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg',
  'saturn': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg',
  'uranus': 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg',
  'neptune': 'https://upload.wikimedia.org/wikipedia/commons/6/63/Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg',
  'meteor': 'https://upload.wikimedia.org/wikipedia/commons/2/29/Meteor_by_Alex_Conu.jpg',
  'eclipse': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Solar_eclipse_1999_4_NR.jpg',
  'comet': 'https://upload.wikimedia.org/wikipedia/commons/1/14/Comet_Hale-Bopp_1995O1.jpg',
  'default': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Crab_Nebula.jpg'
};

export async function GET(req: Request) {
  try {
    // 1. Fetch RSS
    const feed = await parser.parseURL('https://in-the-sky.org/rss.php?feed=dfan');
    
    // Grab first 10 items
    const items = feed.items.slice(0, 10).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      content: item.contentSnippet || item.content
    }));

    // 2. Use Gemini to parse into structured engaging format
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        events: z.array(z.object({
          title: z.string().describe('Catchy social-media style title for the event'),
          description: z.string().describe('Exciting description of what will happen'),
          date: z.string().describe('ISO Date string for when the event occurs'),
          link: z.string().describe('The exact original link URL provided in the raw event data'),
          type: z.enum(['conjunction', 'meteor_shower', 'eclipse', 'close_approach', 'other']),
          primaryBody: z.enum(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'meteor', 'eclipse', 'comet', 'default']).describe('The primary celestial body or object involved in this event.')
        }))
      }),
      prompt: `Here is a list of upcoming astronomical events from an RSS feed. 
Rewrite them into exciting, engaging social-media style posts for space enthusiasts.
Ensure the 'date' is an accurate ISO string based on the provided pubDate. Do not include events that have already passed relative to today.
For primaryBody, choose the most prominent body. If it is a meteor shower, choose 'meteor'. If it's a conjunction between Jupiter and Venus, choose either 'jupiter' or 'venus'.

Raw Events:
${JSON.stringify(items, null, 2)}`
    });

    // 3. Save to Firebase
    const batch = adminDb.batch();
    const collectionRef = adminDb.collection('events_feed');

    const addedIds = [];
    for (const event of object.events) {
      // Create a unique ID from the link to prevent duplicates on subsequent cron runs
      const eventId = event.link ? event.link.replace(/[^a-zA-Z0-9]/g, '-') : event.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 50);
      const docRef = collectionRef.doc(eventId.slice(-50)); // keep it short enough for firestore
      
      const imageUrl = IMAGE_MAP[event.primaryBody] || IMAGE_MAP['default'];

      batch.set(docRef, {
        ...event,
        imageUrl,
        likesCount: 0,
        createdAt: new Date().toISOString()
      }, { merge: true }); // Merge true so we don't reset likesCount if it already exists
      addedIds.push(eventId);
    }

    await batch.commit();

    return NextResponse.json({ success: true, count: addedIds.length, addedIds });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

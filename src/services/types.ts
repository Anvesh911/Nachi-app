// src/services/types.ts

export interface ConversationSummary {
  keyPoints: string[];
  promises: string[];
  dates: string[];
  reminders: string[];
  tone: string;
  toneEmoji: string;
}

export interface Conversation {
  id: string;
  contact: string;
  avatar: string;
  avatarColor: string;
  date: string;           // ISO string
  durationSeconds: number;
  durationLabel: string;  // "14:22"
  tag: string;
  tagColor: string;
  starred: boolean;
  audioFilePath?: string;
  transcript: string;
  summary: ConversationSummary;
  topics: string[];
}

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    contact: 'Priya Sharma',
    avatar: 'PS',
    avatarColor: '#00B4FF',
    date: '2026-05-21T10:32:00',
    durationSeconds: 862,
    durationLabel: '14:22',
    tag: 'Family',
    tagColor: '#FF6B6B',
    starred: true,
    transcript: `Hi Priya, thanks for calling. So we were discussing the Shimla trip, right? Yes, I confirmed with the hotel — Royal Palace Inn, check-in on June 14th. We need to book train tickets by this weekend otherwise prices go up. Rajeev is coming too, he confirmed yesterday. Oh and don't forget — Maa's birthday is June 12th, we should plan something small before we leave. Also you mentioned you had some savings left from last month, maybe we can use that for the trip expenses. Okay, I'll share the hotel booking confirmation on WhatsApp. Take care, bye.`,
    summary: {
      keyPoints: [
        'Shimla trip planned — Royal Palace Inn hotel booked',
        'Check-in: June 14th',
        'Train tickets to be booked this weekend',
        'Rajeev confirmed for the trip',
      ],
      promises: [
        'Share hotel booking confirmation on WhatsApp',
        'Book train tickets before weekend',
      ],
      dates: ["June 12 – Maa's birthday", 'June 14 – Hotel check-in'],
      reminders: [
        "Plan something for Maa's birthday before trip",
        "Use last month's savings for trip expenses",
      ],
      tone: 'Warm & planning-focused',
      toneEmoji: '🤝',
    },
    topics: ['trip', 'birthday', 'hotel', 'train', 'rajeev'],
  },
  {
    id: '2',
    contact: 'Vikram Mehta',
    avatar: 'VM',
    avatarColor: '#7C5CFC',
    date: '2026-05-20T15:10:00',
    durationSeconds: 525,
    durationLabel: '8:45',
    tag: 'Work',
    tagColor: '#00D4AA',
    starred: false,
    transcript: `Hey Vikram. So the client presentation is on Friday 3 PM. I'll handle the financial slides, you take care of the product demo section. They want quarterly projections added — Ananya said that's mandatory. Budget approved is 2.4 crore, not 2 crore as earlier. Also we need to loop in Sanjay from legal before we send the contract. Deadline for the draft is tomorrow 5 PM. If I'm late just ping me on Slack. Okay great, talk soon.`,
    summary: {
      keyPoints: [
        'Client presentation on Friday 3 PM',
        'Financial slides: you. Product demo: Vikram',
        'Quarterly projections are mandatory (per Ananya)',
        'Budget revised to ₹2.4 crore',
      ],
      promises: [
        'Send contract draft by tomorrow 5 PM',
        'Loop in Sanjay from legal before contract',
      ],
      dates: ['Friday 3 PM – Client presentation', 'Tomorrow 5 PM – Contract draft deadline'],
      reminders: ['Ping on Slack if late', 'Add quarterly projections to slides'],
      tone: 'Professional & urgent',
      toneEmoji: '💼',
    },
    topics: ['presentation', 'client', 'contract', 'budget', 'friday'],
  },
  {
    id: '3',
    contact: 'Ananya Rao',
    avatar: 'AR',
    avatarColor: '#FF9F43',
    date: '2026-05-19T20:05:00',
    durationSeconds: 1331,
    durationLabel: '22:11',
    tag: 'Friend',
    tagColor: '#A29BFE',
    starred: true,
    transcript: `Hey! So yes, the movie is confirmed — Kalki 2898 AD, Sunday 7 PM at PVR Nexus. Rohit is coming, Sneha might join if she finishes her project. Book 4 tickets just in case. Oh and bring your jacket, the AC there is brutal. After movie we're going to Social for dinner — they have that new cocktail menu, I already made a reservation for 10 PM. Don't be late this time please! Also happy early birthday by the way — 25 looks good on you ha ha.`,
    summary: {
      keyPoints: [
        'Movie: Kalki 2898 AD at PVR Nexus',
        'Sunday 7 PM – confirmed',
        'Rohit coming; Sneha might join',
        'Dinner at Social after, 10 PM reservation',
      ],
      promises: ['Book 4 tickets', "Don't be late"],
      dates: ['Sunday 7 PM – Movie', 'Sunday 10 PM – Dinner at Social'],
      reminders: ['Bring jacket (AC is cold)', 'Plan for actual birthday too'],
      tone: 'Fun & excited',
      toneEmoji: '🎉',
    },
    topics: ['movie', 'birthday', 'dinner', 'sunday', 'pvr', 'rohit'],
  },
  {
    id: '4',
    contact: 'Dr. Arjun Nair',
    avatar: 'AN',
    avatarColor: '#55EFC4',
    date: '2026-05-18T11:30:00',
    durationSeconds: 378,
    durationLabel: '6:18',
    tag: 'Health',
    tagColor: '#FD79A8',
    starred: false,
    transcript: `Good morning doctor. So my report came back normal — thyroid is fine, B12 is slightly low. He recommended Methylcobalamin 500mcg daily for 3 months. Also reduce screen time before bed, that's affecting sleep. Follow-up appointment in 6 weeks — June 29th at 11 AM. He said if I feel fatigued continue the iron tabs along with the B12. Drink more water. My BP was 118/76 which is good.`,
    summary: {
      keyPoints: [
        'Thyroid: Normal ✓',
        'B12 slightly low — start Methylcobalamin 500mcg daily',
        'BP: 118/76 — good',
        'Reduce screen time before bed',
      ],
      promises: ['Take B12 supplement for 3 months'],
      dates: ['June 29, 11 AM – Follow-up appointment'],
      reminders: ['Continue iron tabs if fatigued', 'Drink more water', 'Reduce screen time at night'],
      tone: 'Informational & calm',
      toneEmoji: '🏥',
    },
    topics: ['doctor', 'health', 'b12', 'appointment', 'medicine'],
  },
];

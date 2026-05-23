// src/services/types.ts

// ─── Reminder ─────────────────────────────────────────────────────────────────

export interface Reminder {
  id: string;
  conversationId: string;
  title: string;
  notes?: string;
  scheduledDate: string; // ISO string
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  completed: boolean;
  notificationId?: string; // expo-notifications ID
  createdAt: string;
}

// ─── Editable Summary ─────────────────────────────────────────────────────────

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface DatePlan {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
}

export interface ConversationSummary {
  keyPoints: string[];
  promises: string[];   // kept for backward compat
  tasks: Task[];        // new editable checklist
  dates: string[];      // kept for backward compat
  datePlans: DatePlan[]; // new editable date plans
  reminders: string[];
  tone: string;
  toneEmoji: string;
  toneDescription?: string;
  tags: string[];       // editable tags
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  contact: string;
  avatar: string;
  avatarColor: string;
  date: string;
  durationSeconds: number;
  durationLabel: string;
  tag: string;
  tagColor: string;
  starred: boolean;
  hidden?: boolean;
  audioFilePath?: string;
  transcript: string;
  summary: ConversationSummary;
  topics: string[];
}

// ─── Storage Info ─────────────────────────────────────────────────────────────

export interface StorageInfo {
  totalBytes: number;
  recordingsBytes: number;
  transcriptBytes: number;
  cacheBytes: number;
  remindersBytes: number;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

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
    hidden: false,
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
      tasks: [
        { id: 't1', text: 'Share hotel booking confirmation on WhatsApp', completed: false },
        { id: 't2', text: 'Book train tickets before weekend', completed: false },
      ],
      dates: ["June 12 – Maa's birthday", 'June 14 – Hotel check-in'],
      datePlans: [
        { id: 'dp1', title: "Maa's Birthday", date: '2026-06-12', time: '' },
        { id: 'dp2', title: 'Hotel Check-in', date: '2026-06-14', time: '' },
      ],
      reminders: [
        "Plan something for Maa's birthday before trip",
        "Use last month's savings for trip expenses",
      ],
      tone: 'Warm & planning-focused',
      toneEmoji: '🤝',
      toneDescription: 'Friendly and collaborative conversation',
      tags: ['trip', 'birthday', 'hotel', 'train'],
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
    hidden: false,
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
      tasks: [
        { id: 't1', text: 'Send contract draft by tomorrow 5 PM', completed: false },
        { id: 't2', text: 'Loop in Sanjay from legal before contract', completed: false },
        { id: 't3', text: 'Add quarterly projections to slides', completed: false },
      ],
      dates: ['Friday 3 PM – Client presentation', 'Tomorrow 5 PM – Contract draft deadline'],
      datePlans: [
        { id: 'dp1', title: 'Client Presentation', date: '', time: '3:00 PM' },
        { id: 'dp2', title: 'Contract Draft Deadline', date: '', time: '5:00 PM' },
      ],
      reminders: ['Ping on Slack if late', 'Add quarterly projections to slides'],
      tone: 'Professional & urgent',
      toneEmoji: '💼',
      toneDescription: 'Focused and deadline-driven',
      tags: ['presentation', 'client', 'contract', 'budget'],
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
    hidden: false,
    transcript: `Hey! So yes, the movie is confirmed — Kalki 2898 AD, Sunday 7 PM at PVR Nexus. Rohit is coming, Sneha might join if she finishes her project. Book 4 tickets just in case. Oh and bring your jacket, the AC there is brutal. After movie we're going to Social for dinner — they have that new cocktail menu, I already made a reservation for 10 PM. Don't be late this time please! Also happy early birthday by the way — 25 looks good on you ha ha.`,
    summary: {
      keyPoints: [
        'Movie: Kalki 2898 AD at PVR Nexus',
        'Sunday 7 PM – confirmed',
        'Rohit coming; Sneha might join',
        'Dinner at Social after, 10 PM reservation',
      ],
      promises: ['Book 4 tickets', "Don't be late"],
      tasks: [
        { id: 't1', text: 'Book 4 movie tickets', completed: false },
        { id: 't2', text: "Don't be late to movie", completed: false },
      ],
      dates: ['Sunday 7 PM – Movie', 'Sunday 10 PM – Dinner at Social'],
      datePlans: [
        { id: 'dp1', title: 'Movie at PVR Nexus', date: '', time: '7:00 PM', location: 'PVR Nexus' },
        { id: 'dp2', title: 'Dinner at Social', date: '', time: '10:00 PM', location: 'Social' },
      ],
      reminders: ['Bring jacket (AC is cold)', 'Plan for actual birthday too'],
      tone: 'Fun & excited',
      toneEmoji: '🎉',
      toneDescription: 'Cheerful and celebratory',
      tags: ['movie', 'birthday', 'dinner', 'friends'],
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
    hidden: false,
    transcript: `Good morning doctor. So my report came back normal — thyroid is fine, B12 is slightly low. He recommended Methylcobalamin 500mcg daily for 3 months. Also reduce screen time before bed, that's affecting sleep. Follow-up appointment in 6 weeks — June 29th at 11 AM. He said if I feel fatigued continue the iron tabs along with the B12. Drink more water. My BP was 118/76 which is good.`,
    summary: {
      keyPoints: [
        'Thyroid: Normal ✓',
        'B12 slightly low — start Methylcobalamin 500mcg daily',
        'BP: 118/76 — good',
        'Reduce screen time before bed',
      ],
      promises: ['Take B12 supplement for 3 months'],
      tasks: [
        { id: 't1', text: 'Take B12 supplement daily for 3 months', completed: false },
        { id: 't2', text: 'Continue iron tabs if fatigued', completed: false },
        { id: 't3', text: 'Drink more water', completed: false },
      ],
      dates: ['June 29, 11 AM – Follow-up appointment'],
      datePlans: [
        { id: 'dp1', title: 'Follow-up Appointment', date: '2026-06-29', time: '11:00 AM' },
      ],
      reminders: ['Continue iron tabs if fatigued', 'Drink more water', 'Reduce screen time at night'],
      tone: 'Informational & calm',
      toneEmoji: '🏥',
      toneDescription: 'Medical and informative tone',
      tags: ['health', 'doctor', 'medicine', 'appointment'],
    },
    topics: ['doctor', 'health', 'b12', 'appointment', 'medicine'],
  },
];

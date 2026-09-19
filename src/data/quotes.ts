export interface Quote {
  text: string;
  author: string;
}

/** Well-known quotations by long-deceased authors; disputed ones are labelled "Attributed to". */
export const QUOTES: Record<'short' | 'medium' | 'long', Quote[]> = {
  short: [
    { text: 'The only thing we have to fear is fear itself.', author: 'Franklin D. Roosevelt' },
    { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
    { text: 'Lost time is never found again.', author: 'Benjamin Franklin' },
    { text: 'To be, or not to be, that is the question.', author: 'William Shakespeare' },
    { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
    { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant' },
    { text: 'Nothing great was ever achieved without enthusiasm.', author: 'Ralph Waldo Emerson' },
    { text: 'The best way out is always through.', author: 'Robert Frost' },
    { text: 'Always do right. This will gratify some people and astonish the rest.', author: 'Mark Twain' },
    { text: 'It always seems impossible until it is done.', author: 'Attributed to Nelson Mandela' },
    { text: 'Whether you think you can, or you think you cannot, you are right.', author: 'Attributed to Henry Ford' },
  ],
  medium: [
    { text: 'It is not that we have a short time to live, but that we waste a lot of it.', author: 'Seneca' },
    { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
    { text: 'It is not enough to be busy; so are the ants. The question is: what are we busy about?', author: 'Henry David Thoreau' },
    { text: 'Early to bed and early to rise, makes a man healthy, wealthy, and wise.', author: 'Benjamin Franklin' },
    { text: 'All the world is a stage, and all the men and women merely players; they have their exits and their entrances.', author: 'William Shakespeare' },
    { text: 'I have not failed. I have just found ten thousand ways that will not work.', author: 'Attributed to Thomas Edison' },
    { text: 'Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.', author: 'Marie Curie' },
    { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Attributed to Confucius' },
  ],
  long: [
    {
      text: 'It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood; who strives valiantly.',
      author: 'Theodore Roosevelt',
    },
    {
      text: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.',
      author: 'Henry David Thoreau',
    },
    {
      text: 'If one advances confidently in the direction of his dreams, and endeavors to live the life which he has imagined, he will meet with a success unexpected in common hours.',
      author: 'Henry David Thoreau',
    },
    {
      text: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.',
      author: 'Abraham Lincoln',
    },
  ],
};

export const ZEN_PASSAGES: string[] = [
  'Breathe in slowly, and let the day settle. There is nothing to win here, and nothing to lose. Each letter is a small step, and each word a quiet stone laid across the stream. Type gently. Let your fingers find their own pace, the way water finds its way downhill, without hurry and without doubt.',
  'The morning light spills across the table and the kettle begins to sing. Somewhere a bird tries a new song. You have nowhere else to be. Let your hands move like a slow river, one word after another, and notice how the noise in your mind grows softer with every line.',
  'Rain taps the window in a patient rhythm. Inside, the room is warm and still. A good habit is built the same way as this sentence: one small piece at a time, with no rush, until the whole thing quietly stands complete.',
];

export type StoryCategory = 'fables' | 'classics' | 'scifi' | 'calm';

export interface Chapter {
  title: string;
  text: string;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  blurb: string;
  category: StoryCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  /** cover gradient */
  colors: [string, string];
  emoji: string;
  chapters: Chapter[];
}

export const CATEGORY_LABEL: Record<StoryCategory, string> = {
  fables: 'Short tales',
  classics: 'Classics',
  scifi: 'Sci-fi',
  calm: 'Calm & mindful',
};

/*
 * All text is either public domain (Aesop, Carroll, Doyle, Austen — retold or
 * excerpted, ASCII punctuation so it can be typed on any keyboard) or written
 * for Keyflow.
 */
export const STORIES: Story[] = [
  {
    id: 'fables',
    title: 'Fables by the Fireside',
    author: 'Aesop, retold',
    blurb: 'Five timeless little stories with a lesson tucked inside each one.',
    category: 'fables',
    difficulty: 'easy',
    colors: ['#f59e0b', '#ef4444'],
    emoji: '🐢',
    chapters: [
      {
        title: 'The Tortoise and the Hare',
        text: `A hare once laughed at a tortoise for being so slow. "Do you ever get anywhere?" he asked with a mocking smile. "Yes," replied the tortoise, "and I get there sooner than you think. Let us have a race." The hare was amused, and the race began. He darted out of sight at once. Then, sure of an easy win, he lay down beside the road and fell fast asleep. The tortoise plodded on, steady and calm, never stopping. When the hare woke, he raced to the finish line, only to find the tortoise already there. Slow and steady wins the race.`,
      },
      {
        title: 'The Fox and the Grapes',
        text: `One hot summer day, a hungry fox saw a bunch of ripe grapes hanging from a high vine. "Just the thing to quench my thirst," he said. He stepped back, took a run, and jumped, but he missed the grapes. Again and again he tried, and each time the fruit stayed just out of reach. At last he sat down, tired and cross. "I am sure they are sour," he sniffed, and he walked away with his nose in the air. It is easy to despise what we cannot have.`,
      },
      {
        title: 'The Ant and the Grasshopper',
        text: `All summer long the grasshopper sang and played in the sun, while the ant worked hard, carrying grains of corn to her nest. "Why not join me in the song?" laughed the grasshopper. "I am storing food for the winter," said the ant. "You should do the same." The grasshopper only laughed. When winter came, the fields were covered in snow and the grasshopper had nothing to eat. Cold and hungry, he knocked at the ant's door. There is a time for work and a time for play, and wise folk prepare for both.`,
      },
      {
        title: 'The Lion and the Mouse',
        text: `A lion lay asleep in the forest when a tiny mouse ran across his nose. The lion woke with a roar and caught the mouse in his great paw. "Please let me go," squeaked the mouse. "Someday I may repay your kindness." The lion laughed at the idea, but he let the mouse go. Not long after, the lion was caught in a hunter's net and could not get free. The mouse heard his roars, hurried over, and gnawed through the ropes until the lion was free. No kindness, however small, is ever wasted.`,
      },
      {
        title: 'The Crow and the Pitcher',
        text: `A thirsty crow found a pitcher with a little water at the bottom. He pushed in his beak, but the neck was too narrow and the water too low. He tried to tip the pitcher over, but it was too heavy. Then he had an idea. He picked up small pebbles and dropped them, one by one, into the pitcher. With each stone the water rose a little higher, until at last the crow could drink his fill. Patience and a clever mind can solve many problems.`,
      },
    ],
  },
  {
    id: 'alice',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    blurb: 'Follow a White Rabbit down the rabbit-hole. Chapter one, in four pages.',
    category: 'classics',
    difficulty: 'medium',
    colors: ['#60a5fa', '#a78bfa'],
    emoji: '🐇',
    chapters: [
      {
        title: 'A Very Dull Afternoon',
        text: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?" So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.`,
      },
      {
        title: 'The White Rabbit',
        text: `There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.`,
      },
      {
        title: 'The Deep Well',
        text: `In another moment down went Alice after it, never once considering how in the world she was to get out again. The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well. Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next.`,
      },
      {
        title: 'Down, Down, Down',
        text: `First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. Down, down, down. There was nothing else to do, so Alice soon began talking to herself again. "Dinah'll miss me very much to-night, I should think!" (Dinah was the cat.) "I hope they'll remember her saucer of milk at tea-time. Dinah, my dear! I wish you were down here with me!"`,
      },
    ],
  },
  {
    id: 'holmes',
    title: 'A Scandal in Bohemia',
    author: 'Arthur Conan Doyle',
    blurb: 'Sherlock Holmes meets the one person who ever outwitted him.',
    category: 'classics',
    difficulty: 'hard',
    colors: ['#64748b', '#0f172a'],
    emoji: '🔎',
    chapters: [
      {
        title: 'The Woman',
        text: `To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position. He never spoke of the softer passions, save with a gibe and a sneer.`,
      },
      {
        title: 'The Reasoning Machine',
        text: `They were admirable things for the observer--excellent for drawing the veil from men's motives and actions. But for the trained reasoner to admit such intrusions into his own delicate and finely adjusted temperament was to introduce a distracting factor which might throw a doubt upon all his mental results. Grit in a sensitive instrument, or a crack in one of his own high-power lenses, would not be more disturbing than a strong emotion in a nature such as his. And yet there was but one woman to him, and that woman was the late Irene Adler, of dubious and questionable memory.`,
      },
      {
        title: 'Baker Street',
        text: `One night--it was on the twentieth of March, 1888--I was returning from a journey to a patient (for I had now returned to civil practice), when my way led me through Baker Street. As I passed the well-remembered door, which must always be associated in my mind with my wooing, and with the dark incidents of the Study in Scarlet, I was seized with a keen desire to see Holmes again, and to know how he was employing his extraordinary powers.`,
      },
    ],
  },
  {
    id: 'pride',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    blurb: 'The most famous opening line in English fiction, and the gossip that follows.',
    category: 'classics',
    difficulty: 'hard',
    colors: ['#f472b6', '#fb923c'],
    emoji: '🪶',
    chapters: [
      {
        title: 'A Truth Universally Acknowledged',
        text: `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.`,
      },
      {
        title: 'Netherfield Park',
        text: `"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?" Mr. Bennet replied that he had not. "But it is," returned she; "for Mrs. Long has just been here, and she told me all about it." Mr. Bennet made no answer. "Do you not want to know who has taken it?" cried his wife impatiently. "You want to tell me, and I have no objection to hearing it." This was invitation enough.`,
      },
    ],
  },
  {
    id: 'lighthouse',
    title: 'The Last Lighthouse',
    author: 'Keyflow originals',
    blurb: 'On the far rim of the Ashfall Belt, one keeper still lights the dark.',
    category: 'scifi',
    difficulty: 'medium',
    colors: ['#22d3ee', '#6366f1'],
    emoji: '🚀',
    chapters: [
      {
        title: 'Beacon',
        text: `On the far rim of the Ashfall Belt, where the stars grow thin and the maps run out, a single tower still burned. Mara had kept its light for eleven years. Every night she climbed the two hundred steps, wiped the dust from the great lens, and sent a slow white pulse into the dark for any ship that might be lost out there. Most nights, nobody answered. Mara kept the light anyway.`,
      },
      {
        title: 'A Faint Signal',
        text: `On the four thousandth night, the radio crackled. It was a thin, broken voice, half swallowed by static. "Tower, this is the Windrider. We are drifting and our engines are dead. Please tell me someone is listening." Mara's hands shook as she pressed the switch. "I am here," she said. "I have you. Stay calm, and keep your lights on. I will guide you home." Her heart beat faster than it had in years.`,
      },
      {
        title: 'The Long Night',
        text: `For six hours she worked without rest. She measured the drift of the little ship, checked the charts, and turned the great lens by hand to keep the beam steady. The cold crept up through the floor, and her fingers grew stiff, but she never let the light slip. Somewhere out in the dark, a pilot was watching that pulse, counting each flash like a heartbeat, and steering toward it.`,
      },
      {
        title: 'Landfall',
        text: `At dawn, the Windrider limped into the harbour with its hull scarred and its crew exhausted but alive. They climbed the two hundred steps to thank her, laughing and out of breath. "We nearly gave up," the pilot said. "Then we saw your light." Mara smiled and looked out over the quiet water. For the first time in eleven years, the tower did not feel so far away from everything.`,
      },
    ],
  },
  {
    id: 'slow-morning',
    title: 'Slow Morning',
    author: 'Keyflow originals',
    blurb: 'Three quiet pages to type when you want to slow down instead of speed up.',
    category: 'calm',
    difficulty: 'easy',
    colors: ['#34d399', '#0ea5e9'],
    emoji: '🌿',
    chapters: [
      {
        title: 'First Light',
        text: `The house is quiet, and the day has not yet started asking for anything. A soft light moves along the wall. Somewhere, a kettle begins to warm. Take one slow breath in, and let it go. There is no need to hurry. This small moment belongs to you.`,
      },
      {
        title: 'Tea by the Window',
        text: `The tea is hot, and steam curls up from the cup like a thin grey ribbon. Outside, the trees are moving gently, as if they too are in no rush. You do not have to solve anything right now. Watch the leaves, feel the warmth in your hands, and let each thought drift by like a cloud.`,
      },
      {
        title: 'The Open Door',
        text: `When you are ready, the day is waiting by the door, patient and kind. You can take it one step at a time. Pick one small thing to do well. Then another. That is all a good day really is: a string of small things, done with care, one after the other.`,
      },
    ],
  },
];

export function getStory(id: string | undefined): Story | undefined {
  return STORIES.find((s) => s.id === id);
}

export function storyChars(s: Story): number {
  return s.chapters.reduce((a, c) => a + c.text.length, 0);
}

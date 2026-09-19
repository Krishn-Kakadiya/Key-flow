export type StoryCategory = 'fables' | 'classics' | 'scifi' | 'calm' | 'cricket' | 'adventure' | 'growth';

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
  cricket: 'Cricket',
  adventure: 'Adventure',
  growth: 'Growth & grit',
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
      {
        title: 'A Single Man of Large Fortune',
        text: `"Is he married or single?" "Oh! Single, my dear, to be sure! A single man of large fortune; four or five thousand a year. What a fine thing for our girls!" "How so? How can it affect them?" "My dear Mr. Bennet," replied his wife, "how can you be so tiresome! You must know that I am thinking of his marrying one of them."`,
      },
      {
        title: 'Design or Nonsense',
        text: `"Is that his design in settling here?" "Design! Nonsense, how can you talk so! But it is very likely that he may fall in love with one of them, and therefore you must visit him as soon as he comes." "I see no occasion for that. You and the girls may go, or you may send them by themselves, which perhaps will be still better, for as you are as handsome as any of them, Mr. Bingley may like you the best of the party."`,
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
      {
        title: 'Small Things',
        text: `Wash the cup slowly. Feel the warm water on your hands. Open the window and let the cool air come in. These tiny actions do not look important, but they are the stitches that hold a peaceful day together. Notice how your shoulders drop when you stop rushing. Notice how the room seems larger when you are not hurrying through it, and how quiet can feel like a friendly guest.`,
      },
      {
        title: 'A Quiet Ending',
        text: `As the morning turns into noon, the world grows louder, and that is perfectly fine. You have already given yourself something valuable: a calm beginning. Carry it with you like a small smooth stone in your pocket. When the day becomes heavy, touch it, remember this stillness, and take one long, slow breath. You can always come back here, whenever you need to, and the kettle will always be warm.`,
      },
    ],
  },
  {
    id: 'last-over',
    title: 'The Last Over',
    author: 'Keyflow originals',
    blurb: 'Twelve runs, six balls, and a whole village holding its breath.',
    category: 'cricket',
    difficulty: 'medium',
    colors: ['#22c55e', '#065f46'],
    emoji: '🏏',
    chapters: [
      {
        title: 'Twelve to Win',
        text: `The sun had dropped behind the old tamarind tree, and the whole village had crowded around the boundary rope. Twelve runs to win, six balls to go. Meera tightened her gloves and looked at the scoreboard, a plank of wood with numbers painted in white. Her captain patted her shoulder. "Just watch the ball," he said. "Everything else is noise." She nodded, took her guard, and looked up at the bowler, who was smiling like someone who had already won.`,
      },
      {
        title: 'The First Ball',
        text: `The bowler ran in fast and pitched it short. Meera swayed back and let it fly past her chin, and the wicketkeeper grunted as he caught it. A few spectators groaned. Five balls left, twelve runs needed. She stepped out of her crease, tapped the pitch with her bat, and took a slow breath. The next ball was fuller, right in her arc. She swung through the line and heard the sweet sound of wood meeting leather. It raced to the boundary for four.`,
      },
      {
        title: 'Nerves',
        text: `Eight to win from four balls. The noise around the ground grew louder, but Meera heard only her own heartbeat. The bowler changed his angle and sent down a slower ball, dipping late. She was early, and the ball thudded into her pads. The appeal was loud, and every head turned to the umpire. He shook his head slowly. Not out. The crowd erupted, and Meera let out a breath she had been holding for what felt like an hour.`,
      },
      {
        title: 'The Winning Shot',
        text: `Meera ran a hard two off the next ball, and then a thick edge raced past the slip fielder for four. Two runs to win from the last ball. The captain shouted something from the pavilion, but she did not hear a word. The bowler ran in, and she saw the ball leave his hand, pitching just outside off stump. She waited, waited, and then opened her shoulders. The ball soared over cover and crossed the rope. The whole village roared, and Meera raised her bat to the sky.`,
      },
    ],
  },
  {
    id: 'gully-to-stadium',
    title: 'Gully to Stadium',
    author: 'Keyflow originals',
    blurb: 'A tape ball, a brick for stumps, and a boy who refuses to stop dreaming.',
    category: 'cricket',
    difficulty: 'easy',
    colors: ['#f59e0b', '#b45309'],
    emoji: '🧢',
    chapters: [
      {
        title: 'The Tape Ball',
        text: `Every evening, the narrow lane behind Arjun's house turned into a cricket ground. A brick was the stumps, a wall was the boundary, and a tennis ball wrapped in black tape was the match ball. Arjun was the youngest player, so he always fielded first. But he watched every shot, every bowling action, and every trick the older boys used. At night, he practised the same forward defence in front of the mirror until his mother told him to sleep.`,
      },
      {
        title: 'The Old Coach',
        text: `One Sunday, an old man in a faded cap stopped to watch the game. He leaned on his walking stick and said nothing for an hour. Then he called Arjun over. "Your feet are slow, but your eyes are quick," he said. "Come to the ground behind the school tomorrow morning. Bring your own bat if you have one." Arjun did not have a bat, but he had a whole night to figure it out, and he smiled all the way home.`,
      },
      {
        title: 'Leather and Sweat',
        text: `The leather ball was harder than Arjun expected. It stung his fingers and bounced in ways the tennis ball never did. For a whole month he practised only one thing: playing straight. The coach threw hundreds of balls and said the same words each time. "Head still, bat straight, eyes on the ball." Arjun's hands blistered, his legs ached, and twice he wanted to quit. But every morning, he was there before the coach arrived.`,
      },
      {
        title: 'The Big Day',
        text: `The district trials came in the cold month of December. Two hundred boys queued up for a chance at just twelve places. When Arjun walked out to bat, his knees shook. He remembered the coach's voice, took a deep breath, and played the first ball straight back to the bowler. Then he played the next one straight too. By the end of the day, his name was on the list. The boy from the lane had taken his first step toward the stadium.`,
      },
    ],
  },
  {
    id: 'debut-at-dawn',
    title: 'Debut at Dawn',
    author: 'Keyflow originals',
    blurb: 'Cap number 312, thirty thousand fans, and one very nervous fast bowler.',
    category: 'cricket',
    difficulty: 'hard',
    colors: ['#38bdf8', '#1e3a8a'],
    emoji: '🏟️',
    chapters: [
      {
        title: 'Cap Number 312',
        text: `Rohan woke before the alarm, his heart already racing. Today, in front of thirty thousand people, he would receive his first Test cap. He had dreamed of this moment since childhood, yet now that it had arrived, his hands felt cold and his mouth felt dry. The team bus rolled through the quiet streets of the city, and through the window he could see the floodlights of the stadium glowing against the pale morning sky.`,
      },
      {
        title: 'The Dressing Room',
        text: `Inside the dressing room, senior players moved calmly, taping bats and joking about breakfast. The captain walked over, handed Rohan a neatly folded cap, and said, "Nobody remembers who was nervous. They remember who stayed brave." Rohan pulled the cap over his head. It fitted perfectly, as if it had always belonged there. A bell rang somewhere in the corridor, and the team walked out together toward the roar of the crowd.`,
      },
      {
        title: 'The First Wicket',
        text: `The ball felt heavier in his hand than it ever had in the nets. Rohan took a long run-up, gathered his thoughts, and bowled a good length just outside off stump. The batter pushed forward, the ball nipped away, and the edge carried cleanly to the slips. The fielder held on. For a second, there was complete silence. Then the stadium exploded, his teammates ran towards him, and Rohan finally remembered to breathe.`,
      },
      {
        title: 'Stumps',
        text: `By the close of play, his legs were heavy and his voice was hoarse from shouting. In the quiet dressing room, he sat alone with the cap in his lap, turning it slowly in his hands. His phone was full of messages, but he read only one, from his old coach: "I always knew." Rohan smiled, closed his eyes, and thought of the narrow lane behind his house, where all of it had begun, with a brick, a wall, and a taped tennis ball.`,
      },
    ],
  },
  {
    id: 'lantern-trail',
    title: 'The Lantern Trail',
    author: 'Keyflow originals',
    blurb: 'A brass compass, a tiny lantern, and a map that leads to a secret river.',
    category: 'adventure',
    difficulty: 'medium',
    colors: ['#fb923c', '#7c2d12'],
    emoji: '🧭',
    chapters: [
      {
        title: 'The Old Map',
        text: `In the attic of her grandfather's house, Nisha found a wooden chest wrapped in cobwebs. Inside lay a faded map, a brass compass, and a tiny lantern that still smelled of oil. On the back of the map, in shaky ink, were five words: Follow the lantern to the river. She read them twice. Her grandfather had never spoken of any river, yet the map showed one winding through the hills behind the village.`,
      },
      {
        title: 'Into the Hills',
        text: `At sunrise, Nisha packed bread, water, and the little lantern into her bag and set off. The path climbed through pine trees and over slippery stones. Halfway up, the mist rolled in so thickly that she could barely see her own boots. She lit the lantern, and to her surprise, its flame leaned gently to the left, as if pulled by an invisible hand. She turned left, and the mist began to thin.`,
      },
      {
        title: 'The Hidden River',
        text: `The flame led her through a narrow gap between two cliffs, and there, hidden from the world, ran a silver river under a roof of glowing ferns. Nisha stood still for a long time, listening to the water. On a flat rock beside the bank, she found a second small chest. Inside was a folded letter in her grandfather's handwriting, and a single iron key with a ribbon tied around it.`,
      },
      {
        title: 'The Letter',
        text: `The letter said: "Every family needs a secret place where the noise of the world cannot follow. I found this one when I was your age. Now it is yours. The key opens the little cabin beyond the waterfall. Keep it safe, and keep it kind." Nisha folded the letter, held the key tightly, and smiled. Somewhere behind her, the lantern flame flickered once, as if her grandfather had winked.`,
      },
    ],
  },
  {
    id: 'island-of-tides',
    title: 'Island of Tides',
    author: 'Keyflow originals',
    blurb: 'Two friends, one storm, and a very small island in a very big sea.',
    category: 'adventure',
    difficulty: 'easy',
    colors: ['#2dd4bf', '#0369a1'],
    emoji: '🏝️',
    chapters: [
      {
        title: 'Washed Ashore',
        text: `The storm had thrown the little fishing boat onto a beach of white sand. Kabir crawled out, coughing and soaked, and looked around. Palm trees swayed above him, and the sea, now calm, sparkled as if nothing had happened. His radio was broken, his food was gone, and his best friend Tara was nowhere to be seen. He took a deep breath and shouted her name across the empty beach.`,
      },
      {
        title: 'Footprints',
        text: `Something was moving in the trees. Kabir grabbed a strong branch and crept forward, ready for anything. Out from the leaves stepped Tara, holding a coconut in each hand and grinning from ear to ear. "I found water," she said, "and I found a path." They hugged, laughed with relief, and shared the coconuts. Then they followed the footprints in the sand, which led away from the beach toward the middle of the island.`,
      },
      {
        title: 'The Signal Fire',
        text: `By afternoon, they reached the highest rock on the island. From the top, the sea stretched out in every direction, empty and blue. They gathered dry wood, stacked it carefully, and lit a fire using the glass from Kabir's broken watch and the strong sun. A thick column of smoke rose into the sky. All night they took turns feeding the fire, whispering stories to stay awake.`,
      },
      {
        title: 'A Sail on the Horizon',
        text: `At dawn, Tara shook Kabir awake and pointed with a trembling finger. A white sail was growing larger on the horizon. It was a rescue boat, with three fishermen waving from the deck. Kabir and Tara jumped up and down, shouting with joy. As the island shrank behind them, Kabir promised himself one thing: whatever happened in life, he would face it with a good friend beside him.`,
      },
    ],
  },
  {
    id: 'one-more-rep',
    title: 'One More Rep',
    author: 'Keyflow originals',
    blurb: 'Five push-ups, a battered notebook, and the quiet power of showing up.',
    category: 'growth',
    difficulty: 'easy',
    colors: ['#a78bfa', '#4c1d95'],
    emoji: '💪',
    chapters: [
      {
        title: 'Five Push-Ups',
        text: `Dev stood in front of the gym mirror, out of breath after only five push-ups. Everyone around him seemed stronger, faster, and more confident. He felt like leaving right then and never coming back. But he remembered something his father used to say: progress is quiet. You do not see it today, but one day you look back and realise how far you have walked. So he took a sip of water, got down on the floor, and did one more.`,
      },
      {
        title: 'Small Wins',
        text: `The first week, he could do six push-ups. The second week, eight. He wrote each number in a battered notebook and stuck it on his wall. It was not impressive, and nobody clapped, but the numbers were his. On the days he felt lazy, he made a deal with himself: just ten minutes. Most days, ten minutes turned into an hour, because starting was always the hardest part of the whole job.`,
      },
      {
        title: 'The Plateau',
        text: `In the fifth week, the numbers stopped growing. Ten push-ups, then ten again, then ten once more. Dev felt frustrated and wondered if his effort meant anything at all. His coach only shrugged. "Every builder hits the same wall," he said. "The people who win are the ones who keep laying bricks when it feels pointless." So Dev kept showing up, even when the notebook looked boring.`,
      },
      {
        title: 'Twenty-One',
        text: `Two months later, on an ordinary Tuesday, Dev finished a set and counted out loud. Twenty-one push-ups. He stayed on the floor for a moment, laughing quietly to himself. Nobody in the gym noticed, and that was perfectly fine. He got up, opened his notebook, and wrote the number in large letters. Underneath it, he added a new line: tomorrow, twenty-two. The mirror looked the same, but the boy in it did not.`,
      },
    ],
  },
  {
    id: 'long-way-up',
    title: 'The Long Way Up',
    author: 'Keyflow originals',
    blurb: 'A first-time climber learns that fear is only a loud voice.',
    category: 'growth',
    difficulty: 'medium',
    colors: ['#f472b6', '#9d174d'],
    emoji: '🏔️',
    chapters: [
      {
        title: 'Base Camp',
        text: `Ira had never climbed anything taller than a school staircase, yet here she was at the foot of a great mountain with a heavy backpack and a stubborn heart. The guide, an old woman named Dolma, looked at her boots and smiled. "Nobody reaches the top by looking at the top," she said. "You only ever need to look at the next ten steps." Ira laughed, tightened her straps, and took the first step.`,
      },
      {
        title: 'Thin Air',
        text: `By noon, the air had grown thin and every breath felt like a small victory. Ira's legs burned, and her mind kept whispering that she should turn back. She stopped, leaned on her walking pole, and stared at the endless slope above. Dolma waited patiently beside her. "Fear is just a loud voice," she said. "It does not make the mountain any taller." Ira drank some water, counted ten steps, and moved on.`,
      },
      {
        title: 'The Storm',
        text: `In the afternoon, dark clouds gathered, and a cold wind began to howl across the ridge. They sheltered behind a boulder, wrapped in blankets, sharing a flask of hot tea. Ira shivered and wondered why anyone would choose this. Dolma pointed at the clouds. "Storms pass," she said. "They always pass. Your only task is to be warm and stubborn until they do." Ira nodded, and by evening the sky had cleared.`,
      },
      {
        title: 'The Summit',
        text: `They reached the top at sunrise. Below them, a sea of clouds glowed gold and pink, and the whole world felt quiet and enormous. Ira cried a little, and she was not ashamed of it. She realised that the mountain had never been the real challenge. The real challenge had been the small voice inside her that said she could not. She smiled at Dolma, and together they watched the sun climb.`,
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

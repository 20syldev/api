import { random, randomNumber } from './utils.js';

/**
 * Generate a random username with related information
 *
 * @returns {Object} Object containing username and component parts
 */
export default function username() {
    const adj = ['Happy', 'Silly', 'Clever', 'Creative', 'Brave', 'Gentle', 'Kind', 'Funny', 'Wise', 'Charming', 'Sincere', 'Resourceful', 'Patient', 'Energetic', 'Adventurous', 'Ambitious', 'Courageous', 'Courteous', 'Determined'];
    const ani = ['Cat', 'Dog', 'Tiger', 'Elephant', 'Monkey', 'Penguin', 'Dolphin', 'Lion', 'Bear', 'Fox', 'Owl', 'Giraffe', 'Zebra', 'Koala', 'Rabbit', 'Squirrel', 'Panda', 'Horse', 'Wolf', 'Eagle'];
    const job = ['Writer', 'Artist', 'Musician', 'Explorer', 'Scientist', 'Engineer', 'Athlete', 'Chef', 'Doctor', 'Teacher', 'Lawyer', 'Entrepreneur', 'Actor', 'Dancer', 'Photographer', 'Architect', 'Pilot', 'Designer', 'Journalist', 'Veterinarian'];

    const nombre = randomNumber(0, 99);
    const choix = {
        adj_num: () => random(adj) + nombre,
        ani_num: () => random(ani) + nombre,
        pro_num: () => random(job) + nombre,
        adj_ani: () => random(adj) + random(ani),
        adj_ani_num: () => random(adj) + random(ani) + nombre,
        adj_pro: () => random(adj) + random(job),
        pro_ani: () => random(job) + random(ani),
        pro_ani_num: () => random(job) + random(ani) + nombre
    };

    return {
        username: choix[random(Object.keys(choix))](),
        number: nombre,
        adjective: random(adj),
        animal: random(ani),
        job: random(job)
    };
}
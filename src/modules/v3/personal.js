import { random, randomNumber } from './utils.js';

/**
 * Generate random personal information
 *
 * @returns {Object} Comprehensive personal profile with contact info, financial data, and more
 */
export default function personal() {
    const people = [
        { name: 'John Doe', social: 'john_doe', email: 'john@example.com', country: 'US' },
        { name: 'Jane Martin', social: 'jane_martin', email: 'jane@example.com', country: 'FR' },
        { name: 'Michael Johnson', social: 'mike_johnson', email: 'michael@example.com', country: 'UK' },
        { name: 'Emily Davis', social: 'emily_davis', email: 'emily@example.com', country: 'ES' },
        { name: 'Alexis Barbos', social: 'alexis_barbos', email: 'alexis@example.com', country: 'DE' },
        { name: 'Sarah Williams', social: 'sarah_williams', email: 'sarah@example.com', country: 'IT' },
        { name: 'Daniel Brown', social: 'daniel_brown', email: 'daniel@example.com', country: 'JP' },
        { name: 'Sophia Wilson', social: 'sophia_wilson', email: 'sophia@example.com', country: 'BR' },
        { name: 'James Taylor', social: 'james_taylor', email: 'james@example.com', country: 'CA' },
        { name: 'Olivia Thomas', social: 'olivia_thomas', email: 'olivia@example.com', country: 'AU' }
    ];

    const countries = {
        US: { tel: '123-456-7890', code: '1', lang: 'English' },
        FR: { tel: '06 78 90 12 34', code: '33', lang: 'French' },
        UK: { tel: '7911 123456', code: '44', lang: 'English' },
        ES: { tel: '678 901 234', code: '34', lang: 'Spanish' },
        DE: { tel: '163 555 1584', code: '49', lang: 'German' },
        IT: { tel: '345 678 9012', code: '39', lang: 'Italian' },
        JP: { tel: '080-1234-5678', code: '81', lang: 'Japanese' },
        BR: { tel: '(11) 98765-4321', code: '55', lang: 'Portuguese' },
        CA: { tel: '416-123-4567', code: '1', lang: 'English' },
        AU: { tel: '0412 345 678', code: '61', lang: 'English' }
    };

    const jobs = ['Writer', 'Artist', 'Musician', 'Explorer', 'Scientist', 'Engineer', 'Athlete', 'Doctor'];
    const hobbies = ['Reading', 'Traveling', 'Gaming', 'Cooking', 'Fitness', 'Music', 'Photography', 'Writing'];
    const cities = ['New York', 'Paris', 'London', 'Madrid', 'Berlin', 'Rome', 'Tokyo', 'Los Angeles', 'Sydney', 'São Paulo', 'Toronto'];
    const streets = ['Main St', '2nd Ave', 'Broadway', 'Park Lane', 'Elm St', 'Sunset Blvd', 'Maple St', 'Highland Rd'];

    const card = Array.from({ length: 4 }, () => randomNumber(1000, 9999)).join(' ');
    const cvc = randomNumber(100, 999);
    const expiration = `${String(randomNumber(1, 12)).padStart(2, '0')}/${(new Date().getFullYear() + randomNumber(0, 3)).toString().slice(-2)}`;

    const person = random(people);
    const social = person.social;
    const country = person.country;
    const phone = countries[country].tel;
    const lang = countries[country].lang;

    const age = randomNumber(18, 67);
    const birthday = new Date(Date.now() - randomNumber(18, 67) * 365.25 * 24 * 60 * 60 * 1000).toISOString();

    let emergencyContacts = [];
    let yearIncome = randomNumber(20000, 100000);
    let subscriptions = [];
    let pets = [];
    let vehicles = [];
    let civilStatus = 'Single';
    let children = 0;

    if (age >= 21 && Math.random() > 0.7) civilStatus = 'Married';

    if (civilStatus === 'Married' && age >= 25) children = randomNumber(0, 3);

    while (emergencyContacts.length < randomNumber(1, 3)) {
        let emergencyContact = random(people);
        while (
            emergencyContact.email === person.email ||
            emergencyContacts.some(e => e.email === emergencyContact.email)
        ) {
            emergencyContact = random(people);
        }
        const emergencyPhone = `${randomNumber(100, 999)}-${randomNumber(100, 999)}-${randomNumber(1000, 9999)}`;
        emergencyContacts.push({
            name: emergencyContact.name,
            relationship: random(['Spouse', 'Parent', 'Sibling', 'Friend']),
            phone: `+${countries[country].code} ${emergencyPhone}`
        });
    }

    while (subscriptions.length < randomNumber(1, 3)) {
        let subscription = random(['Netflix', 'Spotify', 'Amazon Prime', 'Disney+', 'Hulu']);
        if (!subscriptions.includes(subscription)) subscriptions.push(subscription);
    }

    while (pets.length < randomNumber(1, 3)) {
        let pet = random(['Dog', 'Cat', 'Fish', 'Bird', 'None']);
        if (!pets.includes(pet)) pets.push(pet);
    }

    while (vehicles.length < randomNumber(1, 3)) {
        let vehicle = random(['Car', 'Bike', 'Motorcycle', 'Bus', 'None']);
        if (!vehicles.includes(vehicle)) vehicles.push(vehicle);
    }

    return {
        name: person.name,
        email: person.email,
        localisation: country,
        phone: `+${countries[country].code} ${phone}`,
        job: random(jobs),
        hobbies: random(hobbies),
        language: lang,
        card,
        cvc,
        expiration,
        address: `${randomNumber(1, 9999)} ${random(streets)}, ${random(cities)}`,
        birthday,
        civil_status: civilStatus,
        children,
        vehicle: vehicles,
        social_profiles: {
            twitter: `@${social}`,
            facebook: `facebook.com/${social}`,
            linkedin: `linkedin.com/in/${social}`,
            instagram: `instagram.com/${social}`
        },
        year_income: `${yearIncome} USD/year`,
        month_income: `${(yearIncome / 12).toFixed(2)} USD/month`,
        education: random(['High School', 'Bachelor\'s', 'Master\'s', 'PhD']),
        work_experience: `${randomNumber(0, 20)} years`,
        health_status: random(['Healthy', 'Minor Issues', 'Chronic Conditions']),
        emergency_contacts: emergencyContacts,
        subscriptions,
        pets,
    };
}
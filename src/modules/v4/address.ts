import { MAX_ADDRESS_COUNT } from '../../constants.js';
import { random, randomNumber } from '../../utils/helpers.js';

interface CountryData {
    name: string;
    streetTypes: string[];
    streetNames: string[];
    cities: string[];
    regions: string[];
    zipFormat: () => string;
}

function randomChar(chars: string): string {
    return chars[Math.floor(Math.random() * chars.length)]!;
}

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const countries: Record<string, CountryData> = {
    fr: {
        name: 'France',
        streetTypes: ['Rue', 'Avenue', 'Boulevard', 'Allée', 'Impasse', 'Place', 'Chemin', 'Route', 'Voie', 'Passage'],
        streetNames: [
            'de la Paix',
            'Victor Hugo',
            'Jean Jaurès',
            'de la République',
            'du Général de Gaulle',
            'de la Liberté',
            'des Fleurs',
            'du Moulin',
            'de la Forêt',
            'des Lilas',
            'du Château',
            'de la Mairie',
            'de la Gare',
            'du Commerce',
            'de la Fontaine',
            'de la Croix',
            'des Vignes',
            'du Marché',
            "de l'Église",
            'des Acacias',
        ],
        cities: [
            'Paris',
            'Lyon',
            'Marseille',
            'Toulouse',
            'Nice',
            'Nantes',
            'Strasbourg',
            'Montpellier',
            'Bordeaux',
            'Lille',
            'Rennes',
            'Reims',
            'Le Havre',
            'Saint-Étienne',
            'Toulon',
            'Grenoble',
            'Dijon',
            'Angers',
            'Nîmes',
            'Villeurbanne',
        ],
        regions: [
            'Île-de-France',
            'Auvergne-Rhône-Alpes',
            "Provence-Alpes-Côte d'Azur",
            'Occitanie',
            'Hauts-de-France',
            'Nouvelle-Aquitaine',
            'Grand Est',
            'Pays de la Loire',
            'Bretagne',
            'Normandie',
            'Bourgogne-Franche-Comté',
            'Centre-Val de Loire',
        ],
        zipFormat: () => String(randomNumber(10000, 99999)).padStart(5, '0'),
    },
    us: {
        name: 'United States',
        streetTypes: ['Street', 'Avenue', 'Boulevard', 'Drive', 'Road', 'Lane', 'Court', 'Way', 'Place', 'Circle'],
        streetNames: [
            'Main',
            'Oak',
            'Maple',
            'Cedar',
            'Pine',
            'Elm',
            'Washington',
            'Lincoln',
            'Park',
            'Lake',
            'Hill',
            'River',
            'Sunset',
            'Forest',
            'Meadow',
            'Valley',
            'Highland',
            'Willow',
            'Spring',
            'Church',
        ],
        cities: [
            'New York',
            'Los Angeles',
            'Chicago',
            'Houston',
            'Phoenix',
            'Philadelphia',
            'San Antonio',
            'San Diego',
            'Dallas',
            'San Jose',
            'Austin',
            'Jacksonville',
            'Fort Worth',
            'Columbus',
            'Charlotte',
            'Indianapolis',
            'San Francisco',
            'Seattle',
            'Denver',
            'Nashville',
        ],
        regions: [
            'California',
            'Texas',
            'Florida',
            'New York',
            'Pennsylvania',
            'Illinois',
            'Ohio',
            'Georgia',
            'North Carolina',
            'Michigan',
            'New Jersey',
            'Virginia',
            'Washington',
            'Arizona',
            'Massachusetts',
            'Tennessee',
            'Indiana',
            'Colorado',
            'Missouri',
            'Maryland',
        ],
        zipFormat: () => String(randomNumber(10000, 99999)).padStart(5, '0'),
    },
    uk: {
        name: 'United Kingdom',
        streetTypes: ['Street', 'Road', 'Avenue', 'Lane', 'Close', 'Drive', 'Way', 'Court', 'Grove', 'Place'],
        streetNames: [
            'High',
            'Church',
            'Station',
            'Park',
            'Manor',
            'Mill',
            'Victoria',
            'King',
            'Queen',
            'Albert',
            'George',
            'York',
            'Oxford',
            'Cambridge',
            'Windsor',
            'Richmond',
            'Elm',
            'Oak',
            'Ash',
            'Rose',
        ],
        cities: [
            'London',
            'Birmingham',
            'Manchester',
            'Glasgow',
            'Liverpool',
            'Bristol',
            'Sheffield',
            'Leeds',
            'Edinburgh',
            'Leicester',
            'Coventry',
            'Bradford',
            'Cardiff',
            'Belfast',
            'Nottingham',
            'Kingston upon Hull',
            'Newcastle',
            'Stoke-on-Trent',
            'Southampton',
            'Derby',
        ],
        regions: [
            'England',
            'Scotland',
            'Wales',
            'Northern Ireland',
            'Greater London',
            'South East',
            'North West',
            'East of England',
            'West Midlands',
            'South West',
            'Yorkshire',
            'East Midlands',
            'North East',
        ],
        zipFormat: () =>
            `${randomChar(ALPHA)}${randomChar(ALPHA)}${randomNumber(1, 9)} ${randomNumber(1, 9)}${randomChar(ALPHA)}${randomChar(ALPHA)}`,
    },
    de: {
        name: 'Germany',
        streetTypes: ['Straße', 'Allee', 'Weg', 'Platz', 'Gasse', 'Ring', 'Damm', 'Ufer', 'Stieg', 'Pfad'],
        streetNames: [
            'Haupt',
            'Bahnhof',
            'Schul',
            'Kirch',
            'Garten',
            'Berg',
            'Wald',
            'Wiesen',
            'Tal',
            'See',
            'Bismarck',
            'Goethe',
            'Schiller',
            'Kant',
            'Hegel',
            'Mozart',
            'Beethoven',
            'Bach',
            'Brahms',
            'Handel',
        ],
        cities: [
            'Berlin',
            'Hamburg',
            'Munich',
            'Cologne',
            'Frankfurt',
            'Stuttgart',
            'Düsseldorf',
            'Leipzig',
            'Dortmund',
            'Essen',
            'Bremen',
            'Dresden',
            'Hanover',
            'Nuremberg',
            'Duisburg',
            'Bochum',
            'Wuppertal',
            'Bielefeld',
            'Bonn',
            'Münster',
        ],
        regions: [
            'Bayern',
            'Nordrhein-Westfalen',
            'Baden-Württemberg',
            'Niedersachsen',
            'Hessen',
            'Sachsen',
            'Rheinland-Pfalz',
            'Berlin',
            'Schleswig-Holstein',
            'Brandenburg',
            'Sachsen-Anhalt',
            'Thüringen',
            'Hamburg',
            'Mecklenburg-Vorpommern',
            'Bremen',
            'Saarland',
        ],
        zipFormat: () => String(randomNumber(10000, 99999)).padStart(5, '0'),
    },
    es: {
        name: 'Spain',
        streetTypes: [
            'Calle',
            'Avenida',
            'Plaza',
            'Paseo',
            'Rambla',
            'Carretera',
            'Camino',
            'Vía',
            'Travesía',
            'Callejón',
        ],
        streetNames: [
            'Mayor',
            'Real',
            'Nueva',
            'del Sol',
            'de la Luna',
            'del Rey',
            'de la Reina',
            'del Mar',
            'de la Paz',
            'de la Victoria',
            'Cervantes',
            'Goya',
            'Velázquez',
            'Picasso',
            'Dalí',
            'de España',
            'de Colón',
            'de la Constitución',
            'del Prado',
            'de las Flores',
        ],
        cities: [
            'Madrid',
            'Barcelona',
            'Valencia',
            'Seville',
            'Zaragoza',
            'Málaga',
            'Murcia',
            'Palma',
            'Las Palmas',
            'Bilbao',
            'Alicante',
            'Córdoba',
            'Valladolid',
            'Vigo',
            'Gijón',
            'Hospitalet',
            'A Coruña',
            'Granada',
            'Vitoria',
            'Elche',
        ],
        regions: [
            'Andalucía',
            'Cataluña',
            'Madrid',
            'Comunidad Valenciana',
            'Galicia',
            'Castilla y León',
            'País Vasco',
            'Castilla-La Mancha',
            'Canarias',
            'Murcia',
            'Aragón',
            'Extremadura',
            'Asturias',
            'Navarra',
            'Cantabria',
            'La Rioja',
            'Baleares',
        ],
        zipFormat: () => String(randomNumber(10000, 52999)).padStart(5, '0'),
    },
};

const countryKeys = Object.keys(countries);

export interface Address {
    street: string;
    city: string;
    zip: string;
    state: string;
    country: string;
    countryCode: string;
}

export interface AddressResult {
    addresses: Address[];
}

/**
 * Generates one or more fictional postal addresses for a given country.
 *
 * @param countryCode - Country code: "fr", "us", "uk", "de", or "es" (random if omitted)
 * @param count - Number of addresses to generate (1–10)
 * @returns Array of addresses with street, city, zip, state, country, and countryCode
 * @throws Error if the country code is invalid or count is out of range
 */
export default function address(countryCode?: string, count: number = 1): AddressResult {
    if (count < 1 || count > MAX_ADDRESS_COUNT) {
        throw new Error(`Count must be between 1 and ${MAX_ADDRESS_COUNT}`);
    }

    const code = (countryCode ?? random(countryKeys)).toLowerCase();
    if (!countries[code]) {
        throw new Error(`Unknown country code "${code}". Supported: ${countryKeys.join(', ')}`);
    }

    const data = countries[code]!;

    const addresses: Address[] = Array.from({ length: count }, () => ({
        street: `${randomNumber(1, 200)} ${random(data.streetTypes)} ${random(data.streetNames)}`,
        city: random(data.cities),
        zip: data.zipFormat(),
        state: random(data.regions),
        country: data.name,
        countryCode: code.toUpperCase(),
    }));

    return { addresses };
}

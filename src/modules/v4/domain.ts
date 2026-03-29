import { random, genIP } from './utils.js';

export default function domain(): Record<string, unknown> {
    const subdomains = [
        'fr.',
        'en.',
        'docs.',
        'api.',
        'projects.',
        'app.',
        'web.',
        'info.',
        'dev.',
        'shop.',
        'blog.',
        'support.',
        'mail.',
        'forum.',
    ];
    const domains = [
        'example',
        'site',
        'test',
        'demo',
        'page',
        'store',
        'portfolio',
        'platform',
        'hub',
        'network',
        'service',
        'cloud',
        'solutions',
        'company',
    ];
    const tlds = [
        '.com',
        '.fr',
        '.eu',
        '.dev',
        '.net',
        '.org',
        '.io',
        '.tech',
        '.biz',
        '.info',
        '.co',
        '.app',
        '.store',
        '.online',
        '.shop',
        '.tv',
    ];

    const domainName = `${random(domains)}${random(tlds)}`;
    const fulldomain = `${random(subdomains)}${domainName}`;

    const ips = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, genIP);
    const dns = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, genIP);

    return {
        domain: domainName,
        full_domain: fulldomain,
        ip_address: ips,
        ssl_certified: Math.random() > 0.5,
        hosting_provider: random(['AWS', 'Bluehost', 'DigitalOcean', 'GitHub', 'HostGator', 'Render', 'SiteGround']),
        dns_servers: dns,
        dns_provider: random(['AWS Route 53', 'Cloudflare', 'GoDaddy', 'Google DNS', 'Namecheap']),
        traffic: `${Math.floor(Math.random() * 10000)} visits/day`,
        seo_score: Math.floor(Math.random() * 100),
        page_rank: Math.floor(Math.random() * 10),
        country: random(['Australia', 'Canada', 'France', 'Germany', 'India', 'Japan', 'UK', 'USA']),
        website_type: random(['Blog', 'Community', 'Corporate', 'Educational', 'E-commerce', 'Personal', 'Portfolio']),
        random_name: domainName.split('.')[0],
        random_subdomain: fulldomain.split('.')[0],
        random_tld: domainName.split('.').pop(),
        backlinks_count: Math.floor(Math.random() * 1000),
        creation_date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
        expiration_date: new Date(Date.now() + Math.floor(Math.random() * 10000000000)).toISOString(),
    };
}

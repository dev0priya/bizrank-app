import * as dotenv from 'dotenv';
dotenv.config();

export const Config = {
    APIFY_API_TOKEN: process.env.APIFY_API_TOKEN || '',
    DATABASE_URL: process.env.DATABASE_URL || '',
    APIFY_ACTOR_ID: "compass/crawler-google-places",
    REQUIRED_FIELDS: [
        "title",
        "categoryName",
        "address",
        "neighborhood",
        "city",
        "state",
        "countryCode",
        "phoneUnformatted",
        "website",
        "url",
        "totalScore",
        "reviewsCount",
        "location"
    ]
};

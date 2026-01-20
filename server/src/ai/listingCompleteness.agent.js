import { AIAgent } from './base.agent.js';

export class ListingCompletenessAgent extends AIAgent {
    constructor() {
        super('ListingCompletenessAgent');
    }

    async execute(input) {
        const { listing } = input;
        
        const suggestions = [];
        let score = 0;
        const weights = {
            images: 30,
            description: 20,
            rules: 15,
            facilities: 15,
            location: 20
        };

        // Images Check
        if (listing.images?.length >= 5) score += weights.images;
        else if (listing.images?.length >= 3) score += weights.images / 2;
        else suggestions.push("Add at least 5 photos for better visibility.");

        // Description Check
        if (listing.description?.length > 100) score += weights.description;
        else suggestions.push("Description is too short. Add more details about the vibe.");

        // Rules Check
        if (listing.rules && Object.keys(listing.rules).length > 0) score += weights.rules;
        else suggestions.push("Define house rules clearly.");

        // Facilities Check
        if (listing.facilities?.length >= 3) score += weights.facilities;
        else suggestions.push("Select more facilities (e.g. WiFi, Water).");

        // Location Check
        if (listing.location?.address && listing.location?.coordinates) score += weights.location;

        return {
            score,
            suggestions,
            isComplete: score > 80
        };
    }
}

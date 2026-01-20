export const checkListingCompleteness = (listing) => {
    const missing = [];
    let completedSteps = 0;
    const TOTAL_STEPS = 8; // Basics, Location, Pricing, Facilities, Images, Rooms, Rules, Agreements

    // 1. Basics
    if (listing.title && listing.description) completedSteps++;
    else missing.push("Property Basic Info");

    // 2. Location
    if (listing.location?.address && listing.location?.coordinates?.lat) completedSteps++;
    else missing.push("Location Pin");

    // 3. Pricing (Defaults)
    if (listing.pricingDefaults?.deposit) completedSteps++;
    else missing.push("Pricing Defaults");

    // 4. Facilities
    if (listing.facilities?.length > 0) completedSteps++;
    else missing.push("Facilities");

    // 5. Images
    if (listing.images?.length >= 5) completedSteps++;
    else if (listing.images?.length > 0) missing.push("Min 5 Photos Required");
    else missing.push("Property Images");

    // 6. Rooms
    if (listing.rooms?.length > 0) {
        completedSteps++;
        // Check room images
        const roomsWithoutImages = listing.rooms.some(r => !r.images || r.images.length < 2);
        if (roomsWithoutImages) missing.push("Room Images (Min 2/room)");
    } else {
        missing.push("Add at least 1 Room");
    }

    // 7. Rules
    if (listing.rules?.visitors) completedSteps++; // Approx check
    else missing.push("House Rules");

    // 8. Agreements (Mock check for now as schema might not have it yet)
    // Assuming backend will send `hasAgreement: true` or similar, or we check a field
    if (listing.agreementTemplate) completedSteps++;
    else missing.push("Agreement Template");

    const percent = Math.round((completedSteps / TOTAL_STEPS) * 100);

    return { percent, missing, isReady: percent === 100 };
};

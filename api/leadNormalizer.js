function normalizeGoogleLead(place, keyword, location) {
  return {
    name: place.name,
    address: place.formatted_address,
    phone: place.formatted_phone_number || null,
    rating: place.rating || 0,
    reviews: place.user_ratings_total || 0,
    place_id: place.place_id,

    keyword,
    location,

    source: "google",
    created_at: new Date().toISOString()
  };
}

module.exports = { normalizeGoogleLead };
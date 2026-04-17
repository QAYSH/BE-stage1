const axios = require('axios');

// Determine age group from age
function getAgeGroup(age) {
  if (age <= 12) return 'child';
  if (age <= 19) return 'teenager';
  if (age <= 59) return 'adult';
  return 'senior';
}

// Get country with highest probability
function getTopCountry(countries) {
  if (!countries || countries.length === 0) return null;
  return countries.reduce((max, country) => 
    country.probability > max.probability ? country : max
  );
}

// Call Genderize API
async function callGenderizeAPI(name) {
  try {
    const response = await axios.get('https://api.genderize.io', {
      params: { name: name.toLowerCase() },
      timeout: 5000
    });
    
    const { gender, probability, count } = response.data;
    
    if (!gender || count === 0) {
      throw new Error('Genderize returned an invalid response');
    }
    
    return { gender, probability, count };
  } catch (error) {
    if (error.message === 'Genderize returned an invalid response') {
      throw error;
    }
    throw new Error('Genderize returned an invalid response');
  }
}

// Call Agify API
async function callAgifyAPI(name) {
  try {
    const response = await axios.get('https://api.agify.io', {
      params: { name: name.toLowerCase() },
      timeout: 5000
    });
    
    const { age } = response.data;
    
    if (!age && age !== 0) {
      throw new Error('Agify returned an invalid response');
    }
    
    return { age };
  } catch (error) {
    throw new Error('Agify returned an invalid response');
  }
}

// Call Nationalize API
async function callNationalizeAPI(name) {
  try {
    const response = await axios.get('https://api.nationalize.io', {
      params: { name: name.toLowerCase() },
      timeout: 5000
    });
    
    const { country } = response.data;
    
    if (!country || country.length === 0) {
      throw new Error('Nationalize returned an invalid response');
    }
    
    const topCountry = getTopCountry(country);
    return {
      country_id: topCountry.country_id,
      country_probability: topCountry.probability
    };
  } catch (error) {
    throw new Error('Nationalize returned an invalid response');
  }
}

// Call all three APIs in parallel
async function fetchAllAPIData(name) {
  try {
    const [genderData, ageData, nationalityData] = await Promise.all([
      callGenderizeAPI(name),
      callAgifyAPI(name),
      callNationalizeAPI(name)
    ]);
    
    const ageGroup = getAgeGroup(ageData.age);
    
    return {
      gender: genderData.gender,
      gender_probability: genderData.probability,
      sample_size: genderData.count,
      age: ageData.age,
      age_group: ageGroup,
      country_id: nationalityData.country_id,
      country_probability: nationalityData.country_probability
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  fetchAllAPIData,
  getAgeGroup,
  getTopCountry
};
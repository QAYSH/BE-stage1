function validateName(name) {
  // Check if name is missing or empty
  if (!name || name.trim() === '') {
    return {
      valid: false,
      status: 400,
      message: 'Missing or empty name'
    };
  }
  
  // Check if name is a string
  if (typeof name !== 'string') {
    return {
      valid: false,
      status: 422,
      message: 'Invalid type'
    };
  }
  
  return { valid: true };
}

module.exports = {
  validateName
};
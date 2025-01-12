const form = document.getElementById('profileForm');
const inputs = form.querySelectorAll('input');
const submitAlert = document.getElementById('submitAlert'); 

inputs.forEach(input => {
  input.addEventListener('input', () => {
    const error = document.getElementById(input.name + 'Error');
    if(error) {
      error.classList.add('hidden');
      input.classList.remove('border-red-500');
    }
  });
});

function validateForm(formData) {
    const errors = {};
    
    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';
    
    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
  
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
  
    if(!formData.phoneNumber || formData.phoneNumber.trim() === '') {
      errors.phoneNumber = 'Phone number is required';
    } else if(!/^\d{10}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Phone number must be exactly 10 digits';
    }
  
    if(errors.length<0){
      console.log()
    }
  
    return errors;
  }

function showError(field, message) {
  const error = document.getElementById(field + 'Error');
  if(error) {
    error.textContent = message;
    error.classList.remove('hidden');
    document.querySelector('[name="' + field + '"]').classList.add('border-red-500');
  }
}

function showAlert(message, isError = false) {
  submitAlert.textContent = message;
  submitAlert.classList.remove('hidden');
  
  if(isError) {
    submitAlert.className = 'rounded-md p-4 mb-4 bg-red-50 text-red-600 border border-red-200';
  } else {
    submitAlert.className = 'rounded-md p-4 mb-4 bg-green-50 text-green-600 border border-green-200';
  }
  
  setTimeout(() => submitAlert.classList.add('hidden'), 5000);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = {};
  console.log("Hello")
  new FormData(form).forEach((value, key) => {
    formData[key] = value;
  });

  const errors = validateForm(formData);

  if(Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, message]) => {
      showError(field, message);
    });
    return;
  }

  try {
    console.log(formData)
    const res = await fetch('/api/UpdateProfile.php', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if(!res.ok) throw new Error('Failed to update profile');

    showAlert('Profile updated successfully!');
    form.reset();
    
  } catch(err) {
    showAlert(err.message || 'Failed to update profile', true);
  }
});
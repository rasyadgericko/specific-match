const SUPABASE_URL = 'https://bhrdcmfnyjteidbeeuvq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocmRjbWZueWp0ZWlkYmVldXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODA2ODIsImV4cCI6MjA4NzE1NjY4Mn0.fHAXhbiisOVpC-KJ0sBUoMxeU9RlTYP1UD7cfZfjlSE';

const Supabases = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SCREENS
const screens = document.querySelectorAll('.screen');
function showScreen(id) {
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ELEMENTS
const startBtn = document.getElementById('startBtn');
const toStep2 = document.getElementById('toStep2');
const findMatch = document.getElementById('findMatch');
const restartBtn = document.getElementById('restartBtn');
const instagramInput = document.getElementById('instagram');

// START
startBtn.onclick = () => showScreen('step1');

// BACK BUTTONS
document.querySelectorAll('.backBtn').forEach(btn => {
  btn.onclick = () => {
    const parent = btn.closest('.screen');
    if (parent.id === 'step1') {
      showScreen('hero');
    } else if (parent.id === 'step2') {
      showScreen('step1');
    }
  };
});

// INSTAGRAM INPUT - placeholder & @ protection
instagramInput.addEventListener('focus', () => {
  if (!instagramInput.value.startsWith('@')) {
    instagramInput.value = '@';
  }
});
instagramInput.addEventListener('input', () => {
  if (!instagramInput.value.startsWith('@')) {
    instagramInput.value = '@';
  }
});
instagramInput.addEventListener('click', () => {
  if (instagramInput.value === '@') {
    instagramInput.setSelectionRange(1, 1);
  }
});

// SAVE PROFILE
toStep2.onclick = async () => {
  let name = document.getElementById('name').value.trim();
  let instagram = instagramInput.value.trim().toLowerCase();
  const gender = document.getElementById('gender').value;
  const fashion = document.getElementById('fashion').value;
  const age = document.getElementById('age').value;
  const height = document.getElementById('height').value;

  // Gather selected hobbies
  const interests = Array.from(document.querySelectorAll('#step1 .checkbox-group input:checked'))
    .map(cb => cb.value);

  if (!name || !instagram || !gender || !fashion || !age || !height) {
    alert('Complete your profile');
    return;
  }

  if (!instagram.startsWith('@')) instagram = '@' + instagram;

  // check existing
  const { data: existing } = await Supabases
    .from('users')
    .select('*')
    .eq('instagram', instagram)
    .maybeSingle();

  if (!existing) {
    await Supabases.from('users').insert([{
      name, instagram, gender, fashion, age, height, interests
    }]);
  }

  showScreen('step2');
};

// FIND MATCH
findMatch.onclick = async () => {
  const currentInstagram = instagramInput.value.trim().toLowerCase();

  // Step 2 fields
  const prefGenderRadio = document.querySelector('input[name="prefGender"]:checked');
  const prefGender = prefGenderRadio ? prefGenderRadio.value : '';

  const prefFashion = document.getElementById('prefFashion').value;
  const prefAgeSelect = document.getElementById('prefAge');
  const prefAge = prefAgeSelect ? prefAgeSelect.value : '';

  const prefHeightSelect = document.getElementById('prefHeight');
  const prefHeight = prefHeightSelect ? prefHeightSelect.value : '';

  const prefInterests = Array.from(document.querySelectorAll('#step2 .checkbox-group input:checked'))
    .map(cb => cb.value.toLowerCase());

  // Update current user's preferences in Supabase
  await Supabases
    .from('users')
    .update({
      pref_gender: prefGender,
      pref_fashion: prefFashion,
      pref_age: prefAge,
      pref_height: prefHeight,
      pref_interests: prefInterests
    })
    .eq('instagram', currentInstagram);

  // Fetch all other users
  const { data } = await Supabases
    .from('users')
    .select('*')
    .neq('instagram', currentInstagram);

  // Filter matches: gender, fashion, age, height, interests (at least 2)
  const matches = data.filter(u => {
    const userInterests = u.interests ? u.interests.map(i => i.toLowerCase()) : [];

    // Count matched interests
    const matchedInterests = prefInterests.filter(i => userInterests.includes(i));
    if (matchedInterests.length < 2) return false; // need at least 2

    // Check height range if prefHeight is selected
    let heightMatch = true;
    if (prefHeight) {
      const [minH, maxH] = prefHeight.includes('+') 
        ? [parseInt(prefHeight), Infinity] 
        : prefHeight.split('-').map(n => parseInt(n.trim()));

      const userHeight = parseInt(u.height); // ensure it's a number
      heightMatch = userHeight >= minH && userHeight <= maxH;
    }

    // Check age match if prefAge is selected
    let ageMatch = true;
    if (prefAge) {
      const [minA, maxA] = prefAge.split('-').map(n => parseInt(n.trim()));
      const userAge = parseInt(u.age); // ensure it's a number
      ageMatch = userAge >= minA && userAge <= maxA;
    }

    return (!prefGender || u.gender === prefGender) &&
           (!prefFashion || u.fashion === prefFashion) &&
           heightMatch &&
           ageMatch;
  });

  const matchList = document.getElementById('matchList');
  matchList.innerHTML = "";

  if (!matches.length) {
    matchList.innerHTML = "<p>No matches 😢</p>";
  } else {
    matches.forEach(u => {
      const div = document.createElement('div');
      div.className = "match-item";
      div.innerHTML = `
        <div>
          <div class="match-name">${u.name}</div>
          <div class="match-ig">${u.instagram}</div>
        </div>
        <div class="match-score">😍</div>
      `;
      matchList.appendChild(div);
    });
  }

  showScreen('matchScreen');
};

// RESTART
restartBtn.onclick = () => {
  document.querySelectorAll('input').forEach(i => {
    if (i.id === 'instagram') i.value = '@';
    else if (i.type === 'checkbox' || i.type === 'radio') i.checked = false;
    else i.value = '';
  });
  document.querySelectorAll('select').forEach(s => s.value = '');
  document.getElementById('matchList').innerHTML = '';
  showScreen('hero');
};
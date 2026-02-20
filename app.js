const Supabases = window.supabase.createClient(
  'https://bhrdcmfnyjteidbeeuvq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocmRjbWZueWp0ZWlkYmVldXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODA2ODIsImV4cCI6MjA4NzE1NjY4Mn0.fHAXhbiisOVpC-KJ0sBUoMxeU9RlTYP1UD7cfZfjlSE'
);

const screens = document.querySelectorAll('.screen');
function showScreen(id) {
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

const startBtn = document.getElementById('startBtn');
const toStep2 = document.getElementById('toStep2');
const findMatch = document.getElementById('findMatch');
const restartBtn = document.getElementById('restartBtn');

startBtn.onclick = () => showScreen('step1');

// SAVE / USE EXISTING USER
toStep2.onclick = async () => {
  let name = document.getElementById('name').value;
  let instagram = document.getElementById('instagram').value.trim().toLowerCase();
  const personality = document.getElementById('personality').value;
  const interest = document.getElementById('interest').value;

  if (!name || !instagram || !personality || !interest) {
    alert('Complete your profile');
    return;
  }

  // ensure starts with @
  if (!instagram.startsWith('@')) instagram = '@' + instagram;

  const { data: existingUser } = await Supabases
    .from('users')
    .select('*')
    .eq('instagram', instagram)
    .maybeSingle();

  // IF EXISTS → USE IT
  if (!existingUser) {
    const { error } = await Supabases.from('users').insert([
      {
        user_id: 'temp-' + Date.now(),
        name,
        instagram,
        personality,
        interest
      }
    ]);

    if (error) {
      alert('Error saving profile');
      return;
    }
  }

  showScreen('step2');
};

// SCORE
function calculateScore(user, pref) {
  let score = 0;
  if (user.personality === pref.personality) score += 40;
  if (user.interest === pref.interest) score += 40;
  return score + Math.floor(Math.random() * 20);
}

// MATCH
findMatch.onclick = async () => {
  let currentInstagram = document.getElementById('instagram').value.trim().toLowerCase();
  if (!currentInstagram.startsWith('@')) currentInstagram = '@' + currentInstagram;

  const prefPersonality = document.getElementById('prefPersonality').value;
  const prefInterest = document.getElementById('prefInterest').value;

  if (!prefPersonality || !prefInterest) {
    alert('Select your preferences');
    return;
  }

  const { data } = await Supabases
    .from('users')
    .select('*')
    .neq('instagram', currentInstagram);

  const matches = data
    .filter(u => u.personality === prefPersonality && u.interest === prefInterest)
    .map(u => ({
      ...u,
      score: calculateScore(u, {
        personality: prefPersonality,
        interest: prefInterest
      })
    }))
    .sort((a, b) => b.score - a.score);

  const matchList = document.getElementById('matchList');

  if (!matches.length) {
    matchList.innerHTML = `<p style="color:white;">No matches 😢</p>`;
    showScreen('matchScreen');
    return;
  }

  matchList.innerHTML = matches.map(m => `
    <div class="match-item">
      <div>
        <div class="match-name">${m.name}</div>
        <div class="match-ig">${m.instagram}</div>
      </div>
      <div class="match-score">😍</div>
    </div>
  `).join('');

  showScreen('matchScreen');
};

// RESTART
restartBtn.onclick = () => {
  document.querySelectorAll('input').forEach(i => i.value = '');
  document.querySelectorAll('select').forEach(s => s.value = '');
  document.getElementById('matchList').innerHTML = '';
  document.getElementById('instagram').value = '@';
  showScreen('hero');
};
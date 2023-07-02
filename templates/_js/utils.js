{% js %}
function scrollIntoViewIfNeeded(element){
  if(element.getBoundingClientRect().bottom > window.innerHeight) {
    element.scrollIntoView(false);
  }
  if (element.getBoundingClientRect().top < 0) {
    element.scrollIntoView();
  }
}

function formatPercent(num, addSymbol=true) {
  const formattedNum = num.toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return addSymbol ? `${formattedNum}%` : formattedNum;
}

function stateName(stateObj) {
  if(stateObj.englishName.startsWith('Berlin') || stateObj.englishName === stateObj.germanName) {
    return stateObj.englishName;
  }
  return `${stateObj.englishName} (${stateObj.germanName})`;
}

function getDefault(key, fallback) {
  if (typeof sessionStorage === 'object') {
    try {
      const value = localStorage.getItem(key)
      return value === null ? defaults[key] : value;
    } catch (e) {}
    return fallback;
  }
}
function getDefaultNumber(key, fallback) { return +getDefault(key, fallback) }
function getDefaultBoolean(key, fallback) {
  const storedValue = getDefault(key); // localStorage stores strings, so "true" or "false"
  return storedValue ? storedValue === 'true' : !!fallback;
}

function setDefault(key, value) {
  if (typeof sessionStorage === 'object') {
    try {
      localStorage.setItem(key, value);
      defaults[key] = value;
      return true;
    } catch (e) {}
    return false;
  }
}
function setDefaultString(key, value) { setDefault(key, value ? '1' : '')}
function setDefaultNumber(key, value) { setDefault(key, +value)}
function setDefaultBoolean(key, value) { setDefault(key, !!value)}

const occupations = {
  isEmployed: (occupation) => ['employee', 'azubi', 'studentEmployee'].includes(occupation),
  isSelfEmployed: (occupation) => ['selfEmployed', 'studentSelfEmployed'].includes(occupation),
  isUnemployed: (occupation) => ['unemployed', 'student'].includes(occupation),
  isMinijob: (occupation, monthlyIncome) => ['employee', 'studentEmployee'].includes(occupation) && monthlyIncome <= taxes.maxMinijobIncome,
  isLowIncome: (monthlyIncome) => monthlyIncome <= taxes.maxMinijobIncome,
};
{% endjs %}
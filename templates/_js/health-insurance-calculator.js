{% include '_js/constants.js' %}
{% js %}
function calculateHealthInsuranceContributions({age, monthlyIncome, occupation, isMarried, hasChildren, zusatzbeitrag}) {
  const isEmployee = occupation == 'employee';
  const isSelfEmployed = occupation == 'selfEmployed';
  const isWorkingStudent = occupation == 'studentEmployee';
  const isSelfEmployedStudent = occupation == 'studentSelfEmployed';
  const isStudent = isWorkingStudent || isSelfEmployedStudent || occupation == 'student';
  const isUnemployed = occupations.isUnemployed(occupation);
  const isAzubi = occupation == 'azubi';

  const hoursWorked = 20; // TODO: Accept different values

  /***************************************************
  * Tarif and flags
  ***************************************************/
  let tarif = null;
  const flags = new Set();

  if(isStudent) {
    if(age > 30) {
      flags.add('student-over30');
      if(isWorkingStudent) { tarif = 'employee' }
      else if(isSelfEmployedStudent) { tarif = 'selfEmployed' }
      else { tarif = 'selfPay' }
    }
    else{ tarif = 'student' }

    // You're earning too much to be considered a student
    // https://www.haufe.de/personal/haufe-personal-office-platin/student-versicherungsrechtliche-bewertung-einer-selbsts-5-student-oder-selbststaendiger_idesk_PI42323_HI9693887.html
    if(hoursWorked <= 20 && monthlyIncome > 0.75*healthInsurance.maxNebenjobIncome) {
      tarif = isSelfEmployedStudent ? 'selfEmployed' : 'employee';
      flags.add('not-nebenjob');
    }
    else if(hoursWorked > 20 && hoursWorked <= 30 && monthlyIncome > 0.5*healthInsurance.maxNebenjobIncome) {
      tarif = isSelfEmployedStudent ? 'selfEmployed' : 'employee';
      flags.add('not-nebenjob');
    }
    else if(hoursWorked > 30 && monthlyIncome > 0.25*healthInsurance.maxNebenjobIncome) {
      tarif = isSelfEmployedStudent ? 'selfEmployed' : 'employee';
      flags.add('not-nebenjob');
    }
  }

  if(isSelfEmployed) { tarif = 'selfEmployed' }
  if(isUnemployed) { tarif = 'selfPay' }
  if(isEmployee) { tarif = 'employee' }

  if(isAzubi) {
    tarif = 'azubi';
    if(monthlyIncome <= healthInsurance.azubiFreibetrag) {
      flags.add('azubi-free');
    }
  }

  if(monthlyIncome <= Math.max(taxes.maxMinijobIncome, healthInsurance.maxFamilienvericherungIncome) && !isAzubi) {
    // If the minijob income > familienversicherung income, minijobbers still keep
    // their familienversicherung. It's an exception set by §8 SGB V.

    // Azubis can't use Familienversicherung
    // https://www.krankenkasse-vergleich-direkt.de/ratgeber/krankenversicherung-fuer-auszubildende.html
    if(isMarried){
      flags.add('familienversicherung-spouse'); // No age limit
    }
    if(age < 23 || (isStudent && age < 25)) {
      flags.add('familienversicherung-parents');
    }
  }

  if(tarif == 'employee' && !isAzubi) {
    // Azubis don't get the midijob tarif
    // https://www.haufe.de/sozialwesen/versicherungen-beitraege/auszubildende-besonderheiten-bei-den-neuen/besonderheiten-bei-der-beitragsberechnung_240_94670.html
    if(monthlyIncome <= taxes.maxMinijobIncome) {
      tarif = 'selfPay';
      flags.add('minijob');
    }
    else if(monthlyIncome <= healthInsurance.maxMidijobIncome) {
      tarif = 'midijob';
      flags.add('midijob');
    }
  }

  if (monthlyIncome >= healthInsurance.maxMonthlyIncome) {
    flags.add('max-contribution');
  }

  if (monthlyIncome >= healthInsurance.minFreiwilligMonthlyIncome || isUnemployed || tarif === 'selfPay' || tarif === 'selfEmployed' || tarif === 'minijob' || tarif === 'student') {
    flags.add('private');
  }

  if (monthlyIncome <= healthInsurance.minMonthlyIncome && (tarif === 'selfPay' || tarif === 'selfEmployed')) {
    flags.add('min-contribution');
  }

  if (monthlyIncome <= taxes.maxMinijobIncome && !isSelfEmployed && !isAzubi) {
    flags.add('ehic');
  }

  if (isSelfEmployed && (monthlyIncome * 12) >= healthInsurance.kskMinimumIncome) {
    flags.add('ksk');
  }

  if (isUnemployed){
    flags.add('alg-i-buergergeld');
  }

  /***************************************************
  * Monthly income
  ***************************************************/

  // The contribution rate isn't always applied to your full income
  let adjustedMonthlyIncome;
  if(tarif === 'azubi') {
    adjustedMonthlyIncome = Math.min(healthInsurance.maxMonthlyIncome, monthlyIncome);
  }
  else if(tarif === 'employee' || tarif === 'selfPay' || tarif === 'selfEmployed') {
    adjustedMonthlyIncome = Math.min(healthInsurance.maxMonthlyIncome, Math.max(monthlyIncome, healthInsurance.minMonthlyIncome));
  }
  else if(tarif === 'midijob') {
    // Gleitzone formula
    adjustedMonthlyIncome = (
      healthInsurance.factorF * taxes.maxMinijobIncome
      + (
        (healthInsurance.maxMidijobIncome/(healthInsurance.maxMidijobIncome-taxes.maxMinijobIncome))
        - (
          (
            taxes.maxMinijobIncome
            / (healthInsurance.maxMidijobIncome - taxes.maxMinijobIncome)
          )
          * healthInsurance.factorF
        )
      ) * (monthlyIncome - taxes.maxMinijobIncome)
    )
  }

  /***************************************************
  * Base contribution
  ***************************************************/
  const baseContributionValues = {};

  // Total base contribution
  if (tarif === 'selfEmployed') {
    baseContributionValues.totalRate = healthInsurance.selfEmployedTarif;
    baseContributionValues.totalContribution = adjustedMonthlyIncome * baseContributionValues.totalRate;
  }
  else if (tarif === 'selfPay') {
    baseContributionValues.totalRate = healthInsurance.defaultTarif;
    baseContributionValues.totalContribution = adjustedMonthlyIncome * baseContributionValues.totalRate;
  }
  else if(tarif === 'student') { // Students pay a fixed amount: 70% of the normal rate * the bafogBedarfssatz
    baseContributionValues.totalRate = healthInsurance.studentTarif;
    baseContributionValues.totalContribution = healthInsurance.studentTarif * bafogBedarfssatz;
  }
  else {
    baseContributionValues.totalRate = healthInsurance.defaultTarif;
    baseContributionValues.totalContribution = adjustedMonthlyIncome * baseContributionValues.totalRate;
  }

  // Employer contribution
  if (tarif === 'azubi' && monthlyIncome <= healthInsurance.azubiFreibetrag) {  // Below this amount, the employer pays everything
    baseContributionValues.employerRate = baseContributionValues.totalRate;
    baseContributionValues.employerContribution = baseContributionValues.totalContribution;
  }
  else if(tarif === 'midijob') {
    // The employer contribution is calculated with the actual income, not the adjusted Gleitzone income
    baseContributionValues.employerRate = healthInsurance.defaultTarif / 2;
    baseContributionValues.employerContribution = monthlyIncome * baseContributionValues.employerRate;
  }
  else if(tarif === 'selfPay' || tarif === 'selfEmployed') {
    baseContributionValues.employerRate = 0;
    baseContributionValues.employerContribution = 0;
  }
  else if(tarif === 'student') {
    // TODO: How does an employer contribute to a student's health insurance?
    baseContributionValues.employerRate = 0;
    baseContributionValues.employerContribution = 0;
  }
  else {
    baseContributionValues.employerRate = baseContributionValues.totalRate / 2;
    baseContributionValues.employerContribution = adjustedMonthlyIncome * baseContributionValues.employerRate;
  }

  baseContributionValues.personalRate = tarif === 'student' ? undefined : baseContributionValues.totalRate - baseContributionValues.employerRate;
  baseContributionValues.personalContribution = baseContributionValues.totalContribution - baseContributionValues.employerContribution;

  baseContributionValues.totalContribution = roundCurrency(baseContributionValues.totalContribution);
  baseContributionValues.personalContribution = roundCurrency(baseContributionValues.personalContribution);
  baseContributionValues.employerContribution = roundCurrency(baseContributionValues.employerContribution);

  /***************************************************
  * Pflegeversicherung
  ***************************************************/

  // TODO: Different employer contribution in Sachsen. See [PVS] and [PVSATZAN]
  // TODO: Different employee contribution in tax class 3. See [PVZ]

  const pflegeversicherungValues = {};

  // Total rate
  if (age > pflegeversicherung.defaultTarifMaxAge && !hasChildren) {
    pflegeversicherungValues.totalRate = pflegeversicherung.surchargeTarif
    flags.add('pflegeversicherung-surcharge');
  }
  else {
    pflegeversicherungValues.totalRate = pflegeversicherung.defaultTarif
  }

  // Total contribution
  if(tarif === 'student') {
    pflegeversicherungValues.totalContribution = pflegeversicherungValues.totalRate * bafogBedarfssatz;
  }
  else {
    pflegeversicherungValues.totalContribution = pflegeversicherungValues.totalRate * adjustedMonthlyIncome;
  }

  // Personal + employer contributions
  if(tarif === 'azubi' && monthlyIncome <= healthInsurance.azubiFreibetrag) { // Below this, the employer pays everything
    pflegeversicherungValues.employerRate = pflegeversicherungValues.totalRate;
    pflegeversicherungValues.employerContribution = pflegeversicherungValues.totalContribution;
    pflegeversicherungValues.personalRate = 0;
    pflegeversicherungValues.personalContribution = 0;
  }
  else if(tarif === 'midijob') {
    // The employer rate is applied to the actual monthlyIncome, not the adjusted Gleitzone income.
    pflegeversicherungValues.employerRate = pflegeversicherung.employerTarif;
    pflegeversicherungValues.employerContribution = monthlyIncome * pflegeversicherungValues.employerRate;
    pflegeversicherungValues.personalRate = pflegeversicherungValues.totalRate - pflegeversicherungValues.employerRate;
    pflegeversicherungValues.personalContribution = pflegeversicherungValues.totalContribution - pflegeversicherungValues.employerContribution;
  }
  else if(tarif === 'selfPay' || tarif === 'selfEmployed') {
    pflegeversicherungValues.employerRate = 0;
    pflegeversicherungValues.employerContribution = 0;
    pflegeversicherungValues.personalRate = pflegeversicherungValues.totalRate;
    pflegeversicherungValues.personalContribution = pflegeversicherungValues.totalContribution;
  }
  else if (tarif === 'student') {
    // TODO: How does an employer contribute to a student's Pflegeversicherung?
    pflegeversicherungValues.employerRate = 0;
    pflegeversicherungValues.personalRate = pflegeversicherungValues.totalRate;
    pflegeversicherungValues.employerContribution = 0;
    pflegeversicherungValues.personalContribution = pflegeversicherungValues.totalContribution;
  }
  else {
    pflegeversicherungValues.employerRate = pflegeversicherung.employerTarif;
    pflegeversicherungValues.employerContribution = adjustedMonthlyIncome * pflegeversicherungValues.employerRate;
    pflegeversicherungValues.personalRate = pflegeversicherungValues.totalRate - pflegeversicherungValues.employerRate;
    pflegeversicherungValues.personalContribution = pflegeversicherungValues.totalContribution - pflegeversicherungValues.employerContribution;
  }

  pflegeversicherungValues.totalContribution = roundCurrency(pflegeversicherungValues.totalContribution);
  pflegeversicherungValues.personalContribution = roundCurrency(pflegeversicherungValues.personalContribution);
  pflegeversicherungValues.employerContribution = roundCurrency(pflegeversicherungValues.employerContribution);

  /***************************************************
  * Public health insurance options + Zusatzbeitrag
  ***************************************************/
  const allInsurers = Object.entries(healthInsurance.companies);
  if(zusatzbeitrag !== undefined) {
    // Create an extra option with the user-specified Zusatzbeitrag
    allInsurers.push([
      'custom',
      { name: 'Other health insurer', zusatzbeitrag: zusatzbeitrag, }
    ]);
  }
  const insurerOptions = allInsurers.reduce((output, [krankenkasseKey, krankenkasse]) => {

    /***************************************************
    * Zusatzbeitrag
    ***************************************************/
    const zusatzbeitragValues = {}

    if(tarif === 'student') {
      zusatzbeitragValues.totalRate = krankenkasse.zusatzbeitrag;
      zusatzbeitragValues.totalContribution = bafogBedarfssatz * zusatzbeitragValues.totalRate;
    }
    else {
      zusatzbeitragValues.totalRate = krankenkasse.zusatzbeitrag;
      zusatzbeitragValues.totalContribution = adjustedMonthlyIncome * zusatzbeitragValues.totalRate;
    }

    if(tarif === 'azubi') {
      if(monthlyIncome <= healthInsurance.azubiFreibetrag) {  // Below this amount, the employer pays everything
        zusatzbeitragValues.employerRate = zusatzbeitragValues.totalRate;
        zusatzbeitragValues.employerContribution = zusatzbeitragValues.totalContribution;
      }
      else {
        zusatzbeitragValues.employerRate = zusatzbeitragValues.totalRate / 2;
        zusatzbeitragValues.employerContribution = adjustedMonthlyIncome * zusatzbeitragValues.employerRate;
      }
    }
    else if(tarif === 'midijob') {
    // The employer rate is applied to the actual monthlyIncome, not the adjusted Gleitzone income.
      zusatzbeitragValues.employerRate = krankenkasse.zusatzbeitrag / 2;
      zusatzbeitragValues.employerContribution = monthlyIncome * zusatzbeitragValues.employerRate;
    }
    else if(tarif === 'employee') {
      zusatzbeitragValues.employerRate = krankenkasse.zusatzbeitrag / 2;
      zusatzbeitragValues.employerContribution = adjustedMonthlyIncome * zusatzbeitragValues.employerRate;
    }
    else {
      zusatzbeitragValues.employerRate = 0;
      zusatzbeitragValues.employerContribution = 0;
    }

    zusatzbeitragValues.personalRate = zusatzbeitragValues.totalRate - zusatzbeitragValues.employerRate;
    zusatzbeitragValues.personalContribution = zusatzbeitragValues.totalContribution - zusatzbeitragValues.employerContribution;

    zusatzbeitragValues.totalContribution = roundCurrency(zusatzbeitragValues.totalContribution);
    zusatzbeitragValues.personalContribution = roundCurrency(zusatzbeitragValues.personalContribution);
    zusatzbeitragValues.employerContribution = roundCurrency(zusatzbeitragValues.employerContribution);

    /***************************************************
    * Total
    ***************************************************/
    const finalTotal = field => baseContributionValues[field] + pflegeversicherungValues[field] + zusatzbeitragValues[field];
    output[krankenkasseKey] = {
      zusatzbeitrag: zusatzbeitragValues,
      total: {
        totalRate: finalTotal('totalRate'),
        employerRate: finalTotal('employerRate'),
        personalRate: finalTotal('personalRate'),
        totalContribution: roundCurrency(finalTotal('totalContribution')),
        employerContribution: roundCurrency(finalTotal('employerContribution')),
        personalContribution: roundCurrency(finalTotal('personalContribution')),
      }
    }
    return output;
  }, {});

  const insurerOptionsSortedByPrice = Object.values(insurerOptions).sort((a, b) => a.total.personalContribution - b.total.personalContribution);
  insurerOptions.cheapest = insurerOptionsSortedByPrice[0];
  insurerOptions.mostExpensive = insurerOptionsSortedByPrice[insurerOptionsSortedByPrice.length - 1];

  return {
    flags: flags,
    tarif,
    baseContribution: baseContributionValues,
    pflegeversicherung: pflegeversicherungValues,
    options: insurerOptions,
  }
}
{% endjs %}
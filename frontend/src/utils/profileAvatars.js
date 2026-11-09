/**
 * Production Profile Avatar System for SAHAYIKA
 * Provides realistic, optimized Indian profile photography for healthcare workers
 * and community beneficiaries with deterministic fallback.
 */

export const PROFILE_IMAGES = {
  asha_sunita: require('../../assets/profiles/asha_sunita.jpg'),
  meena_devi: require('../../assets/profiles/meena_devi.jpg'),
  rajesh_kumar: require('../../assets/profiles/rajesh_kumar.jpg'),
  aarav_child: require('../../assets/profiles/aarav_child.jpg'),
  kamla_devi: require('../../assets/profiles/kamla_devi.jpg'),
  ramesh_elder: require('../../assets/profiles/ramesh_elder.jpg'),
  priya_young: require('../../assets/profiles/priya_young.jpg'),
  anita_mother: require('../../assets/profiles/anita_mother.jpg'),
};

const BENEFICIARY_POOL = [
  PROFILE_IMAGES.meena_devi,
  PROFILE_IMAGES.rajesh_kumar,
  PROFILE_IMAGES.anita_mother,
  PROFILE_IMAGES.priya_young,
  PROFILE_IMAGES.aarav_child,
  PROFILE_IMAGES.ramesh_elder,
  PROFILE_IMAGES.kamla_devi,
];

/**
 * Returns an authentic profile portrait image source for any worker or beneficiary.
 * @param {string} name - Person name (e.g., 'Sunita Devi', 'Meena Devi', 'Aarav Kumar')
 * @param {string} [role] - Optional role ('ASHA', 'COMMUNITY', 'INFANT', etc.)
 * @returns {any} require(...) image source
 */
export const getProfileAvatar = (name, role = '') => {
  const normName = String(name || '').trim().toLowerCase();
  const normRole = String(role || '').trim().toLowerCase();

  // ASHA Worker portraits
  if (
    normRole.includes('asha') ||
    normRole.includes('worker') ||
    normName.includes('sunita') ||
    normName.includes('sahayika')
  ) {
    return PROFILE_IMAGES.asha_sunita;
  }

  // Specific community personas
  if (normName.includes('meena')) {
    return PROFILE_IMAGES.meena_devi;
  }
  if (normName.includes('rajesh') || normName.includes('rahul') || normName.includes('ramesh kumar')) {
    return PROFILE_IMAGES.rajesh_kumar;
  }
  if (normName.includes('aarav') || normName.includes('infant') || normName.includes('baby') || normName.includes('child')) {
    return PROFILE_IMAGES.aarav_child;
  }
  if (normName.includes('kamla') || normName.includes('dadi') || normName.includes('nani')) {
    return PROFILE_IMAGES.kamla_devi;
  }
  if (normName.includes('ramesh') || normName.includes('dada') || normName.includes('sharma')) {
    return PROFILE_IMAGES.ramesh_elder;
  }
  if (normName.includes('priya') || normName.includes('pooja') || normName.includes('kumari')) {
    return PROFILE_IMAGES.priya_young;
  }
  if (normName.includes('anita') || normName.includes('devi') || normName.includes('mother')) {
    return PROFILE_IMAGES.anita_mother;
  }

  // Deterministic hash assignment for any other names
  if (normName) {
    let hash = 0;
    for (let i = 0; i < normName.length; i++) {
      hash = (hash << 5) - hash + normName.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % BENEFICIARY_POOL.length;
    return BENEFICIARY_POOL[index];
  }

  return PROFILE_IMAGES.asha_sunita;
};

export const getAshaWorkerAvatar = () => PROFILE_IMAGES.asha_sunita;
